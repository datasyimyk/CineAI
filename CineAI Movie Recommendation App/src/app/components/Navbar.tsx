import { Film, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleHomeClick = () => {
    if (location.pathname === "/") {
      navigate("/", {
        replace: true,
        state: { resetHomeAt: Date.now() },
      });
      return;
    }

    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Film className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">CineAI</span>
          </Link>

          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={handleHomeClick}
              className="text-foreground hover:text-primary transition-colors"
            >
              Home
            </button>
            <Link to="/search" className="text-foreground hover:text-primary transition-colors">
              Filter
            </Link>
            <Link to="/watchlist" className="text-foreground hover:text-primary transition-colors">
              Watchlist
            </Link>
          </div>

          <button className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:border-primary transition-colors">
            <User className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>
    </nav>
  );
}
