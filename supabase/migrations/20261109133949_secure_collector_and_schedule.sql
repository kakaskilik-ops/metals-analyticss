/*
# Secure market data collection and schedule hourly refresh

Plain-English summary
Only the scheduler and the server may trigger market data collection. A random
collector token is stored in the secure vault. The scheduler sends it with each
call, and the collection function accepts the call only if the token matches.
Browsers never receive the token, so visitors cannot start collection or write prices.

1. New objects
- Vault secret `collector_token` (random 32-byte value, created once).
- Function `verify_collector_token(text)`: returns true only for the exact token.
  Callable only by the server role.
- Scheduled job `collect-market-data` running every hour through pg_cron, calling the
  collection function with pg_net.

2. Security changes
- Revoke all table privileges from `anon` and `authenticated` on market tables and favorites.
- Re-grant read-only SELECT on market tables to `anon` and `authenticated`.
- Re-grant SELECT, INSERT, UPDATE, DELETE on favorites to `authenticated` only.
- RLS policies are unchanged.

3. Important notes
- Idempotent: the vault secret, cron job and function are created or replaced only when missing.
- The schedule runs at minute 0 of every hour.
*/

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'collector_token') THEN
    PERFORM vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'collector_token', 'Token for scheduled market data collection');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.verify_collector_token(p_token text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p_token IS NOT NULL AND EXISTS (
    SELECT 1 FROM vault.decrypted_secrets WHERE name = 'collector_token' AND decrypted_secret = p_token
  );
$$;

REVOKE EXECUTE ON FUNCTION public.verify_collector_token(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_collector_token(text) TO service_role;

REVOKE ALL ON metal_categories, metals, data_sources, metal_source_coverage, price_quotations, price_history, exchange_rates, update_logs, data_quality_records, favorites FROM anon, authenticated;
GRANT SELECT ON metal_categories, metals, data_sources, metal_source_coverage, price_quotations, price_history, exchange_rates, update_logs, data_quality_records TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON favorites TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'collect-market-data') THEN
    PERFORM cron.unschedule('collect-market-data');
  END IF;
END $$;

SELECT cron.schedule(
  'collect-market-data',
  '0 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://hhtwfkdmbxcjjjyhpeij.supabase.co/functions/v1/collect-market-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-collector-token', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'collector_token')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000
  );
  $cron$
);
