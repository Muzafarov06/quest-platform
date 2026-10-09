package com.questplatform.users.service;

import com.questplatform.users.domain.UserStatus;
import com.questplatform.users.entity.Role;
import com.questplatform.users.entity.User;
import com.questplatform.common.exception.EmailAlreadyExistsException;
import com.questplatform.users.repository.RoleRepository;
import com.questplatform.users.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.questplatform.common.exception.InvalidCredentialsException;
import java.time.Instant;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User createUser(String email, String rawPassword, String displayName) {
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException(email);
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setDisplayName(displayName);
        user.setStatus(UserStatus.ACTIVE);

        Role userRole = roleRepository.findByCode("USER")
                .orElseThrow(() -> new IllegalStateException(
                        "Роль USER не найдена. Проверь миграцию V21."));
        user.getRoles().add(userRole);

        return userRepository.save(user);
    }

    /**
     * Проверяет email и пароль. При успехе — обновляет lastLoginAt
     * и возвращает пользователя.
     *
     * @throws InvalidCredentialsException если email не найден или пароль не подходит
     */
    @Transactional
    public User authenticate(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        user.setLastLoginAt(Instant.now());
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public Optional<User> findById(UUID id) {
        return userRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}