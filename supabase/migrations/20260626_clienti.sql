-- Rubrica clienti
CREATE TABLE IF NOT EXISTS clienti (
  id          bigserial    PRIMARY KEY,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  nome        text         NOT NULL,
  cognome     text         NOT NULL,
  telefono    text,
  wa          boolean      NOT NULL DEFAULT true,
  email       text,
  emporio     text,
  note        text
);

ALTER TABLE clienti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_clienti" ON clienti
  FOR ALL TO anon USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON clienti TO anon;
GRANT USAGE, SELECT ON SEQUENCE clienti_id_seq TO anon;
