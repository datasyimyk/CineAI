const WATCHLIST_STORAGE_KEY = "cineai_watchlist_ids";

function normalizeMovieId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

export function readWatchlistIds(): number[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const validIds = parsed
      .map((value) => normalizeMovieId(value))
      .filter((value): value is number => value !== null);

    return Array.from(new Set(validIds));
  } catch {
    return [];
  }
}

function writeWatchlistIds(ids: number[]): void {
  if (typeof window === "undefined") {
    return;
  }
  const uniqueIds = Array.from(new Set(ids.filter((id) => Number.isInteger(id) && id > 0)));
  window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(uniqueIds));
}

export function isInWatchlist(movieId: number): boolean {
  return readWatchlistIds().includes(movieId);
}

export function addToWatchlist(movieId: number): void {
  if (!Number.isInteger(movieId) || movieId <= 0) {
    return;
  }
  const ids = readWatchlistIds();
  if (ids.includes(movieId)) {
    return;
  }
  writeWatchlistIds([...ids, movieId]);
}

export function removeFromWatchlist(movieId: number): void {
  const ids = readWatchlistIds();
  writeWatchlistIds(ids.filter((id) => id !== movieId));
}

