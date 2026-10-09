package com.questplatform.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;

/**
 * Иерархия ролей.
 *
 * <p>ADMIN автоматически имеет все права USER. Правило читается как:</p>
 * <pre>ROLE_ADMIN > ROLE_USER</pre>
 *
 * <p>Один bean — и {@code hasRole('USER')} пропускает админа.
 * Без этого пришлось бы писать {@code hasAnyRole('USER','ADMIN')} в каждом месте.</p>
 */
@Configuration
public class RoleHierarchyConfig {

    @Bean
    public RoleHierarchy roleHierarchy() {
        return RoleHierarchyImpl.fromHierarchy("ROLE_ADMIN > ROLE_USER");
    }
}