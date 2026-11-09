import type { CurrencyCode, UnitCode, ExchangeRate } from '@/types/market';
import { supabase } from '@/lib/supabase';

export const CURRENCY_CODES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'RUB', 'CNY', 'SEK'];

// DEMO fallback rates — used only when no live rates are available from the database.
const DEMO_RATES: Record<CurrencyCode, Record<CurrencyCode, number>> = {
  USD: { USD: 1, EUR: 0.92, GBP: 0.79, RUB: 95, CNY: 7.25, SEK: 10.6 },
  EUR: { USD: 1.087, EUR: 1, GBP: 0.86, RUB: 103.3, CNY: 7.88, SEK: 11.5 },
  GBP: { USD: 1.266, EUR: 1.163, GBP: 1, RUB: 120, CNY: 9.18, SEK: 13.4 },
  RUB: { USD: 0.0105, EUR: 0.0097, GBP: 0.0083, RUB: 1, CNY: 0.076, SEK: 0.111 },
  CNY: { USD: 0.138, EUR: 0.127, GBP: 0.109, RUB: 13.1, CNY: 1, SEK: 1.46 },
  SEK: { USD: 0.0943, EUR: 0.087, GBP: 0.075, RUB: 9.0, CNY: 0.685, SEK: 1 },
};

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  RUB: 'RUB',
  CNY: 'CNY',
  SEK: 'SEK',
};

export const UNIT_LABELS: Record<UnitCode, string> = {
  ton: 'т',
  kg: 'кг',
  g: 'г',
  ozt: 'тр. унц.',
  lb: 'фунт',
};

const UNIT_TO_KG: Record<UnitCode, number> = {
  ton: 1000,
  kg: 1,
  g: 0.001,
  ozt: 0.0311035,
  lb: 0.453592,
};

let liveRateCache: Map<string, number> | null = null;
let liveRateOrigin = '';
let liveRateTimestamp = 0;
let liveRateStatus: 'live' | 'demo' = 'demo';

export function getRate(base: CurrencyCode, quote: CurrencyCode): number {
  if (base === quote) return 1;
  if (liveRateCache) {
    const key = `${base}-${quote}`;
    const cached = liveRateCache.get(key);
    if (cached !== undefined) return cached;
    const reverse = liveRateCache.get(`${quote}-${base}`);
    if (reverse !== undefined && reverse !== 0) return 1 / reverse;
  }
  return DEMO_RATES[base][quote];
}

export function getRateStatus(): 'live' | 'demo' {
  return liveRateStatus;
}

export function getRateOrigin(): string {
  return liveRateStatus === 'live' ? liveRateOrigin : 'DEMO (индикативные ставки)';
}

export function getRateTimestamp(): number {
  return liveRateTimestamp;
}

export async function loadLiveRates(): Promise<void> {
  if (!supabase) return;
  try {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('base_currency, quote_currency, rate, rate_date, origin, data_status')
      .order('rate_date', { ascending: false })
      .limit(50);

    if (error || !data || data.length === 0) return;

    const cache = new Map<string, number>();
    let latestDate = 0;
    let origin = '';
    let hasLive = false;

    for (const row of data) {
      const base = row.base_currency as CurrencyCode;
      const quote = row.quote_currency as CurrencyCode;
      const rate = Number(row.rate);
      if (!Number.isFinite(rate) || rate <= 0) continue;
      cache.set(`${base}-${quote}`, rate);
      const rowDate = Date.parse(row.rate_date as string);
      if (rowDate > latestDate) {
        latestDate = rowDate;
        origin = row.origin as string;
        hasLive = row.data_status === 'live';
      }
    }

    liveRateCache = cache;
    liveRateTimestamp = latestDate;
    liveRateOrigin = origin;
    liveRateStatus = hasLive ? 'live' : 'demo';
  } catch {
    // keep demo rates
  }
}

export function convertPrice(
  price: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  fromUnit: UnitCode,
  toUnit: UnitCode
): number {
  const pricePerKg = price / UNIT_TO_KG[fromUnit];
  const convertedPerKg = pricePerKg * getRate(fromCurrency, toCurrency);
  return convertedPerKg * UNIT_TO_KG[toUnit];
}

export function normalizePriceToUsdPerKg(
  price: number,
  fromCurrency: CurrencyCode,
  fromUnit: UnitCode
): number {
  const pricePerKg = price / UNIT_TO_KG[fromUnit];
  return pricePerKg * getRate(fromCurrency, 'USD');
}

export function getExchangeRates(): ExchangeRate[] {
  if (!liveRateCache) return [];
  const rates: ExchangeRate[] = [];
  for (const [key, rate] of liveRateCache) {
    const [base, quote] = key.split('-') as [CurrencyCode, CurrencyCode];
    rates.push({
      base,
      quote,
      rate,
      updatedAt: liveRateTimestamp,
      origin: liveRateOrigin,
      dataStatus: liveRateStatus,
    });
  }
  return rates;
}
