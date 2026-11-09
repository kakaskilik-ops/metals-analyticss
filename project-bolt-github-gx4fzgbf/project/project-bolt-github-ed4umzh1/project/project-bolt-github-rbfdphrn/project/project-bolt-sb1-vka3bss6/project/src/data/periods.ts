import type { PeriodConfig } from '@/types/market';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const PERIODS: PeriodConfig[] = [
  { key: '1D', label: 'Сегодня', points: 24, stepMs: HOUR, volatilityScale: 0.35 },
  { key: '1W', label: '7 дней', points: 42, stepMs: 4 * HOUR, volatilityScale: 0.7 },
  { key: '1M', label: '30 дней', points: 30, stepMs: DAY, volatilityScale: 1 },
  { key: '3M', label: '90 дней', points: 45, stepMs: 2 * DAY, volatilityScale: 1.6 },
  { key: '6M', label: '6 месяцев', points: 52, stepMs: 3.5 * DAY, volatilityScale: 2.3 },
  { key: '1Y', label: '1 год', points: 52, stepMs: 7 * DAY, volatilityScale: 3 },
  { key: '5Y', label: '5 лет', points: 60, stepMs: 30 * DAY, volatilityScale: 6 },
];
