import { supabase } from '@/lib/supabase';
import type {
  CurrencyCode,
  DataStatus,
  MarketType,
  PriceQuoteRecord,
  SourceStatus,
  ValidationStatus,
} from '@/types/market';
import type { SourceStatusRow } from '@/services/sources';

export interface UpdateLogRow {
  id: string;
  job: string;
  sourceId: string | null;
  status: 'started' | 'success' | 'error';
  startedAt: number;
  finishedAt: number | null;
  rowsWritten: number;
  message: string;
}

export interface QualityRecordRow {
  id: string;
  sourceId: string | null;
  metalId: string | null;
  checkName: string;
  result: 'pass' | 'warn' | 'fail';
  details: string;
  checkedAt: number;
}

type Row = Record<string, unknown>;

function getClient() {
  if (!supabase) throw new Error('Подключение к базе данных не настроено.');
  return supabase;
}

function fail(message: string | undefined): never {
  throw new Error(message ?? 'Неизвестная ошибка базы данных.');
}

function asString(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Неожиданный формат данных.');
  return value;
}

function asNumber(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) throw new Error('Неожиданный формат данных.');
  return parsed;
}

function asTimestamp(value: unknown): number {
  const parsed = Date.parse(asString(value));
  if (Number.isNaN(parsed)) throw new Error('Неожиданный формат даты.');
  return parsed;
}

function asNullableTimestamp(value: unknown): number | null {
  return value === null || value === undefined ? null : asTimestamp(value);
}

function asNullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : asString(value);
}

function asArray(data: unknown): Row[] {
  if (!Array.isArray(data)) throw new Error('Неожиданный формат ответа базы данных.');
  return data as Row[];
}

export async function testConnection(): Promise<void> {
  const { error } = await getClient()
    .from('data_sources')
    .select('id', { count: 'exact', head: true });
  if (error) fail(error.message);
}

export async function fetchSourceRows(): Promise<SourceStatusRow[]> {
  const { data, error } = await getClient()
    .from('data_sources')
    .select('id, status, last_success_at, last_error');
  if (error) fail(error.message);

  return asArray(data).map((row) => ({
    id: asString(row.id),
    status: asString(row.status) as SourceStatus,
    lastSuccessAt: asNullableTimestamp(row.last_success_at),
    lastError: asNullableString(row.last_error),
  }));
}

export async function fetchSourceCoverage(): Promise<Set<string>> {
  const { data, error } = await getClient()
    .from('metal_source_coverage')
    .select('metal_id, source_id');
  if (error) fail(error.message);

  const coverage = new Set<string>();
  for (const row of asArray(data)) {
    const metalId = asString(row.metal_id);
    const sourceId = asString(row.source_id);
    coverage.add(`${metalId}-${sourceId}`);
  }
  return coverage;
}

export async function fetchUpdateLogs(limit = 10): Promise<UpdateLogRow[]> {
  const { data, error } = await getClient()
    .from('update_logs')
    .select('id, job, source_id, status, started_at, finished_at, rows_written, message')
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) fail(error.message);

  return asArray(data).map((row) => ({
    id: asString(row.id),
    job: asString(row.job),
    sourceId: asNullableString(row.source_id),
    status: asString(row.status) as UpdateLogRow['status'],
    startedAt: asTimestamp(row.started_at),
    finishedAt: asNullableTimestamp(row.finished_at),
    rowsWritten: asNumber(row.rows_written),
    message: asString(row.message),
  }));
}

export async function fetchQualityRecords(limit = 10): Promise<QualityRecordRow[]> {
  const { data, error } = await getClient()
    .from('data_quality_records')
    .select('id, source_id, metal_id, check_name, result, details, checked_at')
    .order('checked_at', { ascending: false })
    .limit(limit);
  if (error) fail(error.message);

  return asArray(data).map((row) => ({
    id: asString(row.id),
    sourceId: asNullableString(row.source_id),
    metalId: asNullableString(row.metal_id),
    checkName: asString(row.check_name),
    result: asString(row.result) as QualityRecordRow['result'],
    details: asString(row.details),
    checkedAt: asTimestamp(row.checked_at),
  }));
}

