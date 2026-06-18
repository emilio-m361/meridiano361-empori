-- Popola operatore_notif_prefs con abilitato=true per tutti gli operatori
-- che non hanno ancora una riga esplicita per ogni tipo di notifica.
-- Operatori che hanno già disabilitato manualmente un tipo non vengono toccati
-- (ON CONFLICT DO NOTHING).

INSERT INTO operatore_notif_prefs (operatore_id, tipo, abilitato)
SELECT o.id, t.tipo, true
FROM operatori o
CROSS JOIN (VALUES ('turni'), ('generali'), ('ordini')) AS t(tipo)
ON CONFLICT (operatore_id, tipo) DO NOTHING;
