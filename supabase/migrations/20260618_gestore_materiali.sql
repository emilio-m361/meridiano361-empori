-- Permesso upload materiali per utenti non-admin selezionati
ALTER TABLE operatori ADD COLUMN IF NOT EXISTS is_gestore_materiali boolean DEFAULT false;

-- Abilita per Chiara Monteverdi
UPDATE operatori SET is_gestore_materiali = true WHERE nome ILIKE '%monteverdi%';
