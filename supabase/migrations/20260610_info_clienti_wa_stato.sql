-- Migrazione: info_clienti v2
-- Aggiunge wa_attivo e normalizza i valori di stato
-- Compatibile con record esistenti (nessuna dato viene perso)

-- 1. Aggiunge colonna wa_attivo (WhatsApp toggle) con default false
ALTER TABLE info_clienti
    ADD COLUMN IF NOT EXISTS wa_attivo BOOLEAN NOT NULL DEFAULT false;

-- 2. Normalizza i vecchi valori di stato:
--    'nuova'    → 'aperta'   (richieste non ancora gestite)
--    'risposto' → 'aperta'   (aveva una risposta ma non era marcata esaurita — rimane aperta)
--    Se archiviata=true → 'esaurita' (indipendentemente dal vecchio stato)
UPDATE info_clienti SET stato = 'esaurita' WHERE archiviata = true  AND stato != 'esaurita';
UPDATE info_clienti SET stato = 'aperta'   WHERE archiviata = false AND stato IN ('nuova', 'risposto');
