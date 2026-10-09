package com.questplatform.locations.repository;

import com.questplatform.locations.entity.LocationConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LocationConnectionRepository extends JpaRepository<LocationConnection, UUID> {

    List<LocationConnection> findByFromLocationIdOrderBySortOrderAscIdAsc(UUID fromLocationId);

    List<LocationConnection> findByCaseIdOrderBySortOrderAscIdAsc(UUID caseId);

    boolean existsByFromLocationIdAndToLocationId(UUID fromLocationId, UUID toLocationId);
}