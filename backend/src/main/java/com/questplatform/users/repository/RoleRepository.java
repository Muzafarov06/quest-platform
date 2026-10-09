package com.questplatform.users.repository;

import com.questplatform.users.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Репозиторий ролей.
 *
 * <p>Используется в {@link com.questplatform.users.service.UserService}
 * при регистрации — чтобы выдать новому пользователю роль USER.</p>
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Short> {

    Optional<Role> findByCode(String code);
}