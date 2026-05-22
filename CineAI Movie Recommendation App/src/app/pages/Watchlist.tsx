import { useEffect, useState } from "react";
import { BookmarkX, RefreshCw } from "lucide-react";
import { Link } from "react-router";
import { Footer } from "../components/Footer";
import { MovieCard } from "../components/MovieCard";
import { Navbar } from "../components/Navbar";
import { getMovieById } from "../../api/movieApi";
import { enrichMovieListWithTmdb, MovieWithTmdb } from "../../api/tmdbApi";
import { readWatchlistIds, removeFromWatchlist } from "../utils/watchlist";

interface Movie {
  movieId: number;
  titleClean: string;
  year: number | null;
  genres: string | null;
  tmdbRating: number | null;
  tmdbVoteCount: number | null;
  tmdbWeightedRating: number | null;
  imdbId: number | null;
  tmdbId: number | null;
}

function splitGenres(genres: string | null): string[] {
  if (!genres) {
    return [];
  }
  return genres.split("|").map((genre) => genre.trim()).filter(Boolean);
}

type MovieLoadResult = {
  movieId: number;
  movie: Movie | null;
  ok: boolean;
};

export function Watchlist() {
  const [movies, setMovies] = useState<Array<MovieWithTmdb<Movie>>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedCount, setFailedCount] = useState(0);

  const loadWatchlist = async () => {
    const ids = readWatchlistIds();
    if (ids.length === 0) {
      setMovies([]);
      setError(null);
      setFailedCount(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        ids.map(async (movieId): Promise<MovieLoadResult> => {
          try {
            const movie = await getMovieById(movieId);
            return { movieId, movie, ok: true };
          } catch {
            return { movieId, movie: null, ok: false };
          }
        }),
      );

      const reachableMovies = results
        .filter((result) => result.ok && result.movie)
        .map((result) => result.movie as Movie);
      const missing = results.length - reachableMovies.length;
      setFailedCount(missing);

      let finalMovies: Array<MovieWithTmdb<Movie>> = reachableMovies;
      if (reachableMovies.length > 0) {
        try {
          finalMovies = await enrichMovieListWithTmdb(reachableMovies);
        } catch {
          finalMovies = reachableMovies;
        }
      }

      const movieById = new Map(finalMovies.map((movie) => [movie.movieId, movie]));
      const orderedMovies = ids
        .map((id) => movieById.get(id))
        .filter((movie): movie is MovieWithTmdb<Movie> => Boolean(movie));

      setMovies(orderedMovies);

      if (orderedMovies.length === 0) {
        setError("Could not load your watchlist. Make sure backend is running on port 8080.");
      }
    } catch {
      setError("Could not load your watchlist. Make sure backend is running on port 8080.");
      setMovies([]);
      setFailedCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWatchlist();
  }, []);

  const handleRemove = (movieId: number) => {
    removeFromWatchlist(movieId);
    setMovies((currentMovies) => currentMovies.filter((movie) => movie.movieId !== movieId));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <section className="mb-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl mb-2">Your Watchlist</h1>
              <p className="text-muted-foreground">Movies you saved from the detail page.</p>
            </div>
            <button
              type="button"
              onClick={() => void loadWatchlist()}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:border-primary transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </section>

        {loading && (
          <div className="mb-8">
            <div>Loading watchlist...</div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-500 bg-red-50 text-red-700 px-4 py-3">
            {error}
          </div>
        )}

        {!loading && !error && failedCount > 0 && (
          <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-300">
            {failedCount} saved movie(s) could not be loaded right now.
          </div>
        )}

        {!loading && movies.length === 0 && !error && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <h2 className="mb-2">Your watchlist is empty</h2>
            <p className="mb-6 text-muted-foreground">Open any movie and click Add to Watchlist.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Browse Movies
            </Link>
          </div>
        )}

        {!loading && movies.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {movies.map((movie) => (
              <div key={movie.movieId} className="flex h-full flex-col gap-3">
                <div className="flex-1">
                  <MovieCard
                    id={movie.movieId}
                    title={movie.titleClean}
                    year={movie.year}
                    rating={movie.tmdbRatingLive ?? movie.tmdbRating}
                    voteCount={movie.tmdbVoteCountLive ?? movie.tmdbVoteCount}
                    posterUrl={movie.tmdbPosterUrl}
                    genres={splitGenres(movie.genres)}
                    variant="grid"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(movie.movieId)}
                  className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground hover:border-primary transition-colors"
                >
                  <BookmarkX className="h-4 w-4" />
                  Remove from Watchlist
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
