-- Aggiunge il canale email alle preferenze di notifica per operatore
-- abilitato = push abilitato (esistente, compatibilità)
-- email_abilitato = notifica via email (nuovo)

ALTER TABLE operatore_notif_prefs
  ADD COLUMN IF NOT EXISTS email_abilitato BOOLEAN NOT NULL DEFAULT false;

-- Popola righe mancanti con default: push on, email off
INSERT INTO operatore_notif_prefs (operatore_id, tipo, abilitato, email_abilitato)
SELECT o.id, t.tipo, true, false
FROM operatori o
CROSS JOIN (VALUES ('turni'), ('generali'), ('ordini')) AS t(tipo)
ON CONFLICT (operatore_id, tipo) DO NOTHING;
