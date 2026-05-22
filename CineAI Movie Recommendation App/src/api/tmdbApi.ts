const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";
const TMDB_PROFILE_BASE = "https://image.tmdb.org/t/p/w185";

const TMDB_BEARER_TOKEN =
  typeof import.meta !== "undefined" ? import.meta.env?.VITE_TMDB_BEARER_TOKEN : undefined;
const TMDB_API_KEY =
  typeof import.meta !== "undefined" ? import.meta.env?.VITE_TMDB_API_KEY : undefined;

let loggedMissingCredentials = false;
const detailsCache = new Map<number, TmdbMovieDetails | null>();

export interface TmdbMovieDetails {
  tmdbId: number;
  posterUrl: string | null;
  backdropUrl: string | null;
  overview: string | null;
  runtime: number | null;
  voteAverage: number | null;
  voteCount: number | null;
  keywords: string[];
  cast: Array<{
    id: number;
    name: string;
    character: string | null;
    profileUrl: string | null;
  }>;
}

interface HasTmdbId {
  tmdbId?: number | null;
}

export type MovieWithTmdb<T extends HasTmdbId> = T & {
  tmdbPosterUrl?: string | null;
  tmdbBackdropUrl?: string | null;
  tmdbOverview?: string | null;
  tmdbRuntime?: number | null;
  tmdbRatingLive?: number | null;
  tmdbVoteCountLive?: number | null;
  tmdbKeywords?: string[];
  tmdbCast?: TmdbMovieDetails["cast"];
};

function hasTmdbCredentials(): boolean {
  return Boolean((TMDB_BEARER_TOKEN && TMDB_BEARER_TOKEN.trim()) || (TMDB_API_KEY && TMDB_API_KEY.trim()));
}

function buildUrl(path: string): string {
  const url = new URL(`${TMDB_API_BASE}${path}`);
  if (!TMDB_BEARER_TOKEN && TMDB_API_KEY) {
    url.searchParams.set("api_key", TMDB_API_KEY);
  }
  return url.toString();
}

function buildHeaders(): HeadersInit {
  if (TMDB_BEARER_TOKEN) {
    return {
      Authorization: `Bearer ${TMDB_BEARER_TOKEN}`,
      Accept: "application/json",
    };
  }
  return {
    Accept: "application/json",
  };
}

function imageUrl(path: string | null | undefined, base: string): string | null {
  if (!path) {
    return null;
  }
  return `${base}${path}`;
}

export async function getTmdbMovieDetails(tmdbId?: number | null): Promise<TmdbMovieDetails | null> {
  if (!tmdbId) {
    return null;
  }

  if (detailsCache.has(tmdbId)) {
    return detailsCache.get(tmdbId) ?? null;
  }

  if (!hasTmdbCredentials()) {
    if (!loggedMissingCredentials) {
      console.warn("TMDB credentials missing. Set VITE_TMDB_API_KEY or VITE_TMDB_BEARER_TOKEN in .env.");
      loggedMissingCredentials = true;
    }
    detailsCache.set(tmdbId, null);
    return null;
  }

  try {
    const url = buildUrl(`/movie/${tmdbId}?append_to_response=keywords,credits`);
    const response = await fetch(url, { headers: buildHeaders() });
    if (!response.ok) {
      detailsCache.set(tmdbId, null);
      return null;
    }

    const payload = await response.json();
    const keywordNodes = Array.isArray(payload?.keywords?.keywords) ? payload.keywords.keywords : [];
    const castNodes = Array.isArray(payload?.credits?.cast) ? payload.credits.cast : [];

    const details: TmdbMovieDetails = {
      tmdbId,
      posterUrl: imageUrl(payload.poster_path, TMDB_POSTER_BASE),
      backdropUrl: imageUrl(payload.backdrop_path, TMDB_BACKDROP_BASE),
      overview: typeof payload.overview === "string" ? payload.overview : null,
      runtime: typeof payload.runtime === "number" ? payload.runtime : null,
      voteAverage: typeof payload.vote_average === "number" ? payload.vote_average : null,
      voteCount: typeof payload.vote_count === "number" ? payload.vote_count : null,
      keywords: keywordNodes
        .map((node: { name?: string }) => node?.name?.trim())
        .filter((name: string | undefined): name is string => Boolean(name)),
      cast: castNodes
        .map((node: { id?: number; name?: string; character?: string; profile_path?: string | null }) => {
          const name = node?.name?.trim();
          if (!name || typeof node?.id !== "number") {
            return null;
          }
          const character = node?.character?.trim() ?? null;
          return {
            id: node.id,
            name,
            character: character || null,
            profileUrl: imageUrl(node?.profile_path ?? null, TMDB_PROFILE_BASE),
          };
        })
        .filter((castMember): castMember is NonNullable<typeof castMember> => Boolean(castMember))
        .slice(0, 10),
    };

    detailsCache.set(tmdbId, details);
    return details;
  } catch {
    detailsCache.set(tmdbId, null);
    return null;
  }
}

export async function enrichMovieListWithTmdb<T extends HasTmdbId>(
  movies: T[],
): Promise<Array<MovieWithTmdb<T>>> {
  const enriched = await Promise.all(
    movies.map(async (movie) => {
      const details = await getTmdbMovieDetails(movie.tmdbId);
      return {
        ...movie,
        tmdbPosterUrl: details?.posterUrl ?? null,
        tmdbBackdropUrl: details?.backdropUrl ?? null,
        tmdbOverview: details?.overview ?? null,
        tmdbRuntime: details?.runtime ?? null,
        tmdbRatingLive: details?.voteAverage ?? null,
        tmdbVoteCountLive: details?.voteCount ?? null,
        tmdbKeywords: details?.keywords ?? [],
        tmdbCast: details?.cast ?? [],
      };
    }),
  );

  return enriched;
}
