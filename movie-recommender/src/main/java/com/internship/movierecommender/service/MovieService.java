package com.internship.movierecommender.service;

import com.internship.movierecommender.exception.MovieNotFoundException;
import com.internship.movierecommender.model.Movie;
import com.internship.movierecommender.model.Recommendation;
import com.internship.movierecommender.repository.MovieRepository;
import com.internship.movierecommender.repository.RecommendationRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class MovieService {

    private final MovieRepository movieRepository;
    private final RecommendationRepository recommendationRepository;

    public MovieService(MovieRepository movieRepository, RecommendationRepository recommendationRepository) {
        this.movieRepository = movieRepository;
        this.recommendationRepository = recommendationRepository;
    }

    public List<Movie> getPopularMovies() {
        return movieRepository.findTop20ByOrderByTmdbWeightedRatingDesc();
    }

    public List<Movie> searchMovies(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return movieRepository.findByTitleCleanContainingIgnoreCase(query.trim());
    }

    public List<Movie> filterMovies(
            Double minRating,
            Integer fromYear,
            Integer toYear,
            String genre,
            String sortBy) {

        List<Movie> seed;
        if (minRating != null && fromYear != null && toYear != null) {
            seed = movieRepository.findByTmdbRatingAndYearRange(minRating, fromYear, toYear);
        } else {
            seed = movieRepository.findAll();
        }

        List<Movie> filtered = seed.stream()
                .filter(movie -> minRating == null
                        || (movie.getTmdbRating() != null && movie.getTmdbRating() >= minRating))
                .filter(movie -> fromYear == null
                        || (movie.getYear() != null && movie.getYear() >= fromYear))
                .filter(movie -> toYear == null
                        || (movie.getYear() != null && movie.getYear() <= toYear))
                .filter(movie -> genre == null
                        || genre.isBlank()
                        || (movie.getGenres() != null
                        && movie.getGenres().toLowerCase(Locale.ROOT)
                        .contains(genre.toLowerCase(Locale.ROOT))))
                .collect(Collectors.toCollection(ArrayList::new));

        filtered.sort(resolveComparator(sortBy));
        return filtered;
    }

    public Movie getMovieById(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new MovieNotFoundException(id));
    }

    public List<Movie> getRecommendations(Long movieId) {
        List<Recommendation> recommendationRows =
                recommendationRepository.findTop10ByMovieIdOrderByHybridScoreDesc(movieId);

        if (recommendationRows.isEmpty()) {
            return List.of();
        }

        List<Long> orderedMovieIds = recommendationRows.stream()
                .map(Recommendation::getRecommendedMovieId)
                .filter(Objects::nonNull)
                .toList();

        Map<Long, Movie> movieMap = movieRepository.findAllById(orderedMovieIds).stream()
                .collect(Collectors.toMap(Movie::getMovieId, movie -> movie, (a, b) -> a, LinkedHashMap::new));

        return orderedMovieIds.stream()
                .map(movieMap::get)
                .filter(Objects::nonNull)
                .toList();
    }

    private Comparator<Movie> resolveComparator(String sortBy) {
        if (sortBy == null || sortBy.isBlank()) {
            return Comparator.comparing(Movie::getTmdbWeightedRating,
                    Comparator.nullsLast(Comparator.reverseOrder()));
        }

        return switch (sortBy.toLowerCase(Locale.ROOT)) {
            case "rating" -> Comparator.comparing(Movie::getTmdbRating,
                    Comparator.nullsLast(Comparator.reverseOrder()));
            case "year" -> Comparator.comparing(Movie::getYear,
                    Comparator.nullsLast(Comparator.reverseOrder()));
            case "title" -> Comparator.comparing(Movie::getTitleClean,
                    Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            default -> Comparator.comparing(Movie::getTmdbWeightedRating,
                    Comparator.nullsLast(Comparator.reverseOrder()));
        };
    }
}
