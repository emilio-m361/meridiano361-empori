-- Aggiunge tipo_contratto alla tabella operatori.
-- Valori: 'indeterminato' | 'determinato' | 'scu' | 'volontario'
-- Rilevante solo per ruoli dipendente/SCU; per gli altri è ignorato.

ALTER TABLE operatori
  ADD COLUMN IF NOT EXISTS tipo_contratto text DEFAULT NULL;

COMMENT ON COLUMN operatori.tipo_contratto IS 'Tipo contratto: indeterminato | determinato | scu | volontario';

NOTIFY pgrst, 'reload schema';

SELECT 'operatori.tipo_contratto aggiunta' AS stato;
