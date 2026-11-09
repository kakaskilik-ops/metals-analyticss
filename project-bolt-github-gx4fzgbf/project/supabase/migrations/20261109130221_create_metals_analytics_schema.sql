/*
# Create metals analytics schema — multi-source market intelligence platform

Plain-English summary
This migration creates the complete database schema for the METALS ANALYTICS platform.
It stores: the metal catalog, data source registry, individual price quotations from multiple
sources, daily price history, indicative exchange rates, user favorites, ingestion update logs,
and data quality checks.

The app is public (no sign-in screen), so catalog and market tables are readable by anonymous
visitors. Writing market data is done by a server-side edge function using the service role key,
so visitors cannot insert or change prices.

1. New Tables
- `metal_categories`: category id, name, short name, description, display order.
- `metals`: catalog of metals with symbol, names, category, unit, currency, base price (demo), description.
- `data_sources`: price sources with URL, market type, region, quality score, connection status, API key required flag, attribution/license text, free tier limits.
- `metal_source_coverage`: maps which source supplies which metal, with the source's symbol for that metal.
- `price_quotations`: individual price quotations from a source at a given time, with original + normalized currency/unit/price, grade, form, region, market type, bid/ask/transaction prices, data status (LIVE/DEMO), validation status, source attribution.
- `price_history`: daily price bars per metal and source (open, high, low, close).
- `exchange_rates`: indicative currency rates with their date, origin provider, and LIVE/DEMO status.
- `favorites`: metals a signed-in user has starred (unused until auth is built).
- `update_logs`: history of data ingestion runs (job, status, timing, rows written, message).
- `data_quality_records`: results of quality checks per source and metal.

2. Security
- Row level security is enabled on every table.
- Catalog, source, coverage, quotation, history, rate, update log and quality tables: SELECT only, for `anon` and `authenticated`, because the data is intentionally public.
- No INSERT, UPDATE or DELETE policy exists for `anon` or `authenticated` on market data tables, so the browser cannot change market data.
- `service_role` receives full privileges for the ingestion edge function. It bypasses RLS.
- `favorites`: `authenticated` only, with ownership checks on all four verbs.

3. Important notes
- All statements are idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS), so the migration can be re-run safely.
- No market data rows are inserted by this migration. Data arrives when the edge function collects from real APIs.
- DEMO data is generated in the browser and is labeled as such — it is never stored as LIVE.
*/

CREATE TABLE IF NOT EXISTS metal_categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  short_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS metals (
  id text PRIMARY KEY,
  category_id text NOT NULL REFERENCES metal_categories(id),
  symbol text NOT NULL,
  name text NOT NULL,
  name_ru text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  atomic_number integer,
  unit text NOT NULL DEFAULT 'kg',
  currency text NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'RUB', 'CNY', 'SEK')),
  base_price numeric NOT NULL DEFAULT 0,
  volatility numeric NOT NULL DEFAULT 0.02,
  trend numeric NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS metals_category_idx ON metals (category_id);

CREATE TABLE IF NOT EXISTS data_sources (
  id text PRIMARY KEY,
  name text NOT NULL,
  url text NOT NULL DEFAULT '',
  api_endpoint text NOT NULL DEFAULT '',
  market_type text NOT NULL,
  region text NOT NULL,
  quality_score numeric(3,2) NOT NULL CHECK (quality_score >= 0 AND quality_score <= 1),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'rate_limited', 'error', 'unavailable', 'demo')),
  api_key_required boolean NOT NULL DEFAULT false,
  api_key_configured boolean NOT NULL DEFAULT false,
  attribution text NOT NULL DEFAULT '',
  license text NOT NULL DEFAULT '',
  free_tier_limit text NOT NULL DEFAULT '',
  last_success_at timestamptz,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metal_source_coverage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metal_id text NOT NULL REFERENCES metals(id),
  source_id text NOT NULL REFERENCES data_sources(id),
  source_symbol text NOT NULL DEFAULT '',
  grade text,
  product_form text,
  UNIQUE (metal_id, source_id)
);

