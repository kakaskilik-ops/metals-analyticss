export type PeriodKey = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y';

export type MetalCategoryId =
  | 'non-ferrous'
  | 'precious'
  | 'rare-strategic'
  | 'rare-earth'
  | 'ferrous'
  | 'ferroalloys'
  | 'scrap'
  | 'special-alloys';

export interface MetalCategory {
  id: MetalCategoryId;
  name: string;
  shortName: string;
  description: string;
}

export interface Metal {
  id: string;
  symbol: string;
  name: string;
  nameRu: string;
  aliases: string[];
  atomicNumber: number | null;
  categoryId: MetalCategoryId;
  basePrice: number;
  volatility: number;
  trend: number;
  unit: string;
  currency: CurrencyCode;
  description: string;
  applications: string[];
  quoteTypes: string[];
  regions: string[];
  marketTypes: string[];
  priceFactors: string[];
}

export interface PricePoint {
  date: number;
  price: number;
}

export interface MetalQuote {
  metal: Metal;
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  average: number;
  series: PricePoint[];
  dataStatus: DataStatus;
  sourceName: string;
}

export interface PeriodConfig {
  key: PeriodKey;
  label: string;
  points: number;
  stepMs: number;
  volatilityScale: number;
}

export type MarketType =
  | 'exchange'
  | 'spot'
  | 'wholesale'
  | 'regional'
  | 'scrap'
  | 'raw'
  | 'alloy';

export type DataStatus = 'live' | 'cached' | 'demo' | 'unavailable';

export type SourceStatus = 'pending' | 'connected' | 'rate_limited' | 'error' | 'unavailable' | 'demo';

export type ValidationStatus = 'valid' | 'suspect' | 'invalid' | 'stale';

export interface PriceSource {
  id: string;
  name: string;
  url: string;
  marketType: MarketType;
  region: string;
  qualityScore: number;
}

export interface PriceQuoteRecord {
  sourceName: string;
  sourceUrl: string;
  sourceId: string;
  metalId: string;
  price: number;
  currency: string;
  unit: string;
  marketType: MarketType;
  region: string;
  exchangeName: string | null;
  grade: string | null;
  productForm: string | null;
  dataStatus: DataStatus;
  validationStatus: ValidationStatus;
  qualityScore: number;
  timestamp: number;
  retrievedAt: number;
  attribution: string;
}

export interface AveragePriceResult {
  weightedAverage: number | null;
  simpleAverage: number | null;
  trimmedMean: number | null;
  min: number | null;
  max: number | null;
  median: number | null;
  standardDeviation: number | null;
  dispersion: number | null;
  quotationCount: number;
  sourceCount: number;
  confidence: 'high' | 'medium' | 'low' | 'none';
  computedAt: number;
  outliers: number[];
}

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'RUB' | 'CNY' | 'SEK';

export type UnitCode = 'ton' | 'kg' | 'g' | 'ozt' | 'lb';

export interface ExchangeRate {
  base: CurrencyCode;
  quote: CurrencyCode;
  rate: number;
  updatedAt: number;
  origin: string;
  dataStatus: DataStatus;
}

export type SortKey = 'name' | 'price' | 'change' | 'changePct';

export type TrendDirection = 'up' | 'down' | 'flat';

export interface MarketIndex {
  id: string;
  name: string;
  categoryId: MetalCategoryId | 'all';
  series: PricePoint[];
  changePct: number;
}

export interface SourceIntegration extends PriceSource {
  status: SourceStatus;
  lastSuccessAt: number | null;
  lastError: string | null;
  apiEndpoint: string;
  apiKeyRequired: boolean;
  attribution: string;
  license: string;
  freeTierLimit: string;
}
