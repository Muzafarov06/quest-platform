package com.questplatform.common.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

/**
 * Сервис для работы с JWT: генерация и валидация access-токенов.
 *
 * <p>Не знает про Spring Security. Только про токены.</p>
 */
@Service
public class JwtService {

    private final JwtProperties properties;
    private final SecretKey signingKey;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        // Ключ создаём один раз при старте. HS256 требует ≥256 бит (32 байта).
        this.signingKey = Keys.hmacShaKeyFor(
                properties.getSecret().getBytes(StandardCharsets.UTF_8)
        );
    }

    /**
     * Генерирует access-токен для пользователя.
     *
     * <p>В payload кладём:
     * <ul>
     *   <li>{@code sub} — UUID пользователя;</li>
     *   <li>{@code email} — email (удобно на фронте без запроса к БД);</li>
     *   <li>{@code iat} — issued at;</li>
     *   <li>{@code exp} — expiration.</li>
     * </ul>
     * </p>
     */
    public String generateAccessToken(UUID userId, String email) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(properties.getAccessTtlMinutes() * 60);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(signingKey)
                .compact();
    }

    /**
     * Проверяет токен и извлекает payload.
     *
     * <p>Возвращает {@code Optional.empty()} если токен:
     * невалидный, просроченный, с неверной подписью или повреждённый.
     * Никогда не бросает исключений наружу.</p>
     */
    public Optional<Claims> parseToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(claims);
        } catch (JwtException | IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    /**
     * Удобный шорткат: извлечь UUID пользователя из токена.
     */
    public Optional<UUID> extractUserId(String token) {
        return parseToken(token)
                .map(claims -> UUID.fromString(claims.getSubject()));
    }
}