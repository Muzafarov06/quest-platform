package com.questplatform.figures.repository;

import com.questplatform.figures.entity.Figure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FigureRepository extends JpaRepository<Figure, UUID> {

    List<Figure> findByActiveTrueOrderBySortOrderAscCreatedAtAsc();

    List<Figure> findAllByOrderBySortOrderAscCreatedAtAsc();

    Optional<Figure> findByCode(String code);

    boolean existsByCode(String code);
}