import { useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "react-router";
import { Footer } from "../components/Footer";
import { MovieCard } from "../components/MovieCard";
import { Navbar } from "../components/Navbar";
import { filterMovies, searchMovies } from "../../api/movieApi";
import { enrichMovieListWithTmdb, MovieWithTmdb } from "../../api/tmdbApi";

interface Movie {
  movieId: number;
  titleClean: string;
  year: number | null;
  genres: string | null;
  tmdbRating: number | null;
  tmdbVoteCount: number | null;
  tmdbId?: number | null;
}

const API_ERROR = "Could not connect. Make sure Spring Boot is running on port 8080.";
const GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Fantasy",
  "Thriller",
  "Mystery",
  "Crime",
  "Animation",
  "Documentary",
  "Musical",
  "Western",
];
const TMDB_ENRICH_LIMIT = 48;

function splitGenres(genres: string | null): string[] {
  if (!genres) {
    return [];
  }
  return genres.split("|").map((genre) => genre.trim()).filter(Boolean);
}

export function SearchResults() {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState<Array<MovieWithTmdb<Movie>>>([]);
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const [filters, setFilters] = useState({
    minRating: 7,
    fromYear: "2000",
    toYear: "2024",
    genres: [] as string[],
    sortBy: "rating",
  });

  const query = searchParams.get("q") ?? "";
  const genreFromUrl = searchParams.get("genre") ?? "";

  const loadAndEnrich = async (fetcher: () => Promise<unknown>) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    setEnriching(false);

    try {
      const data = await fetcher();
      if (requestId !== requestIdRef.current) {
        return;
      }

      const baseResults = (Array.isArray(data) ? data : []) as Array<MovieWithTmdb<Movie>>;
      setResults(baseResults);
      setLoading(false);

      const candidates = baseResults.slice(0, TMDB_ENRICH_LIMIT);
      if (candidates.length === 0) {
        return;
      }

      setEnriching(true);
      const enriched = await enrichMovieListWithTmdb(candidates);
      if (requestId !== requestIdRef.current) {
        return;
      }

      const byMovieId = new Map(enriched.map((movie) => [movie.movieId, movie]));
      setResults((current) => current.map((movie) => byMovieId.get(movie.movieId) ?? movie));
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setError(API_ERROR);
      setResults([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setEnriching(false);
      }
    }
  };

  useEffect(() => {
    const loadInitial = async () => {
      if (query.trim()) {
        await loadAndEnrich(() => searchMovies(query.trim()));
        return;
      }

      if (genreFromUrl.trim()) {
        const normalizedGenre = genreFromUrl.trim();
        const label = normalizedGenre.charAt(0).toUpperCase() + normalizedGenre.slice(1);
        setFilters((prev) => ({ ...prev, genres: [label] }));
        await loadAndEnrich(() => filterMovies({ genre: label }));
        return;
      }

      await loadAndEnrich(() => filterMovies({}));
    };

    void loadInitial();
  }, [query, genreFromUrl]);

  const toggleGenre = (genre: string) => {
    setFilters((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((selectedGenre) => selectedGenre !== genre)
        : [...prev.genres, genre],
    }));
  };

  const applyFilters = async () => {
    const baseParams = {
      minRating: filters.minRating,
      fromYear: filters.fromYear,
      toYear: filters.toYear,
      sortBy: filters.sortBy,
    };

    if (filters.genres.length <= 1) {
      await loadAndEnrich(() =>
        filterMovies({
          ...baseParams,
          genre: filters.genres[0] ?? "",
        }),
      );
      return;
    }

    await loadAndEnrich(async () => {
      const responses = await Promise.all(
        filters.genres.map((genre) =>
          filterMovies({
            ...baseParams,
            genre,
          }),
        ),
      );

      const mergedMovies = responses.flatMap((response) => (Array.isArray(response) ? response : []));
      const moviesById = new Map<number, MovieWithTmdb<Movie>>();
      mergedMovies.forEach((movie) => {
        if (movie && typeof movie.movieId === "number") {
          moviesById.set(movie.movieId, movie);
        }
      });

      return Array.from(moviesById.values());
    });
  };

  const resetFilters = async () => {
    setFilters({
      minRating: 0,
      fromYear: "",
      toYear: "",
      genres: [],
      sortBy: "rating",
    });

    await loadAndEnrich(() => filterMovies({}));
  };

  const activeFilters = useMemo(() => {
    const chips: string[] = [];
    if (filters.minRating > 0) {
      chips.push(`Rating: ${filters.minRating}+`);
    }
    if (filters.fromYear || filters.toYear) {
      chips.push(`Year: ${filters.fromYear || "Any"}-${filters.toYear || "Any"}`);
    }
    if (filters.genres.length > 0) {
      chips.push(`Genre: ${filters.genres.join(", ")}`);
    }
    if (filters.sortBy) {
      chips.push(`Sort: ${filters.sortBy}`);
    }
    return chips;
  }, [filters]);

  const removeFilter = (chip: string) => {
    if (chip.startsWith("Rating:")) {
      setFilters((prev) => ({ ...prev, minRating: 0 }));
      return;
    }
    if (chip.startsWith("Year:")) {
      setFilters((prev) => ({ ...prev, fromYear: "", toYear: "" }));
      return;
    }
    if (chip.startsWith("Genre:")) {
      setFilters((prev) => ({ ...prev, genres: [] }));
      return;
    }
    if (chip.startsWith("Sort:")) {
      setFilters((prev) => ({ ...prev, sortBy: "rating" }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          <aside className="w-60 flex-shrink-0 self-start">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <div className="flex items-center gap-2 mb-6">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <h3>Filters</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block mb-3 text-sm">TMDB Rating</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={filters.minRating}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, minRating: parseFloat(event.target.value) }))
                    }
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>0</span>
                    <span className="text-primary">{filters.minRating}+</span>
                    <span>10</span>
                  </div>
                </div>

                <div>
                  <label className="block mb-3 text-sm">Year Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={filters.fromYear}
                      onChange={(event) => setFilters((prev) => ({ ...prev, fromYear: event.target.value }))}
                      placeholder="From"
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                    />
                    <input
                      type="number"
                      value={filters.toYear}
                      onChange={(event) => setFilters((prev) => ({ ...prev, toYear: event.target.value }))}
                      placeholder="To"
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-3 text-sm">Genre</label>
                  <div className="space-y-2">
                    {GENRES.map((genre) => (
                      <label key={genre} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.genres.includes(genre)}
                          onChange={() => toggleGenre(genre)}
                          className="w-4 h-4 rounded border-border accent-primary"
                        />
                        <span className="text-sm text-foreground">{genre}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block mb-3 text-sm">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(event) => setFilters((prev) => ({ ...prev, sortBy: event.target.value }))}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="rating">Highest Rated</option>
                    <option value="year">Newest</option>
                    <option value="title">Title (A-Z)</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => void applyFilters()}
                    className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm transition-colors"
                  >
                    Apply filters
                  </button>
                  <button
                    onClick={() => void resetFilters()}
                    className="px-4 py-2 text-primary hover:text-primary/80 text-sm transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            {loading && (
              <div className="mb-6">
                <div>Loading...</div>
              </div>
            )}

            {error && (
              <div className="mb-6 rounded-lg border border-red-500 bg-red-50 text-red-700 px-4 py-3">
                {error}
              </div>
            )}

            {activeFilters.length > 0 && (
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                {activeFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => removeFilter(filter)}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary rounded-full text-sm text-primary hover:bg-primary/20 transition-colors"
                  >
                    {filter}
                    <X className="w-3 h-3" />
                  </button>
                ))}
                <button
                  onClick={() => void resetFilters()}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                Showing <span className="text-foreground">{results.length}</span> results
              </p>
              {enriching && <span className="text-xs text-muted-foreground">Loading posters...</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {results.map((movie) => (
                <MovieCard
                  key={movie.movieId}
                  id={movie.movieId}
                  title={movie.titleClean}
                  year={movie.year}
                  rating={movie.tmdbRatingLive ?? movie.tmdbRating}
                  voteCount={movie.tmdbVoteCountLive ?? movie.tmdbVoteCount}
                  posterUrl={movie.tmdbPosterUrl}
                  genres={splitGenres(movie.genres)}
                  variant="grid"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