export async function fetchQuotationRecords(metalId: string): Promise<PriceQuoteRecord[]> {
  const { data, error } = await getClient()
    .from('price_quotations')
    .select(
      'metal_id, source_id, original_price, original_currency, original_unit, normalized_price, normalized_currency, normalized_unit, grade, product_form, region, market_type, exchange_name, quality_score, data_status, validation_status, quoted_at, retrieved_at, source_url, attribution, data_sources(name, url)'
    )
    .eq('metal_id', metalId)
    .order('quoted_at', { ascending: false })
    .limit(500);
  if (error) fail(error.message);

  return asArray(data).map((row) => {
    const source = row.data_sources as Row | null;
    if (!source || typeof source !== 'object') throw new Error('Неожиданный формат данных источника.');
    return {
      sourceName: asString(source.name),
      sourceUrl: asString(source.url),
      sourceId: asString(row.source_id),
      metalId: asString(row.metal_id),
      price: asNumber(row.normalized_price),
      originalPrice: asNumber(row.original_price),
      originalCurrency: asString(row.original_currency) as CurrencyCode,
      originalUnit: asString(row.original_unit),
      currency: asString(row.normalized_currency) as CurrencyCode,
      unit: asString(row.normalized_unit),
      marketType: asString(row.market_type) as MarketType,
      region: asString(row.region),
      exchangeName: asNullableString(row.exchange_name),
      grade: asNullableString(row.grade),
      productForm: asNullableString(row.product_form),
      dataStatus: asString(row.data_status) as DataStatus,
      validationStatus: asString(row.validation_status) as ValidationStatus,
      qualityScore: asNumber(row.quality_score),
      timestamp: asTimestamp(row.quoted_at),
      retrievedAt: asTimestamp(row.retrieved_at),
      attribution: asString(row.attribution),
    } as PriceQuoteRecord & { originalPrice: number; originalCurrency: CurrencyCode; originalUnit: string };
  });
}

export async function fetchAllLiveQuotations(): Promise<PriceQuoteRecord[]> {
  const { data, error } = await getClient()
    .from('price_quotations')
    .select(
      'metal_id, source_id, original_price, original_currency, original_unit, normalized_price, normalized_currency, normalized_unit, grade, product_form, region, market_type, exchange_name, quality_score, data_status, validation_status, quoted_at, retrieved_at, source_url, attribution, data_sources(name, url)'
    )
    .eq('data_status', 'live')
    .order('quoted_at', { ascending: false });
  if (error) fail(error.message);

  const rows = asArray(data);
  const seen = new Set<string>();
  const result: PriceQuoteRecord[] = [];

  for (const row of rows) {
    const metalId = asString(row.metal_id);
    const sourceId = asString(row.source_id);
    if (seen.has(metalId)) continue;
    seen.add(metalId);

    const source = row.data_sources as Row | null;
    if (!source) continue;

    result.push({
      sourceName: asString(source.name),
      sourceUrl: asString(source.url),
      sourceId,
      metalId,
      price: asNumber(row.normalized_price),
      originalPrice: asNumber(row.original_price),
      originalCurrency: asString(row.original_currency) as CurrencyCode,
      originalUnit: asString(row.original_unit),
      currency: asString(row.normalized_currency) as CurrencyCode,
      unit: asString(row.normalized_unit),
      marketType: asString(row.market_type) as MarketType,
      region: asString(row.region),
      exchangeName: asNullableString(row.exchange_name),
      grade: asNullableString(row.grade),
      productForm: asNullableString(row.product_form),
      dataStatus: asString(row.data_status) as DataStatus,
      validationStatus: asString(row.validation_status) as ValidationStatus,
      qualityScore: asNumber(row.quality_score),
      timestamp: asTimestamp(row.quoted_at),
      retrievedAt: asTimestamp(row.retrieved_at),
      attribution: asString(row.attribution),
    } as PriceQuoteRecord & { originalPrice: number; originalCurrency: CurrencyCode; originalUnit: string });
  }

  return result;
}

export async function fetchPriceHistory(
  metalId: string,
  sourceId: string
): Promise<{ date: number; open: number; high: number; low: number; close: number }[]> {
  const { data, error } = await getClient()
    .from('price_history')
    .select('trade_date, open, high, low, close, currency, unit, data_status')
    .eq('metal_id', metalId)
    .eq('source_id', sourceId)
    .order('trade_date', { ascending: true })
    .limit(365);
  if (error) fail(error.message);

  return asArray(data).map((row) => ({
    date: asTimestamp(row.trade_date),
    open: asNumber(row.open),
    high: asNumber(row.high),
    low: asNumber(row.low),
    close: asNumber(row.close),
  }));
}

