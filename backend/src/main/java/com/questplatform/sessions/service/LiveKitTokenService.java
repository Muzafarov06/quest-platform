package com.questplatform.sessions.service;

import com.questplatform.common.config.LiveKitProperties;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

/**
 * Генерация JWT-токена для подключения к LiveKit-комнате.
 *
 * <p>Если секрет не настроен или слишком короткий — сервис не падает,
 * а просто не выдаёт токены. Это позволяет запускать backend без
 * настроенного LiveKit (голос всё равно отключён на фронте).</p>
 */
@Service
public class LiveKitTokenService {

    private static final Logger log = LoggerFactory.getLogger(LiveKitTokenService.class);

    /** Минимальная длина секрета для HS256 — 32 байта (256 бит). */
    private static final int MIN_SECRET_BYTES = 32;

    private final LiveKitProperties props;
    private final SecretKey signingKey;

    public LiveKitTokenService(LiveKitProperties props) {
        this.props = props;

        String secret = props.getApiSecret();
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            log.warn(
                    "LiveKit API secret не настроен или короче {} байт. " +
                            "Голосовой сервис будет недоступен (это нормально, если голос отключён).",
                    MIN_SECRET_BYTES
            );
            this.signingKey = null;
        } else {
            this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
            log.info("LiveKit token service инициализирован");
        }
    }

    /**
     * @return true, если сервис настроен и может выдавать токены.
     */
    public boolean isConfigured() {
        return signingKey != null;
    }

    public String createToken(String identity, String displayName, String roomName) {
        if (signingKey == null) {
            throw new IllegalStateException(
                    "LiveKit не настроен: API secret отсутствует или короче 32 байт"
            );
        }

        Instant now = Instant.now();
        Instant exp = now.plusSeconds(props.getTokenTtlSeconds());

        Map<String, Object> video = Map.of(
                "roomJoin", true,
                "room", roomName,
                "canPublish", true,
                "canSubscribe", true
        );

        return Jwts.builder()
                .subject(identity)
                .issuer(props.getApiKey())
                .issuedAt(Date.from(now))
                .notBefore(Date.from(now))
                .expiration(Date.from(exp))
                .claim("name", displayName)
                .claim("video", video)
                .signWith(signingKey)
                .compact();
    }
}