package com.internship.movierecommender.service;

import com.internship.movierecommender.model.Movie;
import com.internship.movierecommender.model.Recommendation;
import com.internship.movierecommender.repository.MovieRepository;
import com.internship.movierecommender.repository.RecommendationRepository;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    private final MovieRepository movieRepository;
    private final RecommendationRepository recommendationRepository;
    private final int csvBufferSize;

    public DataLoader(
            MovieRepository movieRepository,
            RecommendationRepository recommendationRepository,
            @Value("${app.csv.buffer-size:8192}") int csvBufferSize) {
        this.movieRepository = movieRepository;
        this.recommendationRepository = recommendationRepository;
        this.csvBufferSize = csvBufferSize;
    }

    @Override
    public void run(String... args) throws Exception {
        List<Movie> movies = loadMovies("clean_movies_tmdb.csv");
        movieRepository.deleteAllInBatch();
        movieRepository.saveAll(movies);

        List<Recommendation> recommendations = loadRecommendations("recommendations.csv");
        recommendationRepository.deleteAllInBatch();
        recommendationRepository.saveAll(recommendations);

        System.out.printf("Loaded %d movies and %d recommendations%n", movies.size(), recommendations.size());
    }

    private List<Movie> loadMovies(String resourceName) throws IOException {
        ClassPathResource resource = new ClassPathResource(resourceName);
        if (!resource.exists()) {
            throw new IllegalStateException("Missing classpath resource: " + resourceName);
        }

        List<Movie> movies = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8), csvBufferSize)) {

            reader.readLine();
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }
                List<String> columns = parseCsvLine(line);

                Long movieId = parseLong(getValue(columns, 0));
                if (movieId == null) {
                    continue;
                }

                Movie movie = new Movie(
                        movieId,
                        normalizeText(getValue(columns, 1)),
                        parseInteger(getValue(columns, 2)),
                        normalizeText(getValue(columns, 3)),
                        normalizeText(getValue(columns, 4)),
                        normalizeText(getValue(columns, 5)),
                        parseDouble(getValue(columns, 6)),
                        parseInteger(getValue(columns, 7)),
                        parseDouble(getValue(columns, 8)),
                        parseLong(getValue(columns, 9)),
                        parseLong(getValue(columns, 10))
                );
                movies.add(movie);
            }
        }
        return movies;
    }

    private List<Recommendation> loadRecommendations(String resourceName) throws IOException {
        ClassPathResource resource = new ClassPathResource(resourceName);
        if (!resource.exists()) {
            throw new IllegalStateException("Missing classpath resource: " + resourceName);
        }

        List<Recommendation> recommendations = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8), csvBufferSize)) {

            reader.readLine();
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }
                List<String> columns = parseCsvLine(line);

                Long movieId = parseLong(getValue(columns, 0));
                Long recommendedMovieId = parseLong(getValue(columns, 1));
                if (movieId == null || recommendedMovieId == null) {
                    continue;
                }

                Recommendation recommendation = new Recommendation();
                recommendation.setMovieId(movieId);
                recommendation.setRecommendedMovieId(recommendedMovieId);
                recommendation.setHybridScore(parseDouble(getValue(columns, 2)));
                recommendation.setTmdbRating(parseDouble(getValue(columns, 3)));
                recommendations.add(recommendation);
            }
        }
        return recommendations;
    }

    private List<String> parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);

            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                values.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        values.add(current.toString());
        return values;
    }

    private String getValue(List<String> columns, int index) {
        return index < columns.size() ? columns.get(index) : null;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Long parseLong(String value) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            return null;
        }
        try {
            return Long.parseLong(normalized);
        } catch (NumberFormatException ex) {
            try {
                return (long) Double.parseDouble(normalized);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
    }

    private Integer parseInteger(String value) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            return null;
        }
        try {
            return Integer.parseInt(normalized);
        } catch (NumberFormatException ex) {
            try {
                return (int) Double.parseDouble(normalized);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
    }

    private Double parseDouble(String value) {
        String normalized = normalizeText(value);
        if (normalized == null) {
            return null;
        }
        try {
            return Double.parseDouble(normalized);
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
