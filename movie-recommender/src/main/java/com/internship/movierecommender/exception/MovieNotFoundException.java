package com.internship.movierecommender.exception;

public class MovieNotFoundException extends RuntimeException {

    public MovieNotFoundException(Long movieId) {
        super("Movie not found with id: " + movieId);
    }
}
