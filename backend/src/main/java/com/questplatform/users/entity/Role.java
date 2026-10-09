package com.questplatform.users.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Роль пользователя.
 *
 * <p>Справочная таблица: небольшое количество строк (USER, ADMIN, ...).
 * Меняется редко. Поэтому {@code @ManyToMany} без отдельной сущности
 * для {@code user_roles} — Spring/JPA умеет работать через {@code @JoinTable}.</p>
 */
@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
public class Role {

    @Id
    @Column(name = "id", nullable = false)
    private Short id;

    @Column(name = "code", nullable = false, unique = true, length = 30)
    private String code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;
}