// Supabase Edge Function — send-notification
// Invia notifiche push (Web Push) agli operatori anche con app chiusa.
// Secrets necessari (supabase secrets set ...):
//   VAPID_PUBLIC_KEY   — chiave pubblica VAPID
//   VAPID_PRIVATE_KEY  — chiave privata VAPID
//   VAPID_SUBJECT      — es. mailto:info@meridiano361.it

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

  let body: { target: string; titolo: string; testo: string; mittente: string };
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: "invalid json" }), { status: 400, headers: CORS }); }

  const { target, titolo, testo } = body;
  const results = { push_sent: 0, errors: [] as string[] };

  // ── WEB PUSH ──────────────────────────────────────────────────────────
  if (VAPID_PUB && VAPID_PRIV) {
    webpush.setVapidDetails(VAPID_SUB, VAPID_PUB, VAPID_PRIV);

    let q = db.from("push_subscriptions").select("endpoint, subscription, emporio");
    if (target !== "tutti") q = (q as typeof q).eq("emporio", target);
    const { data: subs } = await q;

    const payload = JSON.stringify({ title: titolo, body: testo || "", url: "/" });

    await Promise.all((subs ?? []).map(async (row: { endpoint: string; subscription: object }) => {
      try {
        await webpush.sendNotification(row.subscription as webpush.PushSubscription, payload);
        results.push_sent++;
      } catch (e: unknown) {
        const status = (e as { statusCode?: number })?.statusCode;
        // Rimuovi sottoscrizioni scadute/non valide
        if (status === 404 || status === 410) {
          await db.from("push_subscriptions").delete().eq("endpoint", row.endpoint);
        } else {
          results.errors.push(`push_err:${String(row.endpoint).slice(-12)}`);
        }
      }
    }));
  }

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json", ...CORS },
  });
});
