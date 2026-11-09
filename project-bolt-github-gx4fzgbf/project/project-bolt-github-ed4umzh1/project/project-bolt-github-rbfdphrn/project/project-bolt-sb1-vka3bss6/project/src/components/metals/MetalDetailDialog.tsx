import { useEffect, useId, useMemo, useState } from 'react';
import { Star, X } from 'lucide-react';
import DataStatusBadge from '@/components/common/DataStatusBadge';
import Delta from '@/components/common/Delta';
import PeriodSwitcher from '@/components/common/PeriodSwitcher';
import PriceChart from '@/components/charts/PriceChart';
import PriceConverter from '@/components/metals/PriceConverter';
import PriceSummaryPanel from '@/components/metals/PriceSummaryPanel';
import { CATEGORY_MAP } from '@/data/categories';
import { SUPABASE_CONFIGURED } from '@/lib/supabase';
import { formatDateTime, formatPercent, formatPrice, formatPriceChange } from '@/lib/format';
import { useAsyncData } from '@/hooks/useAsyncData';
import { fetchQuotationRecords } from '@/services/database';
import { buildHybridQuote } from '@/services/liveData';
import type { LiveMarketData } from '@/services/liveData';
import { cn } from '@/lib/cn';
import type { Metal, PeriodKey } from '@/types/market';

interface MetalDetailDialogProps {
  metal: Metal;
  initialPeriod: PeriodKey;
  updatedAt: Date;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
  liveData?: LiveMarketData | null;
}

export default function MetalDetailDialog({
  metal,
  initialPeriod,
  updatedAt,
  isFavorite,
  onToggleFavorite,
  onClose,
  liveData,
}: MetalDetailDialogProps) {
  const [period, setPeriod] = useState<PeriodKey>(initialPeriod);
  const liveMetalData = liveData?.quotes.get(metal.id) ?? null;
  const quote = useMemo(
    () => buildHybridQuote(metal, period, updatedAt, liveMetalData),
    [metal, period, updatedAt, liveMetalData]
  );
  const quotations = useAsyncData(() => fetchQuotationRecords(metal.id), metal.id, SUPABASE_CONFIGURED);
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const unitLabel = metal.unit === 'ozt' ? 'тр. унц.' : metal.unit === 'ton' ? 'т' : metal.unit === 'lb' ? 'фунт' : 'кг';

  const tiles = [
    { label: 'Максимум', value: formatPrice(quote.high) },
    { label: 'Минимум', value: formatPrice(quote.low) },
    { label: 'Изменение', value: formatPriceChange(quote.change) },
    { label: 'Дата обновления', value: formatDateTime(updatedAt.getTime()) },
  ];

  const specs = [
    { label: 'Символ', value: metal.symbol },
    { label: 'Атомный номер', value: metal.atomicNumber === null ? '—' : String(metal.atomicNumber) },
    { label: 'Категория', value: CATEGORY_MAP[metal.categoryId].name },
    { label: 'Единица измерения', value: `USD за ${unitLabel}` },
  ];

  const sourceInfo = liveMetalData
    ? `Источник: ${liveMetalData.sourceName}${liveMetalData.exchangeName ? `, ${liveMetalData.exchangeName}` : ''}. Данные в реальном времени (LIVE).`
    : 'Источник данных: демонстрационный генератор. Цены не являются реальными котировками и не предназначены для торговых решений.';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl border border-ink-700 bg-ink-900 shadow-2xl animate-fade-up sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-800 p-5 md:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 id={titleId} className="text-xl font-semibold text-ink-100">
                {metal.name}
              </h2>
              <span className="rounded-md bg-ink-800 px-2 py-0.5 text-xs font-medium text-ink-300">
                {metal.symbol}
              </span>
              <DataStatusBadge status={quote.dataStatus} />
            </div>
            <p className="mt-1 text-sm text-ink-400">{CATEGORY_MAP[metal.categoryId].name}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleFavorite}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
              className={cn(
                'rounded-lg p-2 transition-colors hover:bg-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
                isFavorite ? 'text-brand-400' : 'text-ink-400 hover:text-ink-100'
              )}
            >
              <Star className="h-5 w-5" fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть карточку"
              className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-medium uppercase tracking-[0.12em] text-ink-400">Текущая цена</span>
              </div>
              <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-ink-100">
                {formatPrice(quote.price)}
              </p>
              <p className="mt-1 text-xs text-ink-400">за {unitLabel}, {metal.currency}</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Delta value={quote.changePct} text={formatPercent(quote.changePct)} className="text-base" />
              <span className="tabular-nums text-ink-400">{formatPriceChange(quote.change)}</span>
            </div>
          </div>

          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-ink-400">История цены</span>
              <PeriodSwitcher value={period} onChange={setPeriod} />
            </div>
            <PriceChart
              data={quote.series}
              period={period}
              positive={quote.change >= 0}
              valueFormatter={formatPrice}
              height={260}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {tiles.map((tile) => (
              <div key={tile.label} className="rounded-xl border border-ink-800 bg-ink-950/60 p-4">
                <p className="text-xs text-ink-400">{tile.label}</p>
                <p className="mt-2 text-sm font-medium tabular-nums text-ink-100">{tile.value}</p>
              </div>
            ))}
          </div>

          <PriceConverter pricePerKg={quote.price} currency={metal.currency} />

          <div>
            <h3 className="mb-3 text-sm font-medium text-ink-200">Сводка по источникам</h3>
            <PriceSummaryPanel
              state={quotations.state}
              simulatedPrice={quote.price}
              unit={unitLabel}
              currency={metal.currency}
            />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-ink-200">Характеристики котировки</h3>
            <dl className="grid divide-y divide-ink-800 rounded-xl border border-ink-800 sm:grid-cols-2 sm:divide-y-0">
              {specs.map((spec, index) => (
                <div
                  key={spec.label}
                  className={`flex items-center justify-between gap-4 px-4 py-3 text-sm ${
                    index % 2 === 0 ? 'sm:border-r sm:border-ink-800' : ''
                  } ${index < 2 ? 'sm:border-b sm:border-ink-800' : ''}`}
                >
                  <dt className="text-ink-400">{spec.label}</dt>
                  <dd className="text-right font-medium text-ink-100">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <p className="text-xs leading-relaxed text-ink-400">{sourceInfo}</p>
        </div>
      </div>
    </div>
  );
}
