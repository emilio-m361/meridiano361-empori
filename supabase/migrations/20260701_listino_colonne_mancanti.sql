-- Fix: aggiunge le colonne mancanti a listini_prezzi non incluse nella migration base.
-- Tutte usate dal codice (listino-prezzi.html, print.html, print-multi.html).
-- Idempotente: IF NOT EXISTS non causa errori se già presenti.

ALTER TABLE listini_prezzi
  ADD COLUMN IF NOT EXISTS orientamento      TEXT    DEFAULT 'portrait',
  ADD COLUMN IF NOT EXISTS mostra_decimali   BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS desc_nowrap       BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS logo_top_nascosto BOOLEAN DEFAULT FALSE;

-- Forza il refresh della schema cache di PostgREST
NOTIFY pgrst, 'reload schema';
