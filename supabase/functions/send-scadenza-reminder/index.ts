import webpush from "npm:web-push@3";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Prodotto = {
  id: string; emporio: string; codice: string | null; descrizione: string;
  quantita: number; scadenza: string; solo_alcuni: boolean; in_promo: boolean;
  sconto_suggerito: number | null;
  notif_30g_at: string | null; notif_14g_at: string | null; notif_1g_at: string | null;
};
type Sub = { operatore_nome: string; endpoint: string; subscription: object };

function pad(n: number) { return String(n).padStart(2, "0"); }

function todayRome(): { year: number; month: number; day: number; dateStr: string } {
  const now  = new Date();
  const fmt  = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome", year: "numeric", month: "numeric", day: "numeric",
  });
  const p    = fmt.formatToParts(now);
  const year  = parseInt(p.find(x => x.type === "year")!.value, 10);
  const month = parseInt(p.find(x => x.type === "month")!.value, 10);
  const day   = parseInt(p.find(x => x.type === "day")!.value, 10);
  return { year, month, day, dateStr: `${year}-${pad(month)}-${pad(day)}` };
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function giorniAlla(scadenza: string, todayStr: string): number {
  const t = new Date(todayStr + "T00:00:00");
  const s = new Date(scadenza + "T00:00:00");
  return Math.round((s.getTime() - t.getTime()) / 86400000);
}

function urgenzaLabel(giorni: number): string {
  if (giorni <= 1)  return "domani";
  if (giorni <= 7)  return `tra ${giorni} giorni`;
  if (giorni <= 14) return `tra ${giorni} giorni`;
  return `tra ${giorni} giorni`;
}

function buildPushPayload(prodotto: Prodotto, giorni: number): string {
  const sconto = prodotto.sconto_suggerito;
  const body = `${prodotto.descrizione} (${prodotto.quantita} pz) — scade ${urgenzaLabel(giorni)}.` +
    (sconto && sconto > 0 ? ` Sconto consigliato: −${sconto}%.` : "");
  return JSON.stringify({
    title: "⚠️ Prodotto in scadenza — " + prodotto.emporio,
    body,
    url: "/pages/prodotti-scadenza/prodotti-scadenza.html",
    tag: `scad-${prodotto.id}-${giorni}g`,
  });
}

// ── Email via Resend (opzionale — richiede RESEND_API_KEY come secret Supabase) ──
async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return; // skip se non configurato
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "M361 Empori <notifiche@meridiano361.it>",
        to: [to],
        subject,
        html,
      }),
    });
  } catch (_) { /* ignora errori email */ }
}

