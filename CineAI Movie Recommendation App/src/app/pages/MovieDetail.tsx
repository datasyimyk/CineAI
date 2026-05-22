import { useEffect, useMemo, useState } from "react";
import { BookmarkPlus, Check, ExternalLink, Sparkles, Star } from "lucide-react";
import { useParams } from "react-router";
import { Footer } from "../components/Footer";
import { MovieCard } from "../components/MovieCard";
import { Navbar } from "../components/Navbar";
import { getMovieById, getRecommendations } from "../../api/movieApi";
import { enrichMovieListWithTmdb, getTmdbMovieDetails, MovieWithTmdb, TmdbMovieDetails } from "../../api/tmdbApi";
import { addToWatchlist, isInWatchlist as hasInWatchlist, readWatchlistIds, removeFromWatchlist } from "../utils/watchlist";

interface Movie {
  movieId: number;
  titleClean: string;
  year: number | null;
  genres: string | null;
  genresClean?: string | null;
  tagsClean?: string | null;
  tagClean?: string | null;
  tmdbRating: number | null;
  tmdbVoteCount: number | null;
  tmdbWeightedRating: number | null;
  imdbId: number | null;
  tmdbId: number | null;
}

const API_ERROR = "Could not connect. Make sure Spring Boot is running on port 8080.";

function splitGenres(genres: string | null): string[] {
  if (!genres) {
    return [];
  }
  return genres.split("|").map((genre) => genre.trim()).filter(Boolean);
}

function getMatchTone(weightedRating: number | null): "green" | "amber" | "gray" {
  if (typeof weightedRating !== "number") {
    return "gray";
  }
  if (weightedRating >= 7) {
    return "green";
  }
  if (weightedRating >= 5) {
    return "amber";
  }
  return "gray";
}

function buildImdbCode(imdbId: number | null): string | null {
  if (imdbId === null || imdbId === undefined) {
    return null;
  }
  return `tt${String(imdbId).padStart(7, "0")}`;
}

function buildInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [recommendations, setRecommendations] = useState<Array<MovieWithTmdb<Movie>>>([]);
  const [tmdbDetails, setTmdbDetails] = useState<TmdbMovieDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);

  useEffect(() => {
    const loadMovie = async () => {
      if (!id) {
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const [movieData, recommendationData] = await Promise.all([
          getMovieById(id),
          getRecommendations(id),
        ]);

        setMovie(movieData ?? null);

        const details = await getTmdbMovieDetails(movieData?.tmdbId);
        setTmdbDetails(details);

        const enrichedRecommendations = await enrichMovieListWithTmdb(
          Array.isArray(recommendationData) ? recommendationData.slice(0, 10) : [],
        );
        setRecommendations(enrichedRecommendations);
      } catch {
        setError(API_ERROR);
      } finally {
        setLoading(false);
      }
    };

    void loadMovie();
  }, [id]);

  useEffect(() => {
    if (!movie?.movieId) {
      setInWatchlist(false);
      return;
    }
    const ids = readWatchlistIds();
    setInWatchlist(ids.includes(movie.movieId));
  }, [movie?.movieId]);

  const scorePercent = useMemo(() => {
    if (!movie || typeof movie.tmdbWeightedRating !== "number") {
      return 0;
    }
    const value = (movie.tmdbWeightedRating / 10) * 100;
    return Math.min(100, Math.max(0, value));
  }, [movie]);

  const genres = splitGenres(movie?.genres ?? null);
  const imdbCode = buildImdbCode(movie?.imdbId ?? null);
  const displayRating = tmdbDetails?.voteAverage ?? movie?.tmdbRating ?? null;
  const displayVoteCount = tmdbDetails?.voteCount ?? movie?.tmdbVoteCount ?? null;
  const displayOverview = tmdbDetails?.overview ?? null;
  const displayRuntime = tmdbDetails?.runtime ?? null;
  const displayCast = tmdbDetails?.cast ?? [];

  const handleWatchlistToggle = () => {
    if (!movie?.movieId) {
      return;
    }

    if (hasInWatchlist(movie.movieId)) {
      removeFromWatchlist(movie.movieId);
      setInWatchlist(false);
      return;
    }

    addToWatchlist(movie.movieId);
    setInWatchlist(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {tmdbDetails?.backdropUrl && (
        <div className="relative mt-4 h-[360px] w-full">
          <img
            src={tmdbDetails.backdropUrl}
            alt={movie?.titleClean ?? "Backdrop"}
            className="w-full h-full object-cover object-[center_32%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/20" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-12">
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

        {!loading && !error && movie && (
          <>
            <section className="mb-12">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                {tmdbDetails?.posterUrl && (
                  <div className="shrink-0">
                    <img
                      src={tmdbDetails.posterUrl}
                      alt={movie.titleClean}
                      className="w-48 rounded-xl border border-border shadow-xl"
                    />
                  </div>
                )}

                <div className="max-w-4xl lg:pr-8">
                  <h1 className="text-5xl mb-3">{movie.titleClean}</h1>
                  <div className="flex flex-wrap items-center gap-3 mb-5 text-muted-foreground">
                    <span>{movie.year ?? "N/A"}</span>
                    {typeof displayRuntime === "number" && <span>{displayRuntime} min</span>}
                    {genres.map((genre) => (
                      <span key={genre} className="px-3 py-1 bg-primary/10 border border-primary rounded-full text-sm text-primary">
                        {genre}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-end gap-3 mb-2">
                    <Star className="w-8 h-8 text-gold fill-gold" />
                    <div className="text-4xl text-gold">
                      {typeof displayRating === "number" ? displayRating.toFixed(1) : "N/A"} / 10
                    </div>
                  </div>
                  <div className="text-muted-foreground mb-6">
                    ({typeof displayVoteCount === "number" ? displayVoteCount.toLocaleString() : "0"} votes)
                  </div>

                  <div className="mb-6">
                    <div className="text-sm text-muted-foreground mb-2">
                      Bayesian score: {typeof movie.tmdbWeightedRating === "number" ? movie.tmdbWeightedRating.toFixed(2) : "N/A"} / 10
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${scorePercent}%` }} />
                    </div>
                  </div>

                  {displayOverview && <p className="text-muted-foreground mb-8 leading-relaxed max-w-4xl">{displayOverview}</p>}

                  <div className="flex flex-wrap gap-3 mb-8">
                    <button
                      type="button"
                      onClick={handleWatchlistToggle}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-primary rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      {inWatchlist ? (
                        <>
                          <Check className="w-4 h-4" />
                          Added to Watchlist
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-4 h-4" />
                          Add to Watchlist
                        </>
                      )}
                    </button>

                    {movie.tmdbId && (
                      <a
                        href={`https://www.themoviedb.org/movie/${movie.tmdbId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:border-primary transition-colors"
                      >
                        TMDB
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {imdbCode && (
                      <a
                        href={`https://www.imdb.com/title/${imdbCode}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:border-primary transition-colors"
                      >
                        IMDb
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                </div>
              </div>

              {displayCast.length > 0 && (
                <div className="mt-10">
                  <h3 className="mb-4">Actors Team</h3>
                  <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {displayCast.map((actor) => (
                      <div key={actor.id} className="flex flex-col items-center text-center">
                        {actor.profileUrl ? (
                          <div className="mb-3 h-24 w-24 overflow-hidden rounded-full bg-muted/40 ring-2 ring-primary/30 shadow-lg shadow-black/20">
                            <img
                              src={actor.profileUrl}
                              alt={actor.name}
                              className="h-full w-full scale-100 object-contain object-center"
                            />
                          </div>
                        ) : (
                          <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-muted/70 ring-2 ring-primary/20 text-sm text-foreground">
                            {buildInitials(actor.name)}
                          </div>
                        )}
                        <div className="text-sm leading-tight">{actor.name}</div>
                        {actor.character && (
                          <div className="mt-1 text-xs text-muted-foreground leading-tight">{actor.character}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="mb-12">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-6 h-6 text-primary" />
                <h2>Because you liked {movie.titleClean}</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {recommendations.map((recommendedMovie) => (
                  <MovieCard
                    key={recommendedMovie.movieId}
                    id={recommendedMovie.movieId}
                    title={recommendedMovie.titleClean}
                    year={recommendedMovie.year}
                    rating={recommendedMovie.tmdbRatingLive ?? recommendedMovie.tmdbRating}
                    voteCount={recommendedMovie.tmdbVoteCountLive ?? recommendedMovie.tmdbVoteCount}
                    posterUrl={recommendedMovie.tmdbPosterUrl}
                    variant="poster"
                    showMatchBadge
                    matchTone={getMatchTone(recommendedMovie.tmdbWeightedRating)}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
