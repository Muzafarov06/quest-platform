package com.questplatform.objects.repository;

import com.questplatform.objects.domain.GameObjectType;
import com.questplatform.objects.entity.GameObject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GameObjectRepository extends JpaRepository<GameObject, UUID> {

    List<GameObject> findByLocationIdOrderBySortOrderAscNameAsc(UUID locationId);

    List<GameObject> findByLocationIdAndObjectType(UUID locationId, GameObjectType objectType);

    boolean existsByLocationId(UUID locationId);
}