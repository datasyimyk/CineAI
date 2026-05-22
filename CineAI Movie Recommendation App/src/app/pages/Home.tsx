import { Search, Zap, Laugh, Drama, Rocket, Ghost, Sparkles, Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Footer } from "../components/Footer";
import { GenrePill } from "../components/GenrePill";
import { MovieCard } from "../components/MovieCard";
import { Navbar } from "../components/Navbar";
import { filterMovies, getPopularMovies, searchMovies } from "../../api/movieApi";
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

const GENRES = [
  { name: "Action", icon: <Zap className="w-4 h-4" /> },
  { name: "Comedy", icon: <Laugh className="w-4 h-4" /> },
  { name: "Drama", icon: <Drama className="w-4 h-4" /> },
  { name: "Sci-Fi", icon: <Rocket className="w-4 h-4" /> },
  { name: "Horror", icon: <Ghost className="w-4 h-4" /> },
  { name: "Animation", icon: <Sparkles className="w-4 h-4" /> },
  { name: "Thriller", icon: <Flame className="w-4 h-4" /> },
];

const API_ERROR = "Could not connect. Make sure Spring Boot is running on port 8080.";

function splitGenres(genres: string | null): string[] {
  if (!genres) {
    return [];
  }
  return genres.split("|").map((genre) => genre.trim()).filter(Boolean);
}

export function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [popularMovies, setPopularMovies] = useState<Array<MovieWithTmdb<Movie>>>([]);
  const [searchResults, setSearchResults] = useState<Array<MovieWithTmdb<Movie>>>([]);
  const [genreResults, setGenreResults] = useState<Array<MovieWithTmdb<Movie>>>([]);
  const [suggestions, setSuggestions] = useState<Array<MovieWithTmdb<Movie>>>([]);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPopular = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPopularMovies();
        const enriched = await enrichMovieListWithTmdb(Array.isArray(data) ? data : []);
        setPopularMovies(enriched);
      } catch {
        setError(API_ERROR);
      } finally {
        setLoading(false);
      }
    };
    void loadPopular();
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSuggestions([]);
      setIsSuggestionOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await searchMovies(query);
        const startsWith = (Array.isArray(data) ? data : []).filter((movie: Movie) =>
          movie.titleClean?.toLowerCase().startsWith(query.toLowerCase()),
        );
        const enriched = await enrichMovieListWithTmdb(startsWith.slice(0, 8));
        setSuggestions(enriched);
        setIsSuggestionOpen(enriched.length > 0);
      } catch {
        setSuggestions([]);
        setIsSuggestionOpen(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const state = (location.state ?? null) as { resetHomeAt?: number } | null;
    if (location.pathname !== "/" || typeof state?.resetHomeAt !== "number") {
      return;
    }

    setSelectedGenre("");
    setGenreResults([]);
    setSearchQuery("");
    setSearchResults([]);
    setSuggestions([]);
    setIsSuggestionOpen(false);
    setError(null);
  }, [location.pathname, location.state]);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSuggestions([]);
      setIsSuggestionOpen(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await searchMovies(trimmed);
      const enriched = await enrichMovieListWithTmdb(Array.isArray(data) ? data : []);
      setSearchResults(enriched);
      setIsSuggestionOpen(false);
    } catch {
      setError(API_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handleGenreClick = async (genre: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await filterMovies({ genre });
      setSelectedGenre(genre);
      const enriched = await enrichMovieListWithTmdb(Array.isArray(data) ? data : []);
      setGenreResults(enriched);
    } catch {
      setError(API_ERROR);
    } finally {
      setLoading(false);
    }
  };

  const moviesToDisplay = selectedGenre ? genreResults : popularMovies;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl mb-4">Discover your next favorite film</h1>
          <p className="text-xl text-muted-foreground mb-8">Powered by AI-driven recommendations</p>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setSearchQuery(nextValue);
                    if (!nextValue.trim()) {
                      setSearchResults([]);
                    }
                  }}
                  onFocus={() => setIsSuggestionOpen(suggestions.length > 0)}
                  placeholder="Search any movie title..."
                  className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                {isSuggestionOpen && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-card border border-border rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                    {suggestions.map((movie) => (
                      <button
                        key={movie.movieId}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setSearchQuery(movie.titleClean);
                          setIsSuggestionOpen(false);
                          navigate(`/movie/${movie.movieId}`);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-b-0"
                      >
                        <div className="text-sm text-foreground">{movie.titleClean}</div>
                        <div className="text-xs text-muted-foreground">
                          {movie.year ?? "N/A"}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors">
                Search
              </button>
            </div>
          </form>
        </div>

        {loading && (
          <div className="mb-8">
            <div>Loading...</div>
          </div>
        )}

        {error && (
          <div className="mb-8 rounded-lg border border-red-500 bg-red-50 text-red-700 px-4 py-3">
            {error}
          </div>
        )}

        {searchResults.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Search className="w-6 h-6 text-primary" />
              <h2>Search Results</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {searchResults.map((movie) => (
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
          </section>
        )}

        <section className="mb-16">
          <h2 className="mb-6">Browse by Genre</h2>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedGenre("");
                setGenreResults([]);
              }}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                selectedGenre ? "border-border text-foreground hover:border-primary" : "border-primary bg-primary/10 text-primary"
              }`}
            >
              Popular
            </button>
            {GENRES.map((genre) => (
              <GenrePill
                key={genre.name}
                name={genre.name}
                icon={genre.icon}
                active={selectedGenre.toLowerCase() === genre.name.toLowerCase()}
                onClick={() => void handleGenreClick(genre.name)}
              />
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <Flame className="w-6 h-6 text-primary" />
            <h2>{selectedGenre ? `${selectedGenre} Movies` : "Popular Movies"}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {moviesToDisplay.map((movie) => (
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
        </section>
      </div>

      <Footer />
    </div>
  );
}
