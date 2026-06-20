-- Aggiunge orientamento e mostra_decimali a listini_prezzi
ALTER TABLE listini_prezzi
  ADD COLUMN IF NOT EXISTS orientamento TEXT DEFAULT 'portrait',
  ADD COLUMN IF NOT EXISTS mostra_decimali BOOLEAN DEFAULT TRUE;
