package com.questplatform.locations.repository;

import com.questplatform.locations.domain.DiscoveryMode;
import com.questplatform.locations.domain.LocationType;
import com.questplatform.locations.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LocationRepository extends JpaRepository<Location, UUID> {

    List<Location> findByCaseIdOrderBySortOrderAscNameAsc(UUID caseId);

    /** Только корневые локации — для карты дела. */
    List<Location> findByCaseIdAndParentIdIsNullOrderBySortOrderAscNameAsc(UUID caseId);

    List<Location> findByParentIdOrderBySortOrderAscNameAsc(UUID parentId);

    List<Location> findByCaseIdAndLocationType(UUID caseId, LocationType locationType);

    boolean existsByCaseId(UUID caseId);

    /** Все локации кейса с заданным режимом открытия. */
    List<Location> findByCaseIdAndDiscoveryMode(UUID caseId, DiscoveryMode discoveryMode);

    /** Локации кейса с заданным режимом и конкретным targetId. */
    List<Location> findByCaseIdAndDiscoveryModeAndDiscoveryTargetId(
            UUID caseId, DiscoveryMode discoveryMode, UUID discoveryTargetId);
}