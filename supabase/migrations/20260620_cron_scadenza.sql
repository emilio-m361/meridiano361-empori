-- Cron: controllo prodotti in scadenza ogni mattina alle 08:15 ora italiana
-- Viene eseguito dopo il reminder turni (08:00) per non sovraccaricare

SELECT cron.schedule(
  'm361-scadenza-reminder',
  '15 6,7 * * *',
  $$
    SELECT net.http_post(
      url     => 'https://hsalynvxazxqtmsvjrzc.supabase.co/functions/v1/send-scadenza-reminder',
      headers => '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYWx5bnZ4YXp4cXRtc3ZqcnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MjQ3MjcsImV4cCI6MjA5MzMwMDcyN30.JW4nsMrrfuI8BTg4bn2v74seVJ-_prfxZ1PQp5T18a8"}'::jsonb,
      body    => '{}'::jsonb
    )
  $$
);
