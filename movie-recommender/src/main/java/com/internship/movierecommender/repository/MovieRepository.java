package com.internship.movierecommender.repository;

import com.internship.movierecommender.model.Movie;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long> {

    List<Movie> findByTitleCleanContainingIgnoreCase(String title);

    List<Movie> findTop20ByOrderByTmdbWeightedRatingDesc();

    List<Movie> findByGenresContainingIgnoreCase(String genre);

    Page<Movie> findAll(Pageable pageable);

    @Query("""
            SELECT m
            FROM Movie m
            WHERE m.tmdbRating >= :minRating
              AND m.year BETWEEN :fromYear AND :toYear
            """)
    List<Movie> findByTmdbRatingAndYearRange(
            @Param("minRating") Double minRating,
            @Param("fromYear") Integer fromYear,
            @Param("toYear") Integer toYear);
}
