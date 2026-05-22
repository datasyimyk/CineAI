package com.internship.movierecommender.repository;

import com.internship.movierecommender.model.Recommendation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {

    List<Recommendation> findTop10ByMovieIdOrderByHybridScoreDesc(Long movieId);
}