function emailHtml(prodotto: Prodotto, giorni: number): string {
  const sconto = prodotto.sconto_suggerito;
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <div style="background:#1e293b;color:#fff;padding:20px;border-radius:12px 12px 0 0">
        <h2 style="margin:0;font-size:18px">⚠️ Prodotto in scadenza</h2>
        <p style="margin:4px 0 0;opacity:.7;font-size:13px">Emporio ${prodotto.emporio}</p>
      </div>
      <div style="padding:20px;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
        <p style="font-size:16px;font-weight:700;color:#1e293b">${prodotto.descrizione}</p>
        ${prodotto.codice ? `<p style="color:#64748b;font-size:13px">Codice: ${prodotto.codice}</p>` : ""}
        <table style="width:100%;border-collapse:collapse;margin:12px 0">
          <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Quantità</td><td style="font-weight:700">${prodotto.quantita} pz${prodotto.solo_alcuni ? " (solo alcuni in scadenza)" : ""}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Scadenza</td><td style="font-weight:700;color:#B5453A">${new Date(prodotto.scadenza + "T00:00:00").toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Giorni rimanenti</td><td style="font-weight:700">${giorni}</td></tr>
          ${sconto && sconto > 0 ? `<tr><td style="padding:6px 0;color:#64748b;font-size:13px">Sconto consigliato</td><td style="font-weight:800;color:#B5453A;font-size:16px">−${sconto}%</td></tr>` : ""}
        </table>
        ${prodotto.in_promo ? `<p style="background:#f5f3ff;color:#7c3aed;padding:8px 12px;border-radius:8px;font-size:13px;font-weight:700">🏷 Già in promo a scaffale</p>` : ""}
        <a href="https://meridiano361-empori.vercel.app/pages/prodotti-scadenza/prodotti-scadenza.html"
           style="display:inline-block;margin-top:12px;background:#B5453A;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px">
          Vai all'app →
        </a>
      </div>
    </div>
  `;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const VAPID_PUB  = Deno.env.get("VAPID_PUBLIC_KEY")  ?? "";
  const VAPID_PRIV = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
  const VAPID_SUB  = Deno.env.get("VAPID_SUBJECT")     ?? "mailto:info@meridiano361.it";

  const url    = new URL(req.url);
  const dryrun = url.searchParams.get("dryrun") === "1";

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { dateStr } = todayRome();
  const in30 = addDays(dateStr, 30);

  // Tutti i prodotti con scadenza entro 30 giorni (non ancora scaduti)
  const { data: prodotti, error: pErr } = await db
    .from("prodotti_scadenza")
    .select("*")
    .gte("scadenza", dateStr)
    .lte("scadenza", in30);

  if (pErr) {
    return new Response(JSON.stringify({ error: pErr.message }), { status: 500, headers: { "Content-Type": "application/json", ...CORS } });
  }

  if (!prodotti?.length) {
    return new Response(JSON.stringify({ skipped: true, reason: "nessun prodotto in scadenza nei prossimi 30 giorni" }), {
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  // Responsabili acquisti → email + push (filtrati per emporio)
  const { data: respAcq } = await db.from("operatori").select("nome, email, emporio").eq("is_resp_acquisti", true).eq("attivo", true);
  const empToRespAcqNomi  = new Map<string, string[]>();
  const empToRespAcqEmail = new Map<string, string[]>();
  for (const op of (respAcq ?? [])) {
    const emp  = (op.emporio ?? "").toLowerCase().trim();
    const nome = (op.nome ?? "").toLowerCase().trim();
    if (!empToRespAcqNomi.has(emp))  empToRespAcqNomi.set(emp, []);
    if (!empToRespAcqEmail.has(emp)) empToRespAcqEmail.set(emp, []);
    empToRespAcqNomi.get(emp)!.push(nome);
    if (op.email) empToRespAcqEmail.get(emp)!.push(op.email);
  }

  // Responsabili emporio → push (per emporio del prodotto)
  const { data: respEmporiRaw } = await db.from("operatori")
    .select("nome, emporio").eq("is_resp_emporio", true).eq("attivo", true);
  const empToRespEmpori = new Map<string, string[]>();
  for (const op of (respEmporiRaw ?? [])) {
    const emp  = (op.emporio ?? "").toLowerCase().trim();
    const nome = (op.nome ?? "").toLowerCase().trim();
    if (!empToRespEmpori.has(emp)) empToRespEmpori.set(emp, []);
    empToRespEmpori.get(emp)!.push(nome);
  }

  const { data: subsRaw } = await db.from("push_subscriptions").select("operatore_nome, endpoint, subscription");
  const nomeToSubs = new Map<string, Sub[]>();
  for (const sub of (subsRaw ?? []) as Sub[]) {
    const key = (sub.operatore_nome ?? "").toLowerCase().trim();
    if (!nomeToSubs.has(key)) nomeToSubs.set(key, []);
    nomeToSubs.get(key)!.push(sub);
  }

  if (VAPID_PUB && VAPID_PRIV) {
    webpush.setVapidDetails(VAPID_SUB, VAPID_PUB, VAPID_PRIV);
  }

  const results = {
    date: dateStr, prodotti_check: prodotti.length,
    notifiche_inviate: 0, email_inviate: 0, failed: 0, errors: [] as string[], log: [] as object[],
  };

  for (const p of prodotti as Prodotto[]) {
    const giorni = giorniAlla(p.scadenza, dateStr);

    // Determina quali notifiche vanno inviate
    const pending: { tipo: "30g" | "14g" | "1g"; field: "notif_30g_at" | "notif_14g_at" | "notif_1g_at" }[] = [];
    if (giorni <= 1  && !p.notif_1g_at)  pending.push({ tipo: "1g",  field: "notif_1g_at" });
    if (giorni <= 14 && !p.notif_14g_at) pending.push({ tipo: "14g", field: "notif_14g_at" });
    if (giorni <= 30 && !p.notif_30g_at) pending.push({ tipo: "30g", field: "notif_30g_at" });
    if (!pending.length) continue;

    const payload = buildPushPayload(p, giorni);
    const subject = `⚠️ Scadenza prodotto: ${p.descrizione} — Emporio ${p.emporio}`;
    const html    = emailHtml(p, giorni);

    const empKey          = (p.emporio ?? "").toLowerCase().trim();
    const rispNomiForEmp  = empToRespAcqNomi.get(empKey)  ?? [];
    const rispEmailForEmp = empToRespAcqEmail.get(empKey) ?? [];

    // Invia push ai responsabili acquisti dello stesso emporio
    if (VAPID_PUB && VAPID_PRIV) {
      for (const nome of rispNomiForEmp) {
        for (const sub of nomeToSubs.get(nome) ?? []) {
          try {
            if (!dryrun) {
              await webpush.sendNotification(sub.subscription as webpush.PushSubscription, payload, { urgency: "high", TTL: 86400 });
            }
            results.notifiche_inviate++;
          } catch (e: unknown) {
            const status = (e as { statusCode?: number })?.statusCode;
            if (status === 404 || status === 410) {
              await db.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
            } else {
              results.failed++;
              results.errors.push(`push ${nome}: ${(e as Error).message?.slice(0, 80)}`);
            }
          }
        }
      }
    }

    // Invia push ai responsabili emporio dello stesso emporio (se non già coperti da resp acquisti)
    if (VAPID_PUB && VAPID_PRIV) {
      const empNomi = empToRespEmpori.get(empKey) ?? [];
      for (const nome of empNomi) {
        if (rispNomiForEmp.includes(nome)) continue; // già notificato come resp acquisti
        for (const sub of nomeToSubs.get(nome) ?? []) {
          try {
            if (!dryrun) {
              await webpush.sendNotification(sub.subscription as webpush.PushSubscription, payload, { urgency: "high", TTL: 86400 });
            }
            results.notifiche_inviate++;
          } catch (e: unknown) {
            const status = (e as { statusCode?: number })?.statusCode;
            if (status === 404 || status === 410) {
              await db.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
            } else {
              results.failed++;
              results.errors.push(`push_emp ${nome}: ${(e as Error).message?.slice(0, 80)}`);
            }
          }
        }
      }
    }

    // Invia email ai responsabili acquisti dello stesso emporio
    for (const email of rispEmailForEmp) {
      if (!dryrun) await sendEmail(email, subject, html);
      results.email_inviate++;
    }

    // Marca le notifiche come inviate
    if (!dryrun) {
      const updates: Record<string, string> = {};
      for (const pn of pending) updates[pn.field] = new Date().toISOString();
      await db.from("prodotti_scadenza").update(updates).eq("id", p.id);
    }

    results.log.push({
      id: p.id, descrizione: p.descrizione, emporio: p.emporio,
      giorni, sconto: p.sconto_suggerito,
      notifiche: pending.map(x => x.tipo),
    });
  }

  return new Response(JSON.stringify({ ...results, dryrun }, null, 2), {
    headers: { "Content-Type": "application/json", ...CORS },
  });
});
