-- Fix: aumenta il timeout di net.http_post nei cron da 5000ms (default) a 30000ms.
--
-- Problema: send-turno-reminder e send-scadenza-reminder inviavano notifiche
-- sequenzialmente — con 6+ operatori e 2 subscription a testa, la funzione
-- impiegava ~5 secondi. pg_net killava la chiamata a 5000ms esatti
-- (timed_out: true) prima che la funzione finisse.
--
-- Fix Edge Function: le send sono ora parallele (Promise.allSettled), quindi
-- la funzione completa in <1 secondo. Il timeout esteso è una rete di sicurezza.
--
-- ISTRUZIONE: esegui nel Supabase SQL Editor.

-- ── Turno reminder ───────────────────────────────────────────────────────────
SELECT cron.unschedule('m361-turno-reminder');

SELECT cron.schedule(
  'm361-turno-reminder',
  '0 6,7 * * *',
  $$
    SELECT net.http_post(
      url                  => 'https://hsalynvxazxqtmsvjrzc.supabase.co/functions/v1/send-turno-reminder',
      headers              => '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYWx5bnZ4YXp4cXRtc3ZqcnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MjQ3MjcsImV4cCI6MjA5MzMwMDcyN30.JW4nsMrrfuI8BTg4bn2v74seVJ-_prfxZ1PQp5T18a8"}'::jsonb,
      body                 => '{}'::jsonb,
      timeout_milliseconds => 30000
    )
  $$
);

-- ── Scadenza reminder ────────────────────────────────────────────────────────
SELECT cron.unschedule('m361-scadenza-reminder');

SELECT cron.schedule(
  'm361-scadenza-reminder',
  '15 6,7 * * *',
  $$
    SELECT net.http_post(
      url                  => 'https://hsalynvxazxqtmsvjrzc.supabase.co/functions/v1/send-scadenza-reminder',
      headers              => '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYWx5bnZ4YXp4cXRtc3ZqcnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MjQ3MjcsImV4cCI6MjA5MzMwMDcyN30.JW4nsMrrfuI8BTg4bn2v74seVJ-_prfxZ1PQp5T18a8"}'::jsonb,
      body                 => '{}'::jsonb,
      timeout_milliseconds => 30000
    )
  $$
);

-- Verifica che entrambi siano registrati:
SELECT jobname, schedule, active FROM cron.job
WHERE jobname IN ('m361-turno-reminder', 'm361-scadenza-reminder');
