package com.questplatform.users.repository;

import com.questplatform.users.domain.UserStatus;
import com.questplatform.users.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Интеграционные тесты для {@link UserRepository}.
 *
 * <p>Поднимают полный Spring Boot контекст и работают с настоящим PostgreSQL.</p>
 *
 * <p>Аннотация {@code @Transactional} на уровне класса означает:
 * после каждого метода — откат. Данные не остаются в БД между тестами.</p>
 */
@SpringBootTest
@Transactional
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    private User newUser(String email) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash("$2a$10$dummy.hash.for.test");
        user.setDisplayName("Test User");
        return user;
    }

    @Test
    @DisplayName("save() сохраняет пользователя и возвращает его с заполненным id и createdAt")
    void save_persistsUserWithGeneratedIdAndTimestamp() {
        User saved = userRepository.save(newUser("alice@example.com"));

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(saved.getAvatarKey()).isEqualTo("default");
    }

    @Test
    @DisplayName("findById() возвращает сохранённого пользователя")
    void findById_returnsSavedUser() {
        User saved = userRepository.save(newUser("bob@example.com"));
        UUID id = saved.getId();

        Optional<User> found = userRepository.findById(id);

        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("bob@example.com");
        assertThat(found.get().getDisplayName()).isEqualTo("Test User");
    }

    @Test
    @DisplayName("findByEmail() находит пользователя по email")
    void findByEmail_returnsUser() {
        userRepository.save(newUser("carol@example.com"));

        Optional<User> found = userRepository.findByEmail("carol@example.com");

        assertThat(found).isPresent();
        assertThat(found.get().getDisplayName()).isEqualTo("Test User");
    }

    @Test
    @DisplayName("findByEmail() для несуществующего email возвращает Optional.empty()")
    void findByEmail_returnsEmpty_forUnknownEmail() {
        Optional<User> found = userRepository.findByEmail("nobody@example.com");
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("existsByEmail() различает существующие и несуществующие email")
    void existsByEmail_worksCorrectly() {
        userRepository.save(newUser("dave@example.com"));

        assertThat(userRepository.existsByEmail("dave@example.com")).isTrue();
        assertThat(userRepository.existsByEmail("missing@example.com")).isFalse();
    }

    @Test
    @DisplayName("save() с дублирующимся email нарушает UNIQUE constraint")
    void save_withDuplicateEmail_fails() {
        userRepository.save(newUser("eve@example.com"));
        userRepository.flush(); // принудительно отправить INSERT в БД

        User duplicate = newUser("eve@example.com");

        assertThatThrownBy(() -> {
            userRepository.saveAndFlush(duplicate);
        }).isInstanceOf(Exception.class); // конкретный тип зависит от Spring/Hibernate
    }

    @Test
    @DisplayName("@PrePersist заполняет createdAt, avatarKey и status")
    void prePersist_fillsDefaults() {
        User user = new User();
        user.setEmail("frank@example.com");
        user.setPasswordHash("$2a$10$dummy");
        user.setDisplayName("Frank");
        // не задаём ни avatarKey, ни status, ни createdAt

        User saved = userRepository.save(user);

        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getAvatarKey()).isEqualTo("default");
        assertThat(saved.getStatus()).isEqualTo(UserStatus.ACTIVE);
    }
}