import { PERIODS } from '@/data/periods';
import { CATEGORIES } from '@/data/categories';
import { METALS } from '@/data/metals';
import type { Metal, MetalQuote, PeriodKey, PricePoint, MetalCategoryId, MarketIndex } from '@/types/market';

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getPeriod(key: PeriodKey) {
  const period = PERIODS.find((item) => item.key === key);
  if (!period) throw new Error(`Unknown period: ${key}`);
  return period;
}

function buildSeries(metal: Metal, periodKey: PeriodKey, endTime: number): PricePoint[] {
  const period = getPeriod(periodKey);
  const random = createRandom(hashString(`${metal.id}:${period.key}`));
  const prices = new Array<number>(period.points);
  prices[period.points - 1] = metal.basePrice;

  for (let i = period.points - 2; i >= 0; i--) {
    const shock = (random() + random() + random() - 1.5) / 1.5;
    const move = (shock * metal.volatility + metal.trend) * period.volatilityScale;
    prices[i] = prices[i + 1] / (1 + move);
  }

  return prices.map((price, i) => ({
    date: endTime - (period.points - 1 - i) * period.stepMs,
    price,
  }));
}

export function buildQuote(metal: Metal, periodKey: PeriodKey, updatedAt: Date): MetalQuote {
  const series = buildSeries(metal, periodKey, updatedAt.getTime());
  const values = series.map((point) => point.price);
  const first = values[0];
  const last = values[values.length - 1];
  const average = values.reduce((sum, v) => sum + v, 0) / values.length;

  return {
    metal,
    price: last,
    change: last - first,
    changePct: ((last - first) / first) * 100,
    high: Math.max(...values),
    low: Math.min(...values),
    average,
    series,
    dataStatus: 'demo' as const,
    sourceName: 'METALS ANALYTICS (демо-генератор)',
  };
}

export function buildQuotes(metals: Metal[], periodKey: PeriodKey, updatedAt: Date): MetalQuote[] {
  return metals.map((metal) => buildQuote(metal, periodKey, updatedAt));
}

export function buildIndex(quotes: MetalQuote[]): PricePoint[] {
  if (quotes.length === 0) return [];
  const length = quotes[0].series.length;

  return Array.from({ length }, (_, i) => {
    const average =
      quotes.reduce((sum, quote) => sum + quote.series[i].price / quote.series[0].price, 0) /
      quotes.length;
    return { date: quotes[0].series[i].date, price: average * 100 };
  });
}

export function buildIndicesByCategory(updatedAt: Date, periodKey: PeriodKey = '1M'): MarketIndex[] {
  const indices: MarketIndex[] = [];

  const allQuotes = buildQuotes(METALS, periodKey, updatedAt);
  const allIndex = buildIndex(allQuotes);
  if (allIndex.length > 0) {
    indices.push({
      id: 'all',
      name: 'Индекс общего рынка металлов',
      categoryId: 'all',
      series: allIndex,
      changePct: ((allIndex[allIndex.length - 1].price - allIndex[0].price) / allIndex[0].price) * 100,
    });
  }

  for (const cat of CATEGORIES) {
    const catMetals = METALS.filter((m) => m.categoryId === cat.id);
    if (catMetals.length === 0) continue;
    const quotes = buildQuotes(catMetals, periodKey, updatedAt);
    const index = buildIndex(quotes);
    if (index.length === 0) continue;
    indices.push({
      id: cat.id,
      name: `Индекс: ${cat.name}`,
      categoryId: cat.id,
      series: index,
      changePct: ((index[index.length - 1].price - index[0].price) / index[0].price) * 100,
    });
  }

  return indices;
}

export function getTopMovers(quotes: MetalQuote[], count: number, direction: 'up' | 'down'): MetalQuote[] {
  const sorted = [...quotes].sort((a, b) =>
    direction === 'up' ? b.changePct - a.changePct : a.changePct - b.changePct
  );
  return sorted.slice(0, count);
}

export function getVolatility(quote: MetalQuote): number {
  const values = quote.series.map((p) => p.price);
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance) / mean;
}

export function getTrendDirection(quote: MetalQuote): 'up' | 'down' | 'flat' {
  if (quote.changePct > 0.5) return 'up';
  if (quote.changePct < -0.5) return 'down';
  return 'flat';
}

export function filterByCategory(metals: Metal[], categoryId: MetalCategoryId | 'all'): Metal[] {
  if (categoryId === 'all') return metals;
  return metals.filter((m) => m.categoryId === categoryId);
}
