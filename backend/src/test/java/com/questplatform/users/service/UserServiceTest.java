package com.questplatform.users.service;

import com.questplatform.common.exception.EmailAlreadyExistsException;
import com.questplatform.common.exception.InvalidCredentialsException;
import com.questplatform.users.entity.User;
import com.questplatform.users.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Интеграционные тесты для {@link UserService}.
 *
 * <p>{@code @Transactional} на уровне класса — после каждого теста откат,
 * данные не остаются в БД.</p>
 */
@SpringBootTest
@Transactional
class UserServiceTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ============================================================
    // createUser
    // ============================================================

    @Test
    @DisplayName("createUser() хеширует пароль и сохраняет пользователя")
    void createUser_hashesPassword_andPersists() {
        User saved = userService.createUser(
                "gina@example.com",
                "secret123",
                "Gina"
        );

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getEmail()).isEqualTo("gina@example.com");
        assertThat(saved.getDisplayName()).isEqualTo("Gina");
        // пароль НЕ хранится в открытом виде
        assertThat(saved.getPasswordHash()).isNotEqualTo("secret123");
        // но matches() подтверждает, что это хеш именно от "secret123"
        assertThat(passwordEncoder.matches("secret123", saved.getPasswordHash())).isTrue();
    }

    @Test
    @DisplayName("createUser() бросает исключение при дублирующемся email")
    void createUser_fails_onDuplicateEmail() {
        userService.createUser("henry@example.com", "p1", "Henry");

        assertThatThrownBy(() ->
                userService.createUser("henry@example.com", "p2", "Henry2")
        ).isInstanceOf(EmailAlreadyExistsException.class)
                .hasMessageContaining("Email уже занят");
    }

    @Test
    @DisplayName("findByEmail() находит пользователя, созданного через сервис")
    void findByEmail_findsCreatedUser() {
        userService.createUser("ivy@example.com", "p", "Ivy");

        assertThat(userService.findByEmail("ivy@example.com")).isPresent();
    }

    // ============================================================
    // authenticate
    // ============================================================

    @Test
    @DisplayName("authenticate() возвращает пользователя при верных данных и обновляет lastLoginAt")
    void authenticate_succeeds_withCorrectCredentials() {
        userService.createUser("john@example.com", "password123", "John");

        User authenticated = userService.authenticate("john@example.com", "password123");

        assertThat(authenticated.getEmail()).isEqualTo("john@example.com");
        assertThat(authenticated.getLastLoginAt()).isNotNull();
    }

    @Test
    @DisplayName("authenticate() кидает InvalidCredentialsException при неверном пароле")
    void authenticate_fails_withWrongPassword() {
        userService.createUser("kate@example.com", "password123", "Kate");

        assertThatThrownBy(() ->
                userService.authenticate("kate@example.com", "wrong-password")
        ).isInstanceOf(InvalidCredentialsException.class)
                .hasMessageContaining("Неверный email или пароль");
    }

    @Test
    @DisplayName("authenticate() кидает InvalidCredentialsException при несуществующем email")
    void authenticate_fails_withUnknownEmail() {
        assertThatThrownBy(() ->
                userService.authenticate("ghost@example.com", "any-password")
        ).isInstanceOf(InvalidCredentialsException.class)
                .hasMessageContaining("Неверный email или пароль");
    }
}