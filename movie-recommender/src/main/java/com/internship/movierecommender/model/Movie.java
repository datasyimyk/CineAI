package com.internship.movierecommender.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "movies")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Movie {

    @Id
    @Column(name = "movieId")
    private Long movieId;

    @Column(name = "title_clean", length = 1000)
    private String titleClean;

    @Column(name = "`year`")
    private Integer year;

    @Column(name = "genres", length = 2000)
    private String genres;

    @Column(name = "genres_clean", length = 2000)
    private String genresClean;

    @Column(name = "tags_clean", length = 8000)
    private String tagClean;

    @Column(name = "tmdb_rating")
    private Double tmdbRating;

    @Column(name = "tmdb_vote_count")
    private Integer tmdbVoteCount;

    @Column(name = "tmdb_weighted_rating")
    private Double tmdbWeightedRating;

    @Column(name = "imdbId")
    private Long imdbId;

    @Column(name = "tmdbId")
    private Long tmdbId;
}
