-- Prodotti in scadenza per emporio
CREATE TABLE IF NOT EXISTS prodotti_scadenza (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  emporio         text NOT NULL,
  codice          text,
  descrizione     text NOT NULL,
  quantita        integer NOT NULL DEFAULT 1,
  scadenza        date NOT NULL,
  solo_alcuni     boolean NOT NULL DEFAULT false,  -- solo alcuni di questi hanno scadenza ravvicinata
  in_promo        boolean NOT NULL DEFAULT false,  -- messo in promo a scaffale
  sconto_suggerito integer,                        -- calcolato all'inserimento/aggiornamento
  notif_30g_at    timestamptz,                     -- quando è stata inviata la notifica a 30 giorni
  notif_14g_at    timestamptz,                     -- quando è stata inviata la notifica a 14 giorni
  notif_1g_at     timestamptz,                     -- quando è stata inviata la notifica a 1 giorno
  operatore_nome  text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE prodotti_scadenza DISABLE ROW LEVEL SECURITY;
GRANT ALL ON prodotti_scadenza TO anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_ps_emporio   ON prodotti_scadenza (emporio);
CREATE INDEX IF NOT EXISTS idx_ps_scadenza  ON prodotti_scadenza (scadenza);
