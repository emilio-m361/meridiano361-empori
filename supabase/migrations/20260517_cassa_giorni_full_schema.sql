-- Migration: align cassa_giorni with saveDay() payload (100 columns)
-- Safe to run multiple times: all ADD COLUMN use IF NOT EXISTS.
-- Run in Supabase Dashboard → SQL Editor.

-- ── UNIQUE constraint on chiave (required for upsert onConflict:'chiave') ─────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cassa_giorni_chiave_key' AND conrelid = 'cassa_giorni'::regclass
  ) THEN
    ALTER TABLE cassa_giorni ADD CONSTRAINT cassa_giorni_chiave_key UNIQUE (chiave);
  END IF;
END $$;

-- ── STATIC FIELDS ─────────────────────────────────────────────────────────────
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS fondo_cassa        numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS chiuso_da_mat      text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS chiuso_da_pom      text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_mattino       text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_pomeriggio    text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS turno_type         text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS iva_22             numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS iva_10             numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS iva_4              numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS iva_esente         numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS iva_esente_altro      text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS iva_esente_altro_text text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS iva_net_es         numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS iva_somma          numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_corrispettivi  numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_corrispettivi  numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS cassaforte         numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_cassaforte     numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS fondo_residuo      numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_contanti_lordi numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_contanti_netti numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_contanti_lordi numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_contanti_netti numeric;

-- ── COIN COUNTS (valore × quantità per turno) ─────────────────────────────────
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_coin_50   numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_coin_50   numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_coin_20   numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_coin_20   numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_coin_10   numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_coin_10   numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_coin_5    numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_coin_5    numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_coin_2    numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_coin_2    numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_coin_1    numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_coin_1    numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_coin_0_5  numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_coin_0_5  numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_coin_0_2  numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_coin_0_2  numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_coin_0_1  numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_coin_0_1  numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_coin_0_05 numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_coin_0_05 numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_coin_0_02 numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_coin_0_02 numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_coin_0_01 numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_coin_0_01 numeric;

-- ── PAYMENT AMOUNTS ───────────────────────────────────────────────────────────
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_pay_bancomat        numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_pay_bancomat        numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_pay_carte           numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_pay_carte           numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_pay_satispay        numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_pay_satispay        numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_pay_satispay_online numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_pay_satispay_online numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_pay_carte_online    numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_pay_carte_online    numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_pay_paypal          numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_pay_paypal          numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_pay_bonifico        numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_pay_bonifico        numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_pay_gift_card       numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_pay_gift_card       numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_pay_gift_card_online numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_pay_gift_card_online numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_pay_buoni           numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_pay_buoni           numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_pay_rimborsi_online numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_pay_rimborsi_online numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS mat_pay_spese           numeric;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS pom_pay_spese           numeric;

-- ── PAYMENT NOTES ─────────────────────────────────────────────────────────────
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_mat_pay_bancomat        text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_pom_pay_bancomat        text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_mat_pay_carte           text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_pom_pay_carte           text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_mat_pay_satispay        text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_pom_pay_satispay        text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_mat_pay_satispay_online text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_pom_pay_satispay_online text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_mat_pay_carte_online    text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_pom_pay_carte_online    text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_mat_pay_paypal          text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_pom_pay_paypal          text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_mat_pay_bonifico        text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_pom_pay_bonifico        text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_mat_pay_gift_card       text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_pom_pay_gift_card       text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_mat_pay_gift_card_online text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_pom_pay_gift_card_online text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_mat_pay_buoni           text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_pom_pay_buoni           text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_mat_pay_rimborsi_online text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_pom_pay_rimborsi_online text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_mat_pay_spese           text;
ALTER TABLE cassa_giorni ADD COLUMN IF NOT EXISTS note_pom_pay_spese           text;
