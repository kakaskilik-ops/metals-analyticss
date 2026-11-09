import { METALS, METAL_MAP } from '@/data/metals';
import { buildQuote } from '@/services/market';
import type { Metal, MetalQuote, PriceQuoteRecord, PeriodKey, DataStatus } from '@/types/market';
import { fetchAllLiveQuotations, fetchPriceHistory } from '@/services/database';
import { loadLiveRates } from '@/services/currency';

export interface LiveQuoteData {
  metalId: string;
  livePrice: number | null;
  livePriceOriginal: number | null;
  originalCurrency: string;
  originalUnit: string;
  sourceName: string;
  exchangeName: string | null;
  timestamp: number;
  dataStatus: DataStatus;
  history: { date: number; price: number }[];
}

export interface LiveMarketData {
  quotes: Map<string, LiveQuoteData>;
  loaded: boolean;
  updatedAt: number;
}

let cachedData: LiveMarketData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function loadLiveMarketData(force = false): Promise<LiveMarketData> {
  if (!force && cachedData && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedData;
  }

  await loadLiveRates();

  try {
    const quotations = await fetchAllLiveQuotations();
    const quotes = new Map<string, LiveQuoteData>();
    let latestTimestamp = 0;

    for (const q of quotations) {
      const metal = METAL_MAP[q.metalId];
      if (!metal) continue;

      let history: { date: number; price: number }[] = [];
      try {
        const histRows = await fetchPriceHistory(q.metalId, q.sourceId);
        history = histRows.map((h) => ({ date: h.date, price: h.close }));
      } catch {
        // no history available
      }

      const liveData: LiveQuoteData = {
        metalId: q.metalId,
        livePrice: q.price,
        livePriceOriginal: (q as PriceQuoteRecord & { originalPrice: number }).originalPrice ?? q.price,
        originalCurrency: (q as PriceQuoteRecord & { originalCurrency: string }).originalCurrency ?? q.currency,
        originalUnit: (q as PriceQuoteRecord & { originalUnit: string }).originalUnit ?? q.unit,
        sourceName: q.sourceName,
        exchangeName: q.exchangeName,
        timestamp: q.timestamp,
        dataStatus: q.dataStatus,
        history,
      };

      quotes.set(q.metalId, liveData);
      if (q.timestamp > latestTimestamp) latestTimestamp = q.timestamp;
    }

    cachedData = {
      quotes,
      loaded: true,
      updatedAt: latestTimestamp || Date.now(),
    };
    cacheTimestamp = Date.now();
    return cachedData;
  } catch {
    cachedData = {
      quotes: new Map(),
      loaded: false,
      updatedAt: Date.now(),
    };
    cacheTimestamp = Date.now();
    return cachedData;
  }
}

export function buildHybridQuote(
  metal: Metal,
  periodKey: PeriodKey,
  updatedAt: Date,
  liveData: LiveQuoteData | null
): MetalQuote {
  const demoQuote = buildQuote(metal, periodKey, updatedAt);

  if (liveData && liveData.livePrice !== null && liveData.dataStatus === 'live') {
    const livePricePerKg = liveData.livePrice;
    const demoPricePerKg = demoQuote.metal.unit === 'kg' ? demoQuote.price : demoQuote.price;

    // Use live history if available, otherwise use demo series scaled to live price
    let series: { date: number; price: number }[];
    if (liveData.history.length > 1) {
      // Convert history closes to the metal's display unit
      const metalUnit = metal.unit;
      const kgToUnit = metalUnit === 'ozt' ? 1 / 0.0311035 : metalUnit === 'ton' ? 1 / 1000 : metalUnit === 'lb' ? 1 / 0.453592 : 1;
      series = liveData.history.map((h) => ({
        date: h.date,
        price: h.price * kgToUnit,
      }));
    } else {
      // Scale demo series to converge on the live price
      const scaleFactor = livePricePerKg > 0 && demoPricePerKg > 0 ? livePricePerKg / demoPricePerKg : 1;
      series = demoQuote.series.map((p) => ({
        date: p.date,
        price: p.price * (metal.unit === 'kg' ? scaleFactor : 1),
      }));
    }

    const values = series.map((p) => p.price);
    const first = values[0] ?? livePricePerKg;
    const last = values[values.length - 1] ?? livePricePerKg;
    const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : livePricePerKg;

    // Convert live price from USD/kg to the metal's native unit if needed
    let displayPrice = livePricePerKg;
    if (metal.unit === 'ozt') displayPrice = livePricePerKg * 0.0311035;
    else if (metal.unit === 'ton') displayPrice = livePricePerKg * 1000;
    else if (metal.unit === 'lb') displayPrice = livePricePerKg * 0.453592;

    return {
      metal: demoQuote.metal,
      price: displayPrice,
      change: last - first,
      changePct: first > 0 ? ((last - first) / first) * 100 : 0,
      high: values.length > 0 ? Math.max(...values) : displayPrice,
      low: values.length > 0 ? Math.min(...values) : displayPrice,
      average: avg,
      series,
      dataStatus: 'live',
      sourceName: liveData.sourceName,
    };
  }

  return {
    ...demoQuote,
    dataStatus: 'demo',
    sourceName: 'METALS ANALYTICS (демо-генератор)',
  };
}

export function buildHybridQuotes(
  metals: Metal[],
  periodKey: PeriodKey,
  updatedAt: Date,
  liveMarketData: LiveMarketData | null
): MetalQuote[] {
  return metals.map((metal) => {
    const liveData = liveMarketData?.quotes.get(metal.id) ?? null;
    return buildHybridQuote(metal, periodKey, updatedAt, liveData);
  });
}

export function getLiveMetalIds(liveMarketData: LiveMarketData | null): Set<string> {
  if (!liveMarketData) return new Set();
  const ids = new Set<string>();
  for (const [id, data] of liveMarketData.quotes) {
    if (data.dataStatus === 'live' && data.livePrice !== null) {
      ids.add(id);
    }
  }
  return ids;
}

export { METALS };
