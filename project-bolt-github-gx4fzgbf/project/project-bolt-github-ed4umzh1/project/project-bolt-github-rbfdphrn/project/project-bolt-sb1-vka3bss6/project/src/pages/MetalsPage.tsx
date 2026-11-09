import { useMemo, useState } from 'react';
import SearchInput from '@/components/common/SearchInput';
import PageHeader from '@/components/layout/PageHeader';
import MetalCard from '@/components/metals/MetalCard';
import MetalDetailDialog from '@/components/metals/MetalDetailDialog';
import { CATEGORIES } from '@/data/categories';
import { METALS } from '@/data/metals';
import { cn } from '@/lib/cn';
import type { FavoritesState } from '@/hooks/useFavorites';
import { buildHybridQuotes } from '@/services/liveData';
import type { LiveMarketData } from '@/services/liveData';
import type { Metal, MetalCategoryId } from '@/types/market';

type CategoryFilter = MetalCategoryId | 'all';

const CHIP_BASE =
  'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40';

interface MetalsPageProps {
  updatedAt: Date;
  favorites: FavoritesState;
  liveData: LiveMarketData | null;
}

export default function MetalsPage({ updatedAt, favorites, liveData }: MetalsPageProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedMetal, setSelectedMetal] = useState<Metal | null>(null);

  const quotes = useMemo(
    () => buildHybridQuotes(METALS, '1M', updatedAt, liveData),
    [updatedAt, liveData]
  );
  const liveCount = quotes.filter((q) => q.dataStatus === 'live').length;
  const favoriteCount = useMemo(
    () => quotes.filter((quote) => favorites.isFavorite(quote.metal.id)).length,
    [quotes, favorites]
  );

  const normalizedQuery = query.trim().toLowerCase();
  const visibleQuotes = quotes.filter(({ metal }) => {
    if (category !== 'all' && metal.categoryId !== category) return false;
    if (favoritesOnly && !favorites.isFavorite(metal.id)) return false;
    if (!normalizedQuery) return true;
    return (
      metal.name.toLowerCase().includes(normalizedQuery) ||
      metal.nameRu.toLowerCase().includes(normalizedQuery) ||
      metal.symbol.toLowerCase().includes(normalizedQuery) ||
      metal.aliases.some((alias) => alias.includes(normalizedQuery))
    );
  });

  const emptyText = favoritesOnly && favoriteCount === 0
    ? 'В избранном пока нет металлов. Нажмите на звёздочку у металла, чтобы добавить его.'
    : normalizedQuery
      ? `Ничего не найдено по запросу «${query.trim()}»`
      : 'В этой категории нет металлов';

  return (
    <>
      <PageHeader
        title="Металлы"
        description={`Каталог металлов, сплавов и лома. ${liveCount} металлов с реальными котировками (LIVE), остальные — демонстрационные.`}
      />

      <div className="mb-6 flex flex-col gap-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Поиск по названию, символу или марке"
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Фильтр по категории">
          <button
            type="button"
            onClick={() => setCategory('all')}
            aria-pressed={category === 'all'}
            className={cn(
              CHIP_BASE,
              category === 'all'
                ? 'border-brand-500/40 bg-brand-500/10 text-brand-400'
                : 'border-ink-700 bg-ink-950 text-ink-300 hover:text-ink-100'
            )}
          >
            Все категории
          </button>
          {CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              aria-pressed={category === item.id}
              className={cn(
                CHIP_BASE,
                category === item.id
                  ? 'border-brand-500/40 bg-brand-500/10 text-brand-400'
                  : 'border-ink-700 bg-ink-950 text-ink-300 hover:text-ink-100'
              )}
            >
              {item.shortName}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setFavoritesOnly((value) => !value)}
            aria-pressed={favoritesOnly}
            className={cn(
              CHIP_BASE,
              favoritesOnly
                ? 'border-brand-500/40 bg-brand-500/10 text-brand-400'
                : 'border-ink-700 bg-ink-950 text-ink-300 hover:text-ink-100'
            )}
          >
            Избранное ({favoriteCount})
          </button>
        </div>
      </div>

      {visibleQuotes.length === 0 ? (
        <p className="rounded-2xl border border-ink-800 bg-ink-900/70 px-5 py-12 text-center text-sm text-ink-400">
          {emptyText}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleQuotes.map((quote) => (
            <MetalCard
              key={quote.metal.id}
              quote={quote}
              isFavorite={favorites.isFavorite(quote.metal.id)}
              onToggleFavorite={() => favorites.toggleFavorite(quote.metal.id)}
              onSelect={() => setSelectedMetal(quote.metal)}
            />
          ))}
        </div>
      )}

      {selectedMetal && (
        <MetalDetailDialog
          metal={selectedMetal}
          initialPeriod="1M"
          updatedAt={updatedAt}
          isFavorite={favorites.isFavorite(selectedMetal.id)}
          onToggleFavorite={() => favorites.toggleFavorite(selectedMetal.id)}
          onClose={() => setSelectedMetal(null)}
          liveData={liveData}
        />
      )}
    </>
  );
}
