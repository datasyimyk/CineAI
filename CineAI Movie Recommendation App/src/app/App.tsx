import { BrowserRouter, Routes, Route } from 'react-router';
import { Home } from './pages/Home';
import { SearchResults } from './pages/SearchResults';
import { MovieDetail } from './pages/MovieDetail';
import { Watchlist } from './pages/Watchlist';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
