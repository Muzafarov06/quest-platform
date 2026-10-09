package com.questplatform.common.jwt;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Тесты {@link JwtService}.
 *
 * <p>Не нужен {@code @Transactional} — тесты не трогают БД.</p>
 */
@SpringBootTest
class JwtServiceTest {

    @Autowired
    private JwtService jwtService;

    @Test
    @DisplayName("generateAccessToken() создаёт валидный токен с userId и email")
    void generateAccessToken_createsValidToken() {
        UUID userId = UUID.randomUUID();
        String email = "test@example.com";

        String token = jwtService.generateAccessToken(userId, email);

        assertThat(token).isNotBlank();
        assertThat(token.split("\\.")).hasSize(3); // header.payload.signature

        Optional<Claims> claims = jwtService.parseToken(token);
        assertThat(claims).isPresent();
        assertThat(claims.get().getSubject()).isEqualTo(userId.toString());
        assertThat(claims.get().get("email", String.class)).isEqualTo(email);
    }

    @Test
    @DisplayName("extractUserId() возвращает userId из валидного токена")
    void extractUserId_returnsUserId() {
        UUID userId = UUID.randomUUID();
        String token = jwtService.generateAccessToken(userId, "a@a.com");

        assertThat(jwtService.extractUserId(token)).contains(userId);
    }

    @Test
    @DisplayName("parseToken() возвращает empty для мусора")
    void parseToken_returnsEmpty_forGarbage() {
        assertThat(jwtService.parseToken("not-a-jwt")).isEmpty();
        assertThat(jwtService.parseToken("")).isEmpty();
    }

    @Test
    @DisplayName("parseToken() возвращает empty для токена с неправильной подписью")
    void parseToken_returnsEmpty_forWrongSignature() {
        UUID userId = UUID.randomUUID();
        String validToken = jwtService.generateAccessToken(userId, "a@a.com");
        // Портим последний символ подписи
        String tampered = validToken.substring(0, validToken.length() - 1)
                + (validToken.endsWith("a") ? "b" : "a");

        assertThat(jwtService.parseToken(tampered)).isEmpty();
    }
}