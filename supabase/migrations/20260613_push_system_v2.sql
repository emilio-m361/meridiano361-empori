-- ─────────────────────────────────────────────────────────────────────────────
-- 20260613_push_system_v2.sql
-- Push system v2: operatore_id tracciato, preferenze notifiche, login tracking
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Collega ogni push_subscription all'operatore (UUID) ──────────────────
-- Permette di filtrare le push per utente reale invece che per stringa nome.
ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS operatore_id UUID
    REFERENCES operatori(id) ON DELETE SET NULL;

-- ── 2. Preferenze notifiche per singolo operatore ───────────────────────────
-- L'operatore può disattivare singole categorie di notifica.
-- Se non esiste una riga per (operatore_id, tipo) → default = abilitato.
CREATE TABLE IF NOT EXISTS operatore_notif_prefs (
  id            BIGSERIAL   PRIMARY KEY,
  operatore_id  UUID        NOT NULL REFERENCES operatori(id) ON DELETE CASCADE,
  tipo          TEXT        NOT NULL,  -- 'turni' | 'generali' | 'ordini' | 'calendario'
  abilitato     BOOLEAN     NOT NULL DEFAULT true,
  UNIQUE (operatore_id, tipo)
);

-- RLS: accesso completo (autenticazione gestita a livello app)
ALTER TABLE operatore_notif_prefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all_notif_prefs" ON operatore_notif_prefs;
CREATE POLICY "anon_all_notif_prefs" ON operatore_notif_prefs
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── 3. Tracking primo accesso e ultimo accesso ───────────────────────────────
-- Popolati da login.html al momento dell'autenticazione.
ALTER TABLE operatori
  ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE operatori
  ADD COLUMN IF NOT EXISTS last_login_at  TIMESTAMPTZ DEFAULT NULL;

-- ── 4. Cron job — Promemoria turno alle 8:00 (istruzione manuale) ───────────
--
-- Per attivare il promemoria automatico delle 8:00, esegui in Supabase
-- SQL Editor (richiede l'estensione pg_cron abilitata nel progetto):
--
--   SELECT cron.schedule(
--     'm361-turno-reminder',
--     '0 6,7 * * *',
--     $$
--       SELECT net.http_post(
--         url        => 'https://hsalynvxazxqtmsvjrzc.supabase.co/functions/v1/send-turno-reminder',
--         headers    => '{"Content-Type":"application/json","Authorization":"Bearer <SERVICE_ROLE_KEY>"}',
--         body       => '{}'
--       )
--     $$
--   );
--
-- Il cron gira alle 06:00 e 07:00 UTC (= 08:00 ora italiana in estate e inverno).
-- La Edge Function controlla internamente se è effettivamente le 8:00 italiane
-- e ignora la chiamata altrimenti (idempotente).
--
-- Per rimuovere il cron in futuro:
--   SELECT cron.unschedule('m361-turno-reminder');
