import webpush from "npm:web-push@3";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type OpEntry  = { nome?: string; rimosso?: boolean };
type TurnoRec = { emporio: string; turno: string; operatori: OpEntry[] | null };
type Shift    = { turno: string; emporio: string };
type Sub      = { operatore_nome: string; endpoint: string; subscription: object };
type LogEntry = {
  nome: string;
  motivo_skip?: string;
  turni?: Array<{ fascia: string; colleghi: string[] }>;
  body?: string;
};

// "Mario" → primo nome — per testi più corti
function primoNome(nome: string): string {
  return nome.trim().split(/\s+/)[0];
}

// ["Maria", "Luca"] → "Maria e Luca" | ["a","b","c"] → "a, b e c"
function joinNomi(nomi: string[]): string {
  if (nomi.length === 0) return "";
  if (nomi.length === 1) return primoNome(nomi[0]);
  const ini = nomi.slice(0, -1).map(primoNome).join(", ");
  return `${ini} e ${primoNome(nomi.at(-1)!)}`;
}

// Nomi degli altri operatori attivi nel record turno, escluso il destinatario
function altriInTurno(rec: TurnoRec, escludi: string): string[] {
  const escludiKey = escludi.toLowerCase().trim();
  return (rec.operatori ?? [])
    .filter(op => op.nome && !op.rimosso && op.nome.toLowerCase().trim() !== escludiKey)
    .map(op => op.nome as string);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const VAPID_PUB  = Deno.env.get("VAPID_PUBLIC_KEY")  ?? "";
  const VAPID_PRIV = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
  const VAPID_SUB  = Deno.env.get("VAPID_SUBJECT")     ?? "mailto:info@meridiano361.it";

  // Verifica ora italiana — esegui solo alle 08:00 locali.
  const now = new Date();
  const romanHour = parseInt(
    now.toLocaleString("en-US", { timeZone: "Europe/Rome", hour: "numeric", hour12: false }),
    10,
  );

  // ?force=1   → ignora il controllo dell'ora
  // ?dryrun=1  → simula tutto senza inviare push reali (implica force=1)
  // ?operatore=Nome → invia solo a quell'operatore (case-insensitive, per test)
  const urlObj   = new URL(req.url);
  const dryrun   = urlObj.searchParams.get("dryrun") === "1";
  const force    = dryrun || urlObj.searchParams.get("force") === "1";
  const soloOp   = (urlObj.searchParams.get("operatore") ?? "").toLowerCase().trim();

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
  const year  = parseInt(parts.find(p => p.type === "year")!.value,  10);
  const month = parseInt(parts.find(p => p.type === "month")!.value, 10);
  const day   = parseInt(parts.find(p => p.type === "day")!.value,   10);

  const DEFAULT_HOURS = {
    mat_open: "09:15", mat_close: "13:00",
    pom_open: "15:00", pom_close: "19:00",
  };

  // Orari per emporio
  const { data: orariRows } = await db.from("turni_orari").select("emporio, orari");
  const emporiOrari: Record<string, typeof DEFAULT_HOURS> = {};
  for (const row of orariRows ?? []) {
    emporiOrari[row.emporio] = { ...DEFAULT_HOURS, ...(row.orari ?? {}) };
  }

  // Turni aperti di oggi
  const { data: rawTurni, error: turniErr } = await db
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

  const turniOggi: TurnoRec[] = (rawTurni ?? []).map(t => ({
    emporio:    t.emporio,
    turno:      t.turno,
    operatori:  (t.operatori ?? []) as OpEntry[],
  }));

  if (!turniOggi.length) {
    return new Response(
      JSON.stringify({ skipped: true, reason: "nessun turno aperto oggi", date: `${year}-${month}-${day}` }),
      { headers: { "Content-Type": "application/json", ...CORS } },
    );
  }

  // Raggruppa turni per nome operatore → [{turno, emporio}]
  // Solo operatori attivi (non rimosso)
  const operatoriMap = new Map<string, Shift[]>();
  for (const t of turniOggi) {
    for (const op of t.operatori ?? []) {
      if (!op.nome || op.rimosso) continue;
      if (!operatoriMap.has(op.nome)) operatoriMap.set(op.nome, []);
      operatoriMap.get(op.nome)!.push({ turno: t.turno, emporio: t.emporio });
    }
  }

  // Preferenze notifiche disabilitate
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
  const { data: subsRaw } = await db
    .from("push_subscriptions")
    .select("operatore_nome, endpoint, subscription");
  const nomeToSubs = new Map<string, Sub[]>();
  for (const sub of (subsRaw ?? []) as Sub[]) {
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
    date:               `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`,
    operatori_in_turno: operatoriMap.size,
    sent: 0, skipped: 0, failed: 0,
    errors: [] as string[],
    log:   [] as LogEntry[],
  };

  for (const [nome, shifts] of operatoriMap.entries()) {
    // Filtro per singolo operatore (solo in modalità test)
    if (soloOp && !nome.toLowerCase().includes(soloOp)) {
      results.log.push({ nome, motivo_skip: `escluso da filtro ?operatore=${soloOp}` });
      continue;
    }

    const opId = nomeToId.get(nome.toLowerCase().trim());

    // Notifiche turni disabilitate dall'operatore
    if (opId && disabledIds.has(opId)) {
      results.skipped++;
      results.log.push({ nome, motivo_skip: "notifiche turni disabilitate" });
      continue;
    }

    // Ordina: mattina prima di pomeriggio
    const sorted = [...shifts].sort((a, b) => {
      if (a.turno === "mattina" && b.turno !== "mattina") return -1;
      if (a.turno !== "mattina" && b.turno === "mattina") return  1;
      return 0;
    });

    // Costruisci le frasi per ogni fascia con nomi dei colleghi
    const fasceTesto: string[] = [];
    const fasceDiag: Array<{ fascia: string; colleghi: string[] }> = [];
    const seen = new Set<string>();

    for (const s of sorted) {
      // Deduplicazione per emporio+turno (evita doppi se stessa fascia appare due volte)
      const uniqKey = `${s.emporio}:${s.turno}`;
      if (seen.has(uniqKey)) continue;
      seen.add(uniqKey);

      const orari = emporiOrari[s.emporio] ?? DEFAULT_HOURS;
      const orarioLabel = s.turno === "mattina"
        ? `dalle ${orari.mat_open} alle ${orari.mat_close}`
        : `dalle ${orari.pom_open} alle ${orari.pom_close}`;

      // Colleghi in questa fascia (stesso emporio, stesso turno, giorno già filtrato)
      const rec = turniOggi.find(t => t.emporio === s.emporio && t.turno === s.turno);
      const cols = rec ? altriInTurno(rec, nome) : [];

      fasceTesto.push(cols.length > 0 ? `${orarioLabel} con ${joinNomi(cols)}` : orarioLabel);
      fasceDiag.push({ fascia: orarioLabel, colleghi: cols });
    }

    if (!fasceTesto.length) {
      results.skipped++;
      results.log.push({ nome, motivo_skip: "nessuna fascia valida", turni: fasceDiag });
      continue;
    }

    // Frase finale: "dalle X alle Y con A" oppure "dalle X alle Y con A e dalle Z alle W con B"
    const body = `Oggi sei in turno ${
      fasceTesto.length === 1
        ? fasceTesto[0]
        : fasceTesto.slice(0, -1).join(", ") + " e " + fasceTesto.at(-1)
    }`;

    const operatoreSubs = nomeToSubs.get(nome.toLowerCase().trim()) ?? [];
    if (!operatoreSubs.length) {
      results.skipped++;
      results.log.push({ nome, motivo_skip: "nessun token push registrato", turni: fasceDiag, body });
      continue;
    }

    results.log.push({ nome, turni: fasceDiag, body });

    const payload = JSON.stringify({
      title: "M361 — Il tuo turno oggi",
      body,
      url: "/pages/turni/turni.html",
    });

    for (const sub of operatoreSubs) {
      try {
        if (!dryrun) await webpush.sendNotification(sub.subscription as webpush.PushSubscription, payload);
        results.sent++;
      } catch (e: unknown) {
        const status = (e as { statusCode?: number })?.statusCode;
        const msg    = (e as { message?: string })?.message ?? String(e);
        if (status === 404 || status === 410) {
          // Token scaduto/revocato: rimuovi dal DB
          await db.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          const last = results.log.at(-1)!;
          last.motivo_skip = (last.motivo_skip ?? "") +
            `token scaduto rimosso (…${sub.endpoint.slice(-20)}) `;
        } else {
          results.failed++;
          results.errors.push(`${nome}: ${msg.slice(0, 120)}`);
        }
      }
    }
  }

  return new Response(JSON.stringify({ ...results, dryrun }, null, 2), {
    headers: { "Content-Type": "application/json", ...CORS },
  });
});