CREATE TABLE IF NOT EXISTS price_quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metal_id text NOT NULL REFERENCES metals(id),
  source_id text NOT NULL REFERENCES data_sources(id),
  original_price numeric NOT NULL CHECK (original_price >= 0),
  original_currency text NOT NULL,
  original_unit text NOT NULL,
  normalized_price numeric NOT NULL CHECK (normalized_price >= 0),
  normalized_currency text NOT NULL CHECK (normalized_currency IN ('USD', 'EUR', 'GBP', 'RUB', 'CNY', 'SEK')),
  normalized_unit text NOT NULL,
  grade text,
  product_form text,
  region text NOT NULL,
  market_type text NOT NULL,
  exchange_name text,
  bid_price numeric,
  ask_price numeric,
  transaction_price numeric,
  price_type text NOT NULL DEFAULT 'transaction',
  quality_score numeric(3,2) NOT NULL CHECK (quality_score >= 0 AND quality_score <= 1),
  data_status text NOT NULL CHECK (data_status IN ('live', 'cached', 'demo', 'unavailable')),
  validation_status text NOT NULL DEFAULT 'valid' CHECK (validation_status IN ('valid', 'suspect', 'invalid', 'stale')),
  quoted_at timestamptz NOT NULL,
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  source_url text NOT NULL DEFAULT '',
  attribution text NOT NULL DEFAULT '',
  UNIQUE (metal_id, source_id, quoted_at)
);
CREATE INDEX IF NOT EXISTS price_quotations_metal_time_idx ON price_quotations (metal_id, quoted_at DESC);
CREATE INDEX IF NOT EXISTS price_quotations_source_idx ON price_quotations (source_id);

CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metal_id text NOT NULL REFERENCES metals(id),
  source_id text NOT NULL REFERENCES data_sources(id),
  trade_date date NOT NULL,
  open numeric NOT NULL,
  high numeric NOT NULL,
  low numeric NOT NULL,
  close numeric NOT NULL,
  currency text NOT NULL CHECK (currency IN ('USD', 'EUR', 'GBP', 'RUB', 'CNY', 'SEK')),
  unit text NOT NULL,
  data_status text NOT NULL CHECK (data_status IN ('live', 'cached', 'demo', 'unavailable')),
  UNIQUE (metal_id, source_id, trade_date)
);
CREATE INDEX IF NOT EXISTS price_history_metal_date_idx ON price_history (metal_id, trade_date DESC);

CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL CHECK (base_currency IN ('USD', 'EUR', 'GBP', 'RUB', 'CNY', 'SEK')),
  quote_currency text NOT NULL CHECK (quote_currency IN ('USD', 'EUR', 'GBP', 'RUB', 'CNY', 'SEK')),
  rate numeric NOT NULL CHECK (rate > 0),
  rate_date timestamptz NOT NULL,
  origin text NOT NULL,
  data_status text NOT NULL CHECK (data_status IN ('live', 'cached', 'demo', 'unavailable')),
  UNIQUE (base_currency, quote_currency, rate_date)
);

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  metal_id text NOT NULL REFERENCES metals(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, metal_id)
);

CREATE TABLE IF NOT EXISTS update_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id text REFERENCES data_sources(id),
  job text NOT NULL,
  status text NOT NULL CHECK (status IN ('started', 'success', 'error')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  rows_written integer NOT NULL DEFAULT 0 CHECK (rows_written >= 0),
  message text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS update_logs_started_idx ON update_logs (started_at DESC);

CREATE TABLE IF NOT EXISTS data_quality_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id text REFERENCES data_sources(id),
  metal_id text REFERENCES metals(id),
  check_name text NOT NULL,
  result text NOT NULL CHECK (result IN ('pass', 'warn', 'fail')),
  details text NOT NULL DEFAULT '',
  checked_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS data_quality_checked_idx ON data_quality_records (checked_at DESC);

ALTER TABLE metal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE metals ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE metal_source_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_records ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON metal_categories, metals, data_sources, metal_source_coverage, price_quotations, price_history, exchange_rates, update_logs, data_quality_records TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON metal_categories, metals, data_sources, metal_source_coverage, price_quotations, price_history, exchange_rates, update_logs, data_quality_records TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON favorites TO authenticated, service_role;

DROP POLICY IF EXISTS "public_read_metal_categories" ON metal_categories;
CREATE POLICY "public_read_metal_categories" ON metal_categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_read_metals" ON metals;
CREATE POLICY "public_read_metals" ON metals FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_read_data_sources" ON data_sources;
CREATE POLICY "public_read_data_sources" ON data_sources FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_read_metal_source_coverage" ON metal_source_coverage;
CREATE POLICY "public_read_metal_source_coverage" ON metal_source_coverage FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_read_price_quotations" ON price_quotations;
CREATE POLICY "public_read_price_quotations" ON price_quotations FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_read_price_history" ON price_history;
CREATE POLICY "public_read_price_history" ON price_history FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_read_exchange_rates" ON exchange_rates;
CREATE POLICY "public_read_exchange_rates" ON exchange_rates FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_read_update_logs" ON update_logs;
CREATE POLICY "public_read_update_logs" ON update_logs FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_read_data_quality_records" ON data_quality_records;
CREATE POLICY "public_read_data_quality_records" ON data_quality_records FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "select_own_favorites" ON favorites;
CREATE POLICY "select_own_favorites" ON favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_favorites" ON favorites;
CREATE POLICY "insert_own_favorites" ON favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_favorites" ON favorites;
CREATE POLICY "update_own_favorites" ON favorites FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_favorites" ON favorites;
CREATE POLICY "delete_own_favorites" ON favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);