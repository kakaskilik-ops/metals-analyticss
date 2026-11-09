import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'alpha-analyst-favorites';

function readFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function writeFavorites(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => readFavorites());

  useEffect(() => {
    writeFavorites(favorites);
  }, [favorites]);

  const toggleFavorite = useCallback((metalId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(metalId)) next.delete(metalId);
      else next.add(metalId);
      return next;
    });
  }, []);

  const isFavorite = useCallback((metalId: string) => favorites.has(metalId), [favorites]);

  return { favorites, toggleFavorite, isFavorite };
}

export type FavoritesState = ReturnType<typeof useFavorites>;
