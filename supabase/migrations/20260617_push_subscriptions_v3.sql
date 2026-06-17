-- push_subscriptions v3: platform, device_id, last_seen_at, last_push_at, last_push_ok
ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS platform       text,         -- 'android' | 'ios' | 'desktop'
  ADD COLUMN IF NOT EXISTS device_id      text,         -- id stabile per dispositivo (localStorage)
  ADD COLUMN IF NOT EXISTS last_seen_at   timestamptz,  -- ultima registrazione SW
  ADD COLUMN IF NOT EXISTS last_push_at   timestamptz,  -- ultimo invio
  ADD COLUMN IF NOT EXISTS last_push_ok   boolean,      -- esito ultimo invio
  ADD COLUMN IF NOT EXISTS updated_at     timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_push_subs_op_id ON push_subscriptions(operatore_id);

GRANT UPDATE (platform, device_id, last_seen_at, last_push_at, last_push_ok, updated_at)
  ON push_subscriptions TO anon;
