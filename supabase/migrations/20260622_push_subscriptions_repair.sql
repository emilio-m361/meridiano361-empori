-- ─────────────────────────────────────────────────────────────────────────────
-- 20260622_push_subscriptions_repair.sql
-- Ripara push_subscriptions: normalizza operatore_nome e collega operatore_id.
--
-- Problema: send-turno-reminder cercava le subscription SOLO per nome
-- (operatore_nome). Se il nome nel record turno differiva anche di poco
-- da quello salvato in push_subscriptions (es. "Chiara" vs "Chiara Monteverdi",
-- spazi diversi, maiuscole/minuscole), la notifica veniva saltata con
-- motivo_skip="nessun token push registrato" anche se la subscription esisteva.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Collega operatore_id dove manca ma il nome combacia ──────────────────
-- Usa lower(trim()) per match case-insensitive / whitespace-tolerante.
UPDATE push_subscriptions ps
SET   operatore_id = o.id,
      updated_at   = now()
FROM  operatori o
WHERE ps.operatore_id IS NULL
  AND lower(trim(ps.operatore_nome)) = lower(trim(o.nome));

-- ── 2. Normalizza operatore_nome al nome canonico da operatori.nome ─────────
-- Una volta che operatore_id è valorizzato possiamo correggere il nome,
-- garantendo che il lookup per nome funzioni anche come fallback.
-- Aggiorna solo le righe dove il nome differisce (case-insensitive).
UPDATE push_subscriptions ps
SET   operatore_nome = o.nome,
      updated_at     = now()
FROM  operatori o
WHERE ps.operatore_id = o.id
  AND lower(trim(coalesce(ps.operatore_nome, ''))) <> lower(trim(o.nome));

-- ── 3. Rieplogo post-repair (utile per debug nel SQL Editor) ─────────────────
-- Decommentare se si vuole vedere il risultato:
-- SELECT ps.operatore_nome, ps.operatore_id, ps.platform, ps.last_seen_at,
--        ps.last_push_ok, o.nome AS nome_canonico
-- FROM   push_subscriptions ps
-- LEFT JOIN operatori o ON o.id = ps.operatore_id
-- ORDER BY ps.operatore_nome;
