-- Aggiunge il flag per il responsabile del personale nella tabella operatori.
-- Il flag determina chi può gestire gli operatori del proprio emporio
-- dalla sezione Impostazioni (vista resp-content).

ALTER TABLE operatori
  ADD COLUMN IF NOT EXISTS is_resp_personale boolean NOT NULL DEFAULT false;

-- Grant esplicito per anon (service key già ha accesso completo)
GRANT UPDATE (is_resp_personale) ON operatori TO anon;
