import { Star } from 'lucide-react';
import DataStatusBadge from '@/components/common/DataStatusBadge';
import Delta from '@/components/common/Delta';
import { cn } from '@/lib/cn';
import { formatPercent, formatPrice, formatPriceChange } from '@/lib/format';
import type { Metal, MetalQuote } from '@/types/market';

interface QuotesTableProps {
  quotes: MetalQuote[];
  emptyText: string;
  isFavorite: (metalId: string) => boolean;
  onToggleFavorite: (metalId: string) => void;
  onSelect: (metal: Metal) => void;
}

export default function QuotesTable({ quotes, emptyText, isFavorite, onToggleFavorite, onSelect }: QuotesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink-800 text-left text-xs font-medium uppercase tracking-[0.12em] text-ink-400">
            <th scope="col" className="px-5 py-3 font-medium">Металл</th>
            <th scope="col" className="px-5 py-3 font-medium">Статус</th>
            <th scope="col" className="px-5 py-3 text-right font-medium">Цена</th>
            <th scope="col" className="px-5 py-3 text-right font-medium">Изменение</th>
            <th scope="col" className="px-5 py-3 text-right font-medium">Изменение %</th>
          </tr>
        </thead>
        <tbody>
          {quotes.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-10 text-center text-sm text-ink-400">
                {emptyText}
              </td>
            </tr>
          )}
          {quotes.map((quote) => {
            const favorite = isFavorite(quote.metal.id);
            return (
              <tr
                key={quote.metal.id}
                onClick={() => onSelect(quote.metal)}
                className="cursor-pointer border-b border-ink-800/70 transition-colors duration-150 last:border-b-0 hover:bg-ink-800/50"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleFavorite(quote.metal.id);
                      }}
                      aria-pressed={favorite}
                      aria-label={favorite ? `Убрать из избранного: ${quote.metal.name}` : `Добавить в избранное: ${quote.metal.name}`}
                      className={cn(
                        'rounded-md p-1 transition-colors duration-200 hover:bg-ink-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
                        favorite ? 'text-brand-400' : 'text-ink-500 hover:text-ink-200'
                      )}
                    >
                      <Star className="h-4 w-4" fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
                    </button>
                    <span className="font-medium text-ink-100">{quote.metal.name}</span>
                    <span className="text-ink-500">{quote.metal.symbol}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <DataStatusBadge status={quote.dataStatus} />
                </td>
                <td className="px-5 py-4 text-right font-medium tabular-nums text-ink-100">
                  {formatPrice(quote.price)}
                </td>
                <td className="px-5 py-4 text-right">
                  <Delta value={quote.change} text={formatPriceChange(quote.change)} className="justify-end" />
                </td>
                <td className="px-5 py-4 text-right">
                  <Delta value={quote.changePct} text={formatPercent(quote.changePct)} className="justify-end" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
