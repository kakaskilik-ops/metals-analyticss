import Delta from '@/components/common/Delta';
import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/format';
import type { Metal, MetalQuote } from '@/types/market';

interface MoversListProps {
  rankedQuotes: MetalQuote[];
  onSelect: (metal: Metal) => void;
}

export default function MoversList({ rankedQuotes, onSelect }: MoversListProps) {
  const maxAbs = Math.max(...rankedQuotes.map((quote) => Math.abs(quote.changePct)), 0.0001);

  return (
    <ul className="space-y-4">
      {rankedQuotes.map((quote) => {
        const positive = quote.changePct >= 0;
        const width = Math.max(4, (Math.abs(quote.changePct) / maxAbs) * 100);
        return (
          <li key={quote.metal.symbol}>
            <button
              type="button"
              onClick={() => onSelect(quote.metal)}
              className="group w-full text-left"
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-ink-200 transition-colors group-hover:text-ink-100">
                  {quote.metal.name}
                  <span className="ml-1.5 text-ink-500">{quote.metal.symbol}</span>
                </span>
                <Delta value={quote.changePct} text={formatPercent(quote.changePct)} />
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-800">
                <div
                  className={cn(
                    'h-full rounded-full transition-[width] duration-700 ease-out',
                    positive ? 'bg-brand-500' : 'bg-loss-500'
                  )}
                  style={{ width: `${width}%` }}
                />
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
