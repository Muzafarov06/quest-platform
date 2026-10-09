package com.questplatform.users.repository;

import com.questplatform.users.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Репозиторий для работы с {@link User}.
 *
 * <p>Spring Data JPA автоматически генерирует реализацию этого интерфейса.
 * Нам не нужно писать код — достаточно объявить методы.</p>
 *
 * <p>Наследование от {@link JpaRepository} даёт базовый набор:
 * save, findById, findAll, delete, count, existsById и т.д.</p>
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Найти пользователя по email ВМЕСТЕ С РОЛЯМИ.
     *
     * <p>{@code @EntityGraph} заставляет Hibernate сделать {@code LEFT JOIN FETCH}
     * для ролей в одном запросе. Без этого обращение к {@code user.getRoles()}
     * вне транзакции упадёт с {@code LazyInitializationException}.</p>
     */
    @EntityGraph(attributePaths = "roles")
    Optional<User> findByEmail(String email);

    /**
     * Найти пользователя по id ВМЕСТЕ С РОЛЯМИ.
     *
     * <p>Используется в JwtAuthenticationFilter: нужно вытащить роли,
     * чтобы положить их в SecurityContext как authorities.</p>
     */
    @EntityGraph(attributePaths = "roles")
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findWithRolesById(@Param("id") UUID id);

    /**
     * Проверить, существует ли пользователь с таким email.
     * Эффективнее, чем findByEmail().isPresent() — не тянет всю строку.
     */
    boolean existsByEmail(String email);
}