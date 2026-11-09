import type { PriceSource, MarketType, SourceStatus } from '@/types/market';

export interface SourceDefinition extends PriceSource {
  apiEndpoint: string;
  apiKeyRequired: boolean;
  attribution: string;
  license: string;
  freeTierLimit: string;
  defaultStatus: SourceStatus;
}

export const PRICE_SOURCES: SourceDefinition[] = [
  {
    id: 'yahoo-finance',
    name: 'Yahoo Finance (Unofficial)',
    url: 'https://finance.yahoo.com',
    apiEndpoint: 'https://query2.finance.yahoo.com/v8/finance/chart',
    marketType: 'exchange',
    region: 'США',
    qualityScore: 0.82,
    apiKeyRequired: false,
    attribution: 'Yahoo Finance',
    license: 'Unofficial — publicly accessible data, no official API license. For demonstration only.',
    freeTierLimit: 'Без ключа. Неформальные ограничения скорости.',
    defaultStatus: 'pending',
  },
  {
    id: 'frankfurter',
    name: 'Frankfurter API (ECB Rates)',
    url: 'https://frankfurter.app',
    apiEndpoint: 'https://api.frankfurter.app',
    marketType: 'spot',
    region: 'Глобальный',
    qualityScore: 0.90,
    apiKeyRequired: false,
    attribution: 'European Central Bank reference rates via Frankfurter API',
    license: 'MIT (API), ECB public data. Commercial use permitted.',
    freeTierLimit: 'Без ключа. Без документированных жёстких лимитов.',
    defaultStatus: 'pending',
  },
  {
    id: 'lme',
    name: 'London Metal Exchange',
    url: 'https://www.lme.com',
    apiEndpoint: '',
    marketType: 'exchange',
    region: 'Глобальный',
    qualityScore: 0.95,
    apiKeyRequired: true,
    attribution: 'LME',
    license: 'Требуется платная лицензия на данные. Нет бесплатного публичного API.',
    freeTierLimit: 'Нет бесплатного уровня.',
    defaultStatus: 'unavailable',
  },
  {
    id: 'comex',
    name: 'COMEX / CME',
    url: 'https://www.cmegroup.com',
    apiEndpoint: '',
    marketType: 'exchange',
    region: 'США',
    qualityScore: 0.94,
    apiKeyRequired: true,
    attribution: 'CME Group',
    license: 'Требуется платная лицензия на данные. Нет бесплатного публичного API.',
    freeTierLimit: 'Нет бесплатного уровня.',
    defaultStatus: 'unavailable',
  },
  {
    id: 'shfe',
    name: 'Shanghai Futures Exchange',
    url: 'https://www.shfe.com.cn',
    apiEndpoint: '',
    marketType: 'exchange',
    region: 'Китай',
    qualityScore: 0.92,
    apiKeyRequired: true,
    attribution: 'SHFE',
    license: 'Требуется платная лицензия на данные. Нет бесплатного публичного API.',
    freeTierLimit: 'Нет бесплатного уровня.',
    defaultStatus: 'unavailable',
  },
  {
    id: 'lbma',
    name: 'London Bullion Market Association',
    url: 'https://www.lbma.org.uk',
    apiEndpoint: '',
    marketType: 'spot',
    region: 'Глобальный',
    qualityScore: 0.96,
    apiKeyRequired: true,
    attribution: 'LBMA',
    license: 'Требуется платная лицензия на данные. Нет бесплатного публичного API.',
    freeTierLimit: 'Нет бесплатного уровня.',
    defaultStatus: 'unavailable',
  },
  {
    id: 'usgs',
    name: 'USGS Mineral Commodity Data',
    url: 'https://www.usgs.gov',
    apiEndpoint: '',
    marketType: 'wholesale',
    region: 'США',
    qualityScore: 0.80,
    apiKeyRequired: false,
    attribution: 'U.S. Geological Survey',
    license: 'Public domain (U.S. Government work). Commercial use permitted.',
    freeTierLimit: 'Без ключа. Ежегодные/ежемесячные публикации, не в реальном времени.',
    defaultStatus: 'pending',
  },
];

export const MARKET_TYPE_LABELS: Record<MarketType, string> = {
  exchange: 'Биржевая',
  spot: 'Спотовая',
  wholesale: 'Оптовая',
  regional: 'Региональная',
  scrap: 'Лом',
  raw: 'Сырье',
  alloy: 'Сплав',
};

export const SOURCE_STATUS_LABELS: Record<SourceStatus, string> = {
  pending: 'Ожидает настройки',
  connected: 'Подключён',
  rate_limited: 'Ограничен лимитом',
  error: 'Ошибка',
  unavailable: 'Недоступен',
  demo: 'Демо',
};
