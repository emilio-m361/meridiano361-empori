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

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: { target: string; titolo: string; testo: string; mittente?: string; tipo?: string };
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: "invalid json" }), { status: 400, headers: CORS }); }

  // tipo: categoria notifica — usato per rispettare le preferenze operatore.
  // Default "generali" (notifiche admin manuali).
  const { target, titolo, testo, tipo = "generali" } = body;

  const results = {
    push_sent: 0,
    push_failed: 0,
    push_removed: 0,
    subscribers_found: 0,
    vapid_configured: !!(VAPID_PUB && VAPID_PRIV),
    errors: [] as string[],
  };

  if (!VAPID_PUB || !VAPID_PRIV) {
    results.errors.push("VAPID keys not configured");
    return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json", ...CORS } });
  }

  try {
    webpush.setVapidDetails(VAPID_SUB, VAPID_PUB, VAPID_PRIV);
  } catch (e: unknown) {
    results.errors.push("VAPID setup error: " + String(e));
    return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json", ...CORS } });
  }

  // Carica subscriptions per emporio target
  let q = db
    .from("push_subscriptions")
    .select("endpoint, subscription, emporio, operatore_nome, operatore_id");
  if (target !== "tutti") q = q.eq("emporio", target);
  const { data: rawSubs, error: dbErr } = await q;

  if (dbErr) {
    results.errors.push("DB error: " + dbErr.message);
    return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json", ...CORS } });
  }

  // Filtra per preferenze notifiche: escludi chi ha disabilitato questa categoria.
  // Se la riga in operatore_notif_prefs non esiste → default = abilitato.
  let filteredSubs = rawSubs ?? [];
  if (filteredSubs.length > 0) {
    const { data: prefsDisab } = await db
      .from("operatore_notif_prefs")
      .select("operatore_id")
      .eq("tipo", tipo)
      .eq("abilitato", false);

    if (prefsDisab?.length) {
      const disabledIds = new Set(prefsDisab.map(p => p.operatore_id as string));
      // Escludi subscription legate a operatori che hanno disabilitato questa categoria
      filteredSubs = filteredSubs.filter(s =>
        !s.operatore_id || !disabledIds.has(s.operatore_id)
      );
    }
  }

  results.subscribers_found = filteredSubs.length;
  const payload = JSON.stringify({ title: titolo, body: testo || "", url: "/" });

  await Promise.all(filteredSubs.map(async (row) => {
    try {
      await webpush.sendNotification(row.subscription as webpush.PushSubscription, payload);
      results.push_sent++;
    } catch (e: unknown) {
      const status = (e as { statusCode?: number })?.statusCode;
      const msg    = (e as { message?: string })?.message ?? String(e);
      if (status === 404 || status === 410) {
        await db.from("push_subscriptions").delete().eq("endpoint", row.endpoint);
        results.push_removed++;
      } else {
        results.push_failed++;
        results.errors.push(`send_err(${status ?? "?"}): ${msg.slice(0, 120)}`);
      }
    }
  }));

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json", ...CORS },
  });
});
