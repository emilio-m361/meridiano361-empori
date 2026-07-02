import webpush from "npm:web-push@3";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type OpEntry  = { nome?: string; rimosso?: boolean };
type TurnoRec = { emporio: string; turno: string; operatori: OpEntry[] | null };
type Shift    = { turno: string; emporio: string };
type Sub      = { operatore_nome: string; operatore_id: string | null; endpoint: string; subscription: object };
type LogEntry = {
  nome: string;
  motivo_skip?: string;
  turni?: Array<{ fascia: string; colleghi: string[] }>;
  body?: string;
};

function primoNome(nome: string): string {
  return nome.trim().split(/\s+/)[0];
}

function joinNomi(nomi: string[]): string {
  if (nomi.length === 0) return "";
  if (nomi.length === 1) return primoNome(nomi[0]);
  const ini = nomi.slice(0, -1).map(primoNome).join(", ");
  return `${ini} e ${primoNome(nomi.at(-1)!)}`;
}

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

  const now = new Date();
  const romanHour = parseInt(
    now.toLocaleString("en-US", { timeZone: "Europe/Rome", hour: "numeric", hour12: false }),
    10,
  );

  const urlObj    = new URL(req.url);
  const dryrun    = urlObj.searchParams.get("dryrun") === "1";
  const force     = dryrun || urlObj.searchParams.get("force") === "1";
  const soloOp    = (urlObj.searchParams.get("operatore") ?? "").toLowerCase().trim();
  const customMsg = urlObj.searchParams.get("msg") ?? "";

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

  // ── Carica tutti i dati in parallelo ────────────────────────────────────────
  const [
    { data: orariRows },
    { data: rawTurni, error: turniErr },
    { data: prefsDisab },
    { data: tuttiOp },
    { data: subsRaw },
  ] = await Promise.all([
    db.from("turni_orari").select("emporio, orari"),
    db.from("turni").select("emporio, turno, operatori")
      .eq("anno", year).eq("mese", month).eq("giorno", day).eq("aperto", true),
    db.from("operatore_notif_prefs").select("operatore_id").eq("tipo", "turni").eq("abilitato", false),
    db.from("operatori").select("id, nome"),
    db.from("push_subscriptions").select("operatore_nome, operatore_id, endpoint, subscription"),
  ]);

  if (turniErr) {
    return new Response(
      JSON.stringify({ error: "DB error turni: " + turniErr.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS } },
    );
  }

  const emporiOrari: Record<string, typeof DEFAULT_HOURS> = {};
  for (const row of orariRows ?? []) {
    emporiOrari[row.emporio] = { ...DEFAULT_HOURS, ...(row.orari ?? {}) };
  }

  const turniOggi: TurnoRec[] = (rawTurni ?? []).map(t => ({
    emporio:   t.emporio,
    turno:     t.turno,
    operatori: (t.operatori ?? []) as OpEntry[],
  }));

  if (!turniOggi.length) {
    return new Response(
      JSON.stringify({ skipped: true, reason: "nessun turno aperto oggi", date: `${year}-${month}-${day}` }),
      { headers: { "Content-Type": "application/json", ...CORS } },
    );
  }

  // Raggruppa turni per nome operatore
  const operatoriMap = new Map<string, Shift[]>();
  for (const t of turniOggi) {
    for (const op of t.operatori ?? []) {
      if (!op.nome || op.rimosso) continue;
      if (!operatoriMap.has(op.nome)) operatoriMap.set(op.nome, []);
      operatoriMap.get(op.nome)!.push({ turno: t.turno, emporio: t.emporio });
    }
  }

  const disabledIds = new Set((prefsDisab ?? []).map(p => p.operatore_id as string));

  const nomeToId  = new Map<string, string>();
  const idToNome  = new Map<string, string>();
  for (const op of tuttiOp ?? []) {
    if (op.nome) {
      nomeToId.set(op.nome.toLowerCase().trim(), op.id);
      idToNome.set(op.id, op.nome);
    }
  }

  const nomeToSubs = new Map<string, Sub[]>();
  const idToSubs   = new Map<string, Sub[]>();
  for (const sub of (subsRaw ?? []) as Sub[]) {
    const key = (sub.operatore_nome ?? "").toLowerCase().trim();
    if (key) {
      if (!nomeToSubs.has(key)) nomeToSubs.set(key, []);
      nomeToSubs.get(key)!.push(sub);
    }
    if (sub.operatore_id) {
      if (!idToSubs.has(sub.operatore_id)) idToSubs.set(sub.operatore_id, []);
      idToSubs.get(sub.operatore_id)!.push(sub);
    }
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

  // ── Costruisci lista di task da inviare in parallelo ────────────────────────
  type SendTask = { sub: Sub; payload: string; nome: string };
  const sendTasks: SendTask[] = [];

  for (const [nome, shifts] of operatoriMap.entries()) {
    if (soloOp && !nome.toLowerCase().includes(soloOp)) {
      results.log.push({ nome, motivo_skip: `escluso da filtro ?operatore=${soloOp}` });
      continue;
    }

    let opId = nomeToId.get(nome.toLowerCase().trim());
    if (!opId) {
      const nomeKey = nome.toLowerCase().trim();
      for (const [canonKey, id] of nomeToId.entries()) {
        if (canonKey.includes(nomeKey) || nomeKey.includes(canonKey)) {
          opId = id; break;
        }
      }
    }

    if (opId && disabledIds.has(opId)) {
      results.skipped++;
      results.log.push({ nome, motivo_skip: "notifiche turni disabilitate" });
      continue;
    }

    const sorted = [...shifts].sort((a, b) => {
      if (a.turno === "mattina" && b.turno !== "mattina") return -1;
      if (a.turno !== "mattina" && b.turno === "mattina") return  1;
      return 0;
    });

    const fasceTesto: string[] = [];
    const fasceDiag: Array<{ fascia: string; colleghi: string[] }> = [];
    const seenFasce = new Set<string>();

    for (const s of sorted) {
      const uniqKey = `${s.emporio}:${s.turno}`;
      if (seenFasce.has(uniqKey)) continue;
      seenFasce.add(uniqKey);

      const orari = emporiOrari[s.emporio] ?? DEFAULT_HOURS;
      const orarioLabel = s.turno === "mattina"
        ? `dalle ${orari.mat_open} alle ${orari.mat_close}`
        : `dalle ${orari.pom_open} alle ${orari.pom_close}`;

      const rec  = turniOggi.find(t => t.emporio === s.emporio && t.turno === s.turno);
      const cols = rec ? altriInTurno(rec, nome) : [];
      fasceTesto.push(cols.length > 0 ? `${orarioLabel} con ${joinNomi(cols)}` : orarioLabel);
      fasceDiag.push({ fascia: orarioLabel, colleghi: cols });
    }

    if (!fasceTesto.length) {
      results.skipped++;
      results.log.push({ nome, motivo_skip: "nessuna fascia valida", turni: fasceDiag });
      continue;
    }

    const body = customMsg || `Oggi sei in turno ${
      fasceTesto.length === 1
        ? fasceTesto[0]
        : fasceTesto.slice(0, -1).join(", ") + " e " + fasceTesto.at(-1)
    }`;

    // Raccogli subscription (deduplicato per endpoint)
    const seenEndpoints = new Set<string>();
    const operatoreSubs: Sub[] = [];

    if (opId) {
      for (const s of idToSubs.get(opId) ?? []) {
        if (!seenEndpoints.has(s.endpoint)) { seenEndpoints.add(s.endpoint); operatoreSubs.push(s); }
      }
    }
    for (const s of nomeToSubs.get(nome.toLowerCase().trim()) ?? []) {
      if (!seenEndpoints.has(s.endpoint)) { seenEndpoints.add(s.endpoint); operatoreSubs.push(s); }
    }
    if (opId) {
      const nomeCanon = (idToNome.get(opId) ?? "").toLowerCase().trim();
      if (nomeCanon && nomeCanon !== nome.toLowerCase().trim()) {
        for (const s of nomeToSubs.get(nomeCanon) ?? []) {
          if (!seenEndpoints.has(s.endpoint)) { seenEndpoints.add(s.endpoint); operatoreSubs.push(s); }
        }
      }
    }

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
      tag: `m361-turno-${results.date}`,
    });

    for (const sub of operatoreSubs) {
      sendTasks.push({ sub, payload, nome });
    }
  }

  // ── Invia tutte le notifiche in parallelo ───────────────────────────────────
  if (!dryrun && sendTasks.length > 0) {
    const sendResults = await Promise.allSettled(
      sendTasks.map(async ({ sub, payload }) => {
        await webpush.sendNotification(
          sub.subscription as webpush.PushSubscription,
          payload,
          { urgency: "high", TTL: 43200 },
        );
        await db.from("push_subscriptions")
          .update({ last_push_at: new Date().toISOString(), last_push_ok: true })
          .eq("endpoint", sub.endpoint);
      })
    );

    for (let i = 0; i < sendResults.length; i++) {
      const r = sendResults[i];
      if (r.status === "fulfilled") {
        results.sent++;
      } else {
        const e      = r.reason as { statusCode?: number; message?: string };
        const status = e?.statusCode;
        const msg    = e?.message ?? String(r.reason);
        if (status === 404 || status === 410) {
          await db.from("push_subscriptions").delete().eq("endpoint", sendTasks[i].sub.endpoint);
          const logEntry = results.log.find(l => l.nome === sendTasks[i].nome);
          if (logEntry) logEntry.motivo_skip = (logEntry.motivo_skip ?? "") + `token scaduto rimosso `;
        } else {
          results.failed++;
          await db.from("push_subscriptions")
            .update({ last_push_at: new Date().toISOString(), last_push_ok: false })
            .eq("endpoint", sendTasks[i].sub.endpoint);
          results.errors.push(`${sendTasks[i].nome}: ${msg.slice(0, 120)}`);
        }
      }
    }
  } else if (dryrun) {
    results.sent = sendTasks.length;
  }

  return new Response(JSON.stringify({ ...results, dryrun }, null, 2), {
    headers: { "Content-Type": "application/json", ...CORS },
  });
});
