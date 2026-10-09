package com.questplatform.users.entity;

import com.questplatform.users.domain.UserStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Пользователь платформы.
 *
 * <p>Маппится на таблицу {@code users} (см. миграцию V1).</p>
 *
 * <p>Поля класса совпадают с колонками таблицы. Hibernate читает аннотации
 * и понимает, какому столбцу соответствует каждая строка Java.</p>
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "display_name", nullable = false, length = 50)
    private String displayName;

    @Column(name = "avatar_key", nullable = false, length = 50)
    private String avatarKey = "default";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    /**
     * Роли пользователя.
     *
     * <p>{@code FetchType.LAZY} — роли грузятся только когда явно запросишь
     * {@code user.getRoles()}. Это важно: не тянем роли при каждом запросе юзера.</p>
     *
     * <p>Чтобы избежать {@code LazyInitializationException} в JWT-фильтре
     * (он работает вне транзакции), используем {@code @EntityGraph} в
     * {@code UserRepository#findWithRolesById}.</p>
     *
     * <p>{@code Set}, а не {@code List} — роли уникальны, дубли невозможны.</p>
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    // ---------- Callbacks жизненного цикла ----------

    /**
     * Вызывается Hibernate'ом ПЕРЕД первичной вставкой строки в БД.
     * Проставляет createdAt, если он ещё не задан.
     */
    @jakarta.persistence.PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (avatarKey == null || avatarKey.isBlank()) {
            avatarKey = "default";
        }
        if (status == null) {
            status = UserStatus.ACTIVE;
        }
    }
}