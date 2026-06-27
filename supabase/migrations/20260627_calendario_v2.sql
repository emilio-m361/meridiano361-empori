-- Ricrea la tabella con schema completo (ispirato al foglio commerciale)
DROP TABLE IF EXISTS calendario_eventi CASCADE;

CREATE TABLE calendario_eventi (
  id          bigserial PRIMARY KEY,
  anno        int NOT NULL DEFAULT 2026,
  titolo      text NOT NULL,
  settore     text DEFAULT 'G',      -- M, C, G, A, N
  tipologia   text,                  -- Saldi, Promo, Prenotazione, Focus, ...
  meccanica   text,
  data_inizio date,
  data_fine   date,
  -- Per ciascun PDV: { aderisce, azioni, r2026, r2025, r2024, r2023 }
  pdv_data    jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE calendario_eventi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_authenticated_calendario" ON calendario_eventi
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON calendario_eventi TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE calendario_eventi_id_seq TO authenticated;
