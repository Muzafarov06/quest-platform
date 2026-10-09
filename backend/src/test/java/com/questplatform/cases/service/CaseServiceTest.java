package com.questplatform.cases.service;

import com.questplatform.cases.domain.CaseStatus;
import com.questplatform.cases.entity.Case;
import com.questplatform.cases.repository.CaseRepository;
import com.questplatform.common.exception.ResourceNotFoundException;
import com.questplatform.users.entity.User;
import com.questplatform.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Интеграционные тесты для {@link CaseService}.
 *
 * <p>Работают с реальной БД. {@code @Transactional} на классе — откат
 * после каждого теста.</p>
 */
@SpringBootTest
@Transactional
class CaseServiceTest {

    @Autowired
    private CaseService caseService;

    @Autowired
    private CaseRepository caseRepository;

    @Autowired
    private UserRepository userRepository;

    private UUID authorId;

    /**
     * Изолируем каждый тест от seed-данных (CASE-001 из V3).
     * @Transactional откатит это удаление в конце теста — seed вернётся.
     */
    @BeforeEach
    void setUp() {
        caseRepository.deleteAll();

        User author = new User();
        author.setEmail("author-" + UUID.randomUUID() + "@example.com");
        author.setPasswordHash("$2a$10$dummy.hash.for.test");
        author.setDisplayName("Test Author");
        author = userRepository.save(author);
        authorId = author.getId();
    }

    private Case newCase(String code, CaseStatus status) {
        Case c = new Case();
        c.setCode(code);
        c.setTitle("Test case " + code);
        c.setDescription("Description of " + code);
        c.setStatus(status);
        c.setCreatedBy(authorId);
        return c;
    }

    @Test
    @DisplayName("getPublishedCases() возвращает только PUBLISHED, игнорирует DRAFT и ARCHIVED")
    void getPublishedCases_returnsOnlyPublished() {
        caseRepository.save(newCase("CASE-A", CaseStatus.PUBLISHED));
        caseRepository.save(newCase("CASE-B", CaseStatus.PUBLISHED));
        caseRepository.save(newCase("CASE-C", CaseStatus.DRAFT));
        caseRepository.save(newCase("CASE-D", CaseStatus.ARCHIVED));

        List<Case> published = caseService.getPublishedCases();

        assertThat(published).hasSize(2);
        assertThat(published)
                .extracting(Case::getCode)
                .containsExactlyInAnyOrder("CASE-A", "CASE-B");
        assertThat(published)
                .extracting(Case::getStatus)
                .containsOnly(CaseStatus.PUBLISHED);
    }

    @Test
    @DisplayName("getById() возвращает кейс по ID")
    void getById_returnsCase() {
        Case saved = caseRepository.save(newCase("CASE-X", CaseStatus.PUBLISHED));

        Case found = caseService.getById(saved.getId());

        assertThat(found.getId()).isEqualTo(saved.getId());
        assertThat(found.getCode()).isEqualTo("CASE-X");
    }

    @Test
    @DisplayName("getById() кидает ResourceNotFoundException для несуществующего ID")
    void getById_throws_whenNotFound() {
        UUID randomId = UUID.randomUUID();

        assertThatThrownBy(() -> caseService.getById(randomId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Кейс не найден");
    }

    @Test
    @DisplayName("getByCode() возвращает кейс по коду")
    void getByCode_returnsCase() {
        caseRepository.save(newCase("CASE-Y", CaseStatus.PUBLISHED));

        Case found = caseService.getByCode("CASE-Y");

        assertThat(found.getCode()).isEqualTo("CASE-Y");
    }

    @Test
    @DisplayName("getByCode() кидает ResourceNotFoundException для несуществующего кода")
    void getByCode_throws_whenNotFound() {
        assertThatThrownBy(() -> caseService.getByCode("CASE-NOPE"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Кейс не найден");
    }
}