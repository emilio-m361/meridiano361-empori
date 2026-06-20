-- Aggiunge colonna desc_nowrap a listini_prezzi
-- Quando true: le descrizioni delle voci vengono tagliate a riga singola in stampa
ALTER TABLE listini_prezzi
  ADD COLUMN IF NOT EXISTS desc_nowrap BOOLEAN DEFAULT FALSE;
