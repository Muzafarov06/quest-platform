package com.questplatform.common.jwt;

import com.questplatform.users.entity.User;
import com.questplatform.users.repository.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

/**
 * Фильтр, который на каждом запросе проверяет {@code Authorization: Bearer <token>}.
 *
 * <p>Если токен валиден — ставит {@code User} в {@code SecurityContext}.
 * Дальше {@code SecurityFilterChain} решает: пропустить запрос или вернуть 401/403.</p>
 *
 * <p>Наследуемся от {@link OncePerRequestFilter} — гарантирует, что фильтр
 * выполнится ровно один раз на запрос (даже если внутри dispatch/forward).</p>
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String AUTH_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = extractToken(request).orElse(null);

        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            Optional<Claims> claimsOpt = jwtService.parseToken(token);
            if (claimsOpt.isPresent()) {
                UUID userId = UUID.fromString(claimsOpt.get().getSubject());
                // findWithRolesById, а не findById — роли нужны сразу,
                // фильтр работает вне транзакции, LAZY не подгрузится.
                userRepository.findWithRolesById(userId).ifPresent(user -> {
                    var authorities = user.getRoles().stream()
                            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getCode()))
                            .toList();

                    var authentication = new UsernamePasswordAuthenticationToken(
                            user,
                            null,
                            authorities
                    );
                    authentication.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                });
            }
        }

        filterChain.doFilter(request, response);
    }

    private Optional<String> extractToken(HttpServletRequest request) {
        String header = request.getHeader(AUTH_HEADER);
        if (header == null || !header.startsWith(BEARER_PREFIX)) {
            return Optional.empty();
        }
        return Optional.of(header.substring(BEARER_PREFIX.length()));
    }
}