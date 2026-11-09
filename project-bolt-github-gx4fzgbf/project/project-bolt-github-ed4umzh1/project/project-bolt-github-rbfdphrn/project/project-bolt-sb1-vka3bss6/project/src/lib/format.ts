import type { PeriodKey } from '@/types/market';

const MOSCOW_TZ = 'Europe/Moscow';

const numberFormat = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const AXIS_OPTIONS: Record<PeriodKey, Intl.DateTimeFormatOptions> = {
  '1D': { hour: '2-digit', minute: '2-digit' },
  '1W': { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' },
  '1M': { day: '2-digit', month: '2-digit' },
  '3M': { day: '2-digit', month: '2-digit' },
  '6M': { month: 'short', year: '2-digit' },
  '1Y': { month: 'short', year: '2-digit' },
  '5Y': { month: 'short', year: '2-digit' },
};

export function formatPrice(value: number): string {
  return `$${numberFormat.format(value)}`;
}

export function formatPriceChange(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}$${numberFormat.format(Math.abs(value))}`;
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${numberFormat.format(Math.abs(value))}%`;
}

export function formatIndex(value: number): string {
  return numberFormat.format(value);
}

export function formatDateTime(timestamp: number): string {
  const formatted = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: MOSCOW_TZ,
  }).format(timestamp);
  return `${formatted} МСК`;
}

export function formatAxisLabel(timestamp: number, period: PeriodKey): string {
  return new Intl.DateTimeFormat('ru-RU', { ...AXIS_OPTIONS[period], timeZone: MOSCOW_TZ }).format(
    timestamp
  );
}
