import webpush from "npm:web-push@3";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const VAPID_PUB  = Deno.env.get("VAPID_PUBLIC_KEY")  ?? "";
  const VAPID_PRIV = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
  const VAPID_SUB  = Deno.env.get("VAPID_SUBJECT")     ?? "mailto:info@meridiano361.it";

  // Verifica ora italiana — esegui solo alle 08:00 locali.
  // Il cron pg_cron lo chiama alle 06:00 e 07:00 UTC, la funzione si auto-skippa
  // se l'ora locale non è esattamente le 8.
  const now = new Date();
  const romanHour = parseInt(
    now.toLocaleString("en-US", { timeZone: "Europe/Rome", hour: "numeric", hour12: false }),
    10,
  );

  // ?force=1 permette di testare la funzione a qualsiasi ora
  const url   = new URL(req.url);
  const force = url.searchParams.get("force") === "1";

  if (!force && romanHour !== 8) {
    return new Response(
      JSON.stringify({ skipped: true, reason: `ora italiana: ${romanHour}h (non le 8:00)` }),
      { headers: { "Content-Type": "application/json", ...CORS } },
    );
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Data odierna in fuso Europe/Rome
  const dateFmt = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    year: "numeric", month: "numeric", day: "numeric",
  });
  const parts = dateFmt.formatToParts(now);
  const year  = parseInt(parts.find(p => p.type === "year")!.value, 10);
  const month = parseInt(parts.find(p => p.type === "month")!.value, 10);
  const day   = parseInt(parts.find(p => p.type === "day")!.value, 10);

  const DEFAULT_HOURS = {
    mat_open: "09:15", mat_close: "13:00",
    pom_open: "15:00", pom_close: "19:00",
  };

  // Orari per emporio dalla tabella turni_orari
  const { data: orariRows } = await db.from("turni_orari").select("emporio, orari");
  const emporiOrari: Record<string, typeof DEFAULT_HOURS> = {};
  for (const row of orariRows ?? []) {
    emporiOrari[row.emporio] = { ...DEFAULT_HOURS, ...(row.orari ?? {}) };
  }

  // Turni aperti di oggi
  const { data: turniOggi, error: turniErr } = await db
    .from("turni")
    .select("emporio, turno, operatori")
    .eq("anno", year)
    .eq("mese", month)
    .eq("giorno", day)
    .eq("aperto", true);

  if (turniErr) {
    return new Response(
      JSON.stringify({ error: "DB error turni: " + turniErr.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS } },
    );
  }

  if (!turniOggi?.length) {
    return new Response(
      JSON.stringify({ skipped: true, reason: "nessun turno aperto oggi", date: `${year}-${month}-${day}` }),
      { headers: { "Content-Type": "application/json", ...CORS } },
    );
  }

  // Raggruppa turni per nome operatore → [{turno, emporio}]
  type Shift = { turno: string; emporio: string };
  const operatoriMap = new Map<string, Shift[]>();
  for (const t of turniOggi) {
    for (const op of (t.operatori ?? []) as Array<{ nome?: string; rimosso?: boolean }>) {
      if (!op.nome || op.rimosso) continue;
      const key = op.nome;
      if (!operatoriMap.has(key)) operatoriMap.set(key, []);
      operatoriMap.get(key)!.push({ turno: t.turno, emporio: t.emporio });
    }
  }

  // Operatori con notifiche turni disabilitate
  const { data: prefsDisab } = await db
    .from("operatore_notif_prefs")
    .select("operatore_id")
    .eq("tipo", "turni")
    .eq("abilitato", false);
  const disabledIds = new Set((prefsDisab ?? []).map(p => p.operatore_id as string));

  // Mappa nome → id operatore (case-insensitive)
  const { data: tuttiOp } = await db.from("operatori").select("id, nome");
  const nomeToId = new Map<string, string>();
  for (const op of tuttiOp ?? []) {
    if (op.nome) nomeToId.set(op.nome.toLowerCase().trim(), op.id);
  }

  // Mappa nome → push subscriptions
  const { data: subs } = await db
    .from("push_subscriptions")
    .select("operatore_nome, endpoint, subscription");
  type Sub = { operatore_nome: string; endpoint: string; subscription: object };
  const nomeToSubs = new Map<string, Sub[]>();
  for (const sub of (subs ?? []) as Sub[]) {
    const key = (sub.operatore_nome ?? "").toLowerCase().trim();
    if (!nomeToSubs.has(key)) nomeToSubs.set(key, []);
    nomeToSubs.get(key)!.push(sub);
  }

  if (!VAPID_PUB || !VAPID_PRIV) {
    return new Response(
      JSON.stringify({ error: "VAPID keys non configurate" }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS } },
    );
  }
  webpush.setVapidDetails(VAPID_SUB, VAPID_PUB, VAPID_PRIV);

  const results = {
    date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    operatori_in_turno: operatoriMap.size,
    sent: 0, skipped: 0, failed: 0,
    errors: [] as string[],
  };

  for (const [nome, shifts] of operatoriMap.entries()) {
    const opId = nomeToId.get(nome.toLowerCase().trim());

    // Salta se ha disabilitato le notifiche turni
    if (opId && disabledIds.has(opId)) { results.skipped++; continue; }

    // Costruisci testo fasce orarie — ordina: mattina prima di pomeriggio
    const sorted = [...shifts].sort((a, b) => {
      if (a.turno === "mattina" && b.turno !== "mattina") return -1;
      if (a.turno !== "mattina" && b.turno === "mattina") return 1;
      return 0;
    });

    const fasce: string[] = [];
    const seen = new Set<string>();
    for (const s of sorted) {
      const orari = emporiOrari[s.emporio] ?? DEFAULT_HOURS;
      const label = s.turno === "mattina"
        ? `dalle ${orari.mat_open} alle ${orari.mat_close}`
        : `dalle ${orari.pom_open} alle ${orari.pom_close}`;
      if (!seen.has(label)) { seen.add(label); fasce.push(label); }
    }

    if (!fasce.length) { results.skipped++; continue; }

    // "Oggi sei in turno dalle X alle Y" oppure "… e dalle Z alle W"
    const body = fasce.length === 1
      ? `Oggi sei in turno ${fasce[0]}`
      : `Oggi sei in turno ${fasce.slice(0, -1).join(", ")} e ${fasce.at(-1)}`;

    const operatoreSubs = nomeToSubs.get(nome.toLowerCase().trim()) ?? [];
    if (!operatoreSubs.length) { results.skipped++; continue; }

    const payload = JSON.stringify({
      title: "M361 — Il tuo turno oggi",
      body,
      url: "/pages/turni/turni.html",
    });

    for (const sub of operatoreSubs) {
      try {
        await webpush.sendNotification(sub.subscription as webpush.PushSubscription, payload);
        results.sent++;
      } catch (e: unknown) {
        const status = (e as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await db.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        } else {
          results.failed++;
          results.errors.push(`${nome}: ${String(e).slice(0, 100)}`);
        }
      }
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json", ...CORS },
  });
});
