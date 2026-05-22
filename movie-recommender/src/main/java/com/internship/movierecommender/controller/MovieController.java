package com.internship.movierecommender.controller;

import com.internship.movierecommender.service.MovieService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/movies")
@CrossOrigin(origins = "*")
public class MovieController {

    private final MovieService movieService;

    public MovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    @GetMapping("/popular")
    public ResponseEntity<?> getPopularMovies() {
        return ResponseEntity.ok(movieService.getPopularMovies());
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchMovies(@RequestParam(name = "q", required = false) String query) {
        return ResponseEntity.ok(movieService.searchMovies(query));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getMovieById(@PathVariable Long id) {
        return ResponseEntity.ok(movieService.getMovieById(id));
    }

    @GetMapping("/{id}/recommendations")
    public ResponseEntity<?> getRecommendations(@PathVariable Long id) {
        return ResponseEntity.ok(movieService.getRecommendations(id));
    }

    @GetMapping("/filter")
    public ResponseEntity<?> filterMovies(
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Integer fromYear,
            @RequestParam(required = false) Integer toYear,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String sortBy) {
        return ResponseEntity.ok(movieService.filterMovies(minRating, fromYear, toYear, genre, sortBy));
    }
}
