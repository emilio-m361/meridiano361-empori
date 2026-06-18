-- Cron job: promemoria turno automatico alle 08:00 ora italiana
--
-- ISTRUZIONE: esegui questo script nel Supabase SQL Editor del progetto.
-- Richiede le estensioni pg_cron e pg_net (già abilitate su Supabase).
--
-- Il job gira alle 06:00 UTC (= 08:00 CEST, estate) e alle 07:00 UTC
-- (= 08:00 CET, inverno). La Edge Function controlla internamente il
-- fuso orario Europe/Rome e si auto-ignora se non sono le 8:00 locali.

SELECT cron.schedule(
  'm361-turno-reminder',
  '0 6,7 * * *',
  $$
    SELECT net.http_post(
      url     => 'https://hsalynvxazxqtmsvjrzc.supabase.co/functions/v1/send-turno-reminder',
      headers => '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYWx5bnZ4YXp4cXRtc3ZqcnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MjQ3MjcsImV4cCI6MjA5MzMwMDcyN30.JW4nsMrrfuI8BTg4bn2v74seVJ-_prfxZ1PQp5T18a8"}'::jsonb,
      body    => '{}'::jsonb
    )
  $$
);

-- Per verificare che il job sia registrato:
--   SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'm361-turno-reminder';
--
-- Per rimuoverlo in futuro:
--   SELECT cron.unschedule('m361-turno-reminder');
