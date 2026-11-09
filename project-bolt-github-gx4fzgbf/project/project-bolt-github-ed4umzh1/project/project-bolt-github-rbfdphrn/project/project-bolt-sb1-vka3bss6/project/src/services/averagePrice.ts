import type { AveragePriceResult, PriceQuoteRecord } from '@/types/market';

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function standardDeviation(values: number[]): number | null {
  if (values.length < 2) return null;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function trimmedMean(values: number[], trimFraction = 0.1): number | null {
  if (values.length < 4) return values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : null;
  const sorted = [...values].sort((a, b) => a - b);
  const trimCount = Math.floor(sorted.length * trimFraction);
  if (trimCount === 0) return sorted.reduce((s, v) => s + v, 0) / sorted.length;
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
  return trimmed.reduce((s, v) => s + v, 0) / trimmed.length;
}

export function detectOutliers(values: number[]): number[] {
  if (values.length < 4) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  return values.filter((v) => v < lowerBound || v > upperBound);
}

export function isRealRecord(record: PriceQuoteRecord): boolean {
  return (
    (record.dataStatus === 'live' || record.dataStatus === 'cached') &&
    record.validationStatus !== 'invalid'
  );
}

export function computeAveragePrice(records: PriceQuoteRecord[]): AveragePriceResult {
  const real = records.filter(isRealRecord);
  const computedAt = Date.now();

  if (real.length === 0) {
    return {
      weightedAverage: null,
      simpleAverage: null,
      trimmedMean: null,
      min: null,
      max: null,
      median: null,
      standardDeviation: null,
      dispersion: null,
      quotationCount: 0,
      sourceCount: 0,
      confidence: 'none',
      computedAt,
      outliers: [],
    };
  }

  const prices = real.map((r) => r.price);
  const outliers = detectOutliers(prices);
  const outlierSet = new Set(outliers);
  const nonOutlierPrices = prices.filter((p) => !outlierSet.has(p));

  const weightSum = real.reduce((sum, r) => sum + r.qualityScore, 0);
  const weightedAverage =
    weightSum > 0 ? real.reduce((sum, r) => sum + r.price * r.qualityScore, 0) / weightSum : null;
  const sourceCount = new Set(real.map((r) => r.sourceId)).size;
  const avgQuality = weightSum / real.length;
  const sd = standardDeviation(prices);
  const mean = prices.reduce((s, v) => s + v, 0) / prices.length;
  const dispersion = mean !== 0 ? (sd ?? 0) / mean : null;

  let confidence: AveragePriceResult['confidence'];
  if (sourceCount >= 3 && avgQuality >= 0.85 && (dispersion ?? 1) < 0.15) confidence = 'high';
  else if (sourceCount >= 2 && avgQuality >= 0.75) confidence = 'medium';
  else confidence = 'low';

  return {
    weightedAverage,
    simpleAverage: mean,
    trimmedMean: trimmedMean(nonOutlierPrices.length > 0 ? nonOutlierPrices : prices),
    min: Math.min(...prices),
    max: Math.max(...prices),
    median: median(prices),
    standardDeviation: sd,
    dispersion,
    quotationCount: real.length,
    sourceCount,
    confidence,
    computedAt,
    outliers,
  };
}

export interface RepresentativePrice {
  value: number;
  basis: 'real' | 'demo';
  result: AveragePriceResult | null;
}

export function resolveRepresentativePrice(
  result: AveragePriceResult,
  simulatedPrice: number
): RepresentativePrice {
  if (result.weightedAverage !== null && result.quotationCount > 0) {
    return { value: result.weightedAverage, basis: 'real', result };
  }
  return { value: simulatedPrice, basis: 'demo', result };
}

export const CONFIDENCE_LABELS: Record<AveragePriceResult['confidence'], string> = {
  high: 'Высокая',
  medium: 'Средняя',
  low: 'Низкая',
  none: 'Недостаточно данных',
};

export const CONFIDENCE_COLORS: Record<AveragePriceResult['confidence'], string> = {
  high: 'text-brand-500',
  medium: 'text-yellow-400',
  low: 'text-orange-400',
  none: 'text-ink-400',
};
