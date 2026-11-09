import { Star } from 'lucide-react';
import DataStatusBadge from '@/components/common/DataStatusBadge';
import Delta from '@/components/common/Delta';
import { CATEGORY_MAP } from '@/data/categories';
import { cn } from '@/lib/cn';
import { formatPercent, formatPrice } from '@/lib/format';
import type { MetalQuote } from '@/types/market';

interface MetalCardProps {
  quote: MetalQuote;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}

export default function MetalCard({ quote, isFavorite, onSelect, onToggleFavorite }: MetalCardProps) {
  const { metal } = quote;
  const unitLabel = metal.unit === 'ozt' ? 'тр. унц.' : metal.unit === 'ton' ? 'т' : metal.unit === 'lb' ? 'фунт' : 'кг';
  return (
    <div className="group relative flex w-full flex-col rounded-2xl border border-ink-800 bg-ink-900/70 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/40 hover:bg-ink-900 hover:shadow-[0_12px_32px_-16px_rgba(0,199,129,0.35)]">
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Открыть карточку: ${metal.name}`}
        className="absolute inset-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-ink-100">{metal.name}</p>
          <p className="mt-1 text-xs text-ink-400">{CATEGORY_MAP[metal.categoryId].shortName}</p>
        </div>
        <div className="relative z-10 flex shrink-0 items-center gap-2">
          <span className="rounded-md bg-ink-800 px-2 py-0.5 text-xs font-medium text-ink-300 transition-colors group-hover:text-brand-400">
            {metal.symbol}
          </span>
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? `Убрать из избранного: ${metal.name}` : `Добавить в избранное: ${metal.name}`}
            className={cn(
              'rounded-md p-1 transition-colors duration-200 hover:bg-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
              isFavorite ? 'text-brand-400' : 'text-ink-500 hover:text-ink-200'
            )}
          >
            <Star className="h-4 w-4" fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-semibold tabular-nums text-ink-100">{formatPrice(quote.price)}</p>
            <DataStatusBadge status={quote.dataStatus} />
          </div>
          <p className="mt-1 text-xs text-ink-400">за {unitLabel}, {metal.currency}</p>
        </div>
        <div className="text-right">
          <Delta value={quote.changePct} text={formatPercent(quote.changePct)} className="justify-end" />
          <p className="mt-1 text-xs text-ink-400">за 1М</p>
        </div>
      </div>
    </div>
  );
}
