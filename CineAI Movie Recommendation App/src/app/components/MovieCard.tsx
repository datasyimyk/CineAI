import { Star } from "lucide-react";
import { Link } from "react-router";

interface MovieCardProps {
  id: number;
  title: string;
  year?: string | number | null;
  rating?: number | null;
  voteCount?: number | null;
  genres?: string[];
  posterUrl?: string | null;
  variant?: "poster" | "grid";
  showMatchBadge?: boolean;
  matchTone?: "green" | "amber" | "gray";
}

export function MovieCard({
  id,
  title,
  year,
  rating,
  voteCount,
  genres,
  posterUrl,
  variant = "poster",
  showMatchBadge = false,
  matchTone = "gray",
}: MovieCardProps) {
  const badgeColor =
    matchTone === "green"
      ? "bg-green-600 text-white"
      : matchTone === "amber"
      ? "bg-amber-500 text-white"
      : "bg-gray-500 text-white";

  if (variant === "poster") {
    return (
      <Link to={`/movie/${id}`} className="group flex-shrink-0 w-56">
        <div className="relative h-72 rounded-lg border border-border overflow-hidden group-hover:border-primary transition-all">
          {posterUrl ? (
            <img src={posterUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-card via-card to-muted" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
          {showMatchBadge && (
            <span className={`absolute top-3 left-3 px-2 py-1 rounded-md text-xs ${badgeColor}`}>
              Match
            </span>
          )}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-sm text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground mb-1">{year ?? "N/A"}</p>
            <div className="flex items-center gap-1 text-gold">
              <Star className="w-3 h-3 fill-gold" />
              <span className="text-xs text-foreground">
                {typeof rating === "number" ? rating.toFixed(1) : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/movie/${id}`} className="group block h-full">
      <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary transition-all h-full">
        <div className="aspect-[2/3]">
          {posterUrl ? (
            <img src={posterUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-card via-card to-muted flex items-center justify-center text-sm text-muted-foreground">
              No poster
            </div>
          )}
        </div>
        <div className="p-4">
        <h3 className="group-hover:text-primary transition-colors line-clamp-1 mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-2">{year ?? "N/A"}</p>
        <div className="flex items-center gap-1 mb-2 text-gold">
          <Star className="w-4 h-4 fill-gold" />
          <span className="text-sm text-foreground">
            {typeof rating === "number" ? rating.toFixed(1) : "N/A"}
          </span>
        </div>
        {typeof voteCount === "number" && (
          <p className="text-xs text-muted-foreground mb-3">({voteCount.toLocaleString()} votes)</p>
        )}
        {genres && genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {genres.slice(0, 3).map((genre) => (
              <span key={genre} className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                {genre}
              </span>
            ))}
          </div>
        )}
        </div>
      </div>
    </Link>
  );
}
