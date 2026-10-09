package com.questplatform.sessions.service;

import com.questplatform.figures.repository.FigureRepository;
import com.questplatform.locations.repository.LocationRepository;
import com.questplatform.sessions.domain.SessionStatus;
import com.questplatform.sessions.dto.JoinSessionRequest;
import com.questplatform.sessions.dto.JoinSessionResponse;
import com.questplatform.sessions.dto.MoveRequest;
import com.questplatform.sessions.entity.GameSession;
import com.questplatform.sessions.entity.SessionPlayer;
import com.questplatform.sessions.mapper.SessionMapper;
import com.questplatform.sessions.realtime.SessionEventPublisher;
import com.questplatform.cases.repository.CaseRepository;
import com.questplatform.sessions.repository.GameSessionRepository;
import com.questplatform.sessions.repository.SessionPlayerRepository;
import com.questplatform.common.exception.BusinessException;
import com.questplatform.common.exception.ResourceNotFoundException;
import com.questplatform.users.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class SessionService {

    private static final String ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int ROOM_CODE_LENGTH = 6;
    private static final int MAX_ROOM_CODE_ATTEMPTS = 10;
    private static final String FALLBACK_FIGURE = "figure-001";

    private final GameSessionRepository sessionRepository;
    private final SessionPlayerRepository playerRepository;
    private final CaseRepository caseRepository;
    private final SessionMapper sessionMapper;
    private final SessionEventPublisher eventPublisher;
    private final FigureRepository figureRepository;
    private final LocationDiscoveryService locationDiscoveryService;
    private final LocationRepository locationRepository;
    private final SecureRandom random = new SecureRandom();

    public SessionService(GameSessionRepository sessionRepository,
                          SessionPlayerRepository playerRepository,
                          CaseRepository caseRepository,
                          SessionMapper sessionMapper,
                          SessionEventPublisher eventPublisher,
                          FigureRepository figureRepository,
                          LocationDiscoveryService locationDiscoveryService,
                          LocationRepository locationRepository) {
        this.sessionRepository = sessionRepository;
        this.playerRepository = playerRepository;
        this.caseRepository = caseRepository;
        this.sessionMapper = sessionMapper;
        this.eventPublisher = eventPublisher;
        this.figureRepository = figureRepository;
        this.locationDiscoveryService = locationDiscoveryService;
        this.locationRepository = locationRepository;
    }

    @Transactional
    public GameSession createSession(UUID caseId, User owner) {
        if (!caseRepository.existsById(caseId)) {
            throw new ResourceNotFoundException("Кейс не найден: " + caseId);
        }

        String roomCode = generateUniqueRoomCode();

        GameSession session = new GameSession();
        session.setCaseId(caseId);
        session.setOwnerUserId(owner.getId());
        session.setRoomCode(roomCode);
        session.setStatus(SessionStatus.LOBBY);
        session = sessionRepository.save(session);

        locationDiscoveryService.initAlwaysLocations(session.getId());

        SessionPlayer player = new SessionPlayer();
        player.setSessionId(session.getId());
        player.setUserId(owner.getId());
        player.setDisplayName(owner.getDisplayName());
        player.setAvatarKey(pickAvailableFigure(session.getId()));
        scatterStartPosition(player);
        playerRepository.save(player);

        return session;
    }

    @Transactional
    public GameSession createTestSession(UUID caseId, User owner) {
        if (!caseRepository.existsById(caseId)) {
            throw new ResourceNotFoundException("Кейс не найден: " + caseId);
        }

        String roomCode = generateUniqueRoomCode();

        GameSession session = new GameSession();
        session.setCaseId(caseId);
        session.setOwnerUserId(owner.getId());
        session.setRoomCode(roomCode);
        session.setStatus(SessionStatus.LOBBY);
        session.setTest(true);
        session = sessionRepository.save(session);

        locationDiscoveryService.initAlwaysLocations(session.getId());

        SessionPlayer player = new SessionPlayer();
        player.setSessionId(session.getId());
        player.setUserId(owner.getId());
        player.setDisplayName(owner.getDisplayName());
        player.setAvatarKey(pickAvailableFigure(session.getId()));
        scatterStartPosition(player);
        playerRepository.save(player);

        return session;
    }

    @Transactional(readOnly = true)
    public List<GameSession> getMySessions(User owner) {
        return sessionRepository.findByOwnerUserIdOrderByCreatedAtDesc(owner.getId());
    }

    @Transactional(readOnly = true)
    public GameSession getById(UUID id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Сессия не найдена: " + id));
    }

    @Transactional(readOnly = true)
    public GameSession getByRoomCode(String roomCode) {
        return sessionRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new ResourceNotFoundException("Комната не найдена: " + roomCode));
    }

    @Transactional(readOnly = true)
    public List<SessionPlayer> getPlayers(UUID sessionId) {
        if (!sessionRepository.existsById(sessionId)) {
            throw new ResourceNotFoundException("Сессия не найдена: " + sessionId);
        }
        return playerRepository.findBySessionIdOrderByJoinedAtAsc(sessionId);
    }

    @Transactional(readOnly = true)
    public List<com.questplatform.locations.entity.Location> getAvailableLocations(UUID sessionId) {
        if (!sessionRepository.existsById(sessionId)) {
            throw new ResourceNotFoundException("Сессия не найдена: " + sessionId);
        }
        var unlockedIds = locationDiscoveryService.getUnlockedLocationIds(sessionId);
        if (unlockedIds.isEmpty()) {
            return List.of();
        }
        GameSession session = getById(sessionId);

        /* На карту доступных локаций попадают только корневые.
           Под-локации игрок увидит внутри сцены родителя. */
        return locationRepository
                .findByCaseIdAndParentIdIsNullOrderBySortOrderAscNameAsc(session.getCaseId())
                .stream()
                .filter(l -> unlockedIds.contains(l.getId()))
                .toList();
    }

    /**
     * Вход в сессию.
     *
     * <p>Если игрок уже был в сессии — <strong>реактивируем</strong> его:
     * ставим {@code is_active = true} и рассылаем {@code PLAYER_JOINED}.
     * Без этого после leave/reconnect игрок остаётся {@code active=false}
     * и не появляется в списке.</p>
     */
    @Transactional
    public JoinSessionResponse joinSession(String roomCode,
                                           User user,
                                           JoinSessionRequest request,
                                           UUID existingGuestToken) {
        GameSession session = getByRoomCode(roomCode);

        if (session.getStatus() != SessionStatus.LOBBY && session.getStatus() != SessionStatus.ACTIVE) {
            throw new BusinessException("Сессия недоступна для входа", HttpStatus.CONFLICT);
        }

        if (user != null) {
            SessionPlayer existing = playerRepository
                    .findBySessionIdAndUserId(session.getId(), user.getId())
                    .orElse(null);

            if (existing != null) {
                if (!existing.isActive()) {
                    existing.setActive(true);
                    playerRepository.save(existing);
                    eventPublisher.playerJoined(session.getId(), existing.getDisplayName());
                }
                return new JoinSessionResponse(
                        sessionMapper.toResponse(session),
                        sessionMapper.toPlayerResponse(existing),
                        null
                );
            }

            SessionPlayer player = new SessionPlayer();
            player.setSessionId(session.getId());
            player.setUserId(user.getId());
            player.setDisplayName(user.getDisplayName());
            player.setAvatarKey(pickAvailableFigure(session.getId()));
            scatterStartPosition(player);
            playerRepository.save(player);

            eventPublisher.playerJoined(session.getId(), player.getDisplayName());

            return new JoinSessionResponse(
                    sessionMapper.toResponse(session),
                    sessionMapper.toPlayerResponse(player),
                    null
            );
        }

        UUID guestToken = existingGuestToken != null ? existingGuestToken : UUID.randomUUID();

        SessionPlayer existingGuest = playerRepository
                .findBySessionIdAndGuestToken(session.getId(), guestToken)
                .orElse(null);

        if (existingGuest != null) {
            if (!existingGuest.isActive()) {
                existingGuest.setActive(true);
                playerRepository.save(existingGuest);
                eventPublisher.playerJoined(session.getId(), existingGuest.getDisplayName());
            }
            return new JoinSessionResponse(
                    sessionMapper.toResponse(session),
                    sessionMapper.toPlayerResponse(existingGuest),
                    guestToken
            );
        }

        String displayName = request.displayName();
        if (displayName == null || displayName.isBlank()) {
            throw new BusinessException("Для гостя нужно указать имя", HttpStatus.BAD_REQUEST);
        }

        SessionPlayer guest = new SessionPlayer();
        guest.setSessionId(session.getId());
        guest.setGuestToken(guestToken);
        guest.setDisplayName(displayName);
        guest.setAvatarKey(pickAvailableFigure(session.getId()));
        scatterStartPosition(guest);
        playerRepository.save(guest);

        eventPublisher.playerJoined(session.getId(), guest.getDisplayName());

        return new JoinSessionResponse(
                sessionMapper.toResponse(session),
                sessionMapper.toPlayerResponse(guest),
                guestToken
        );
    }

    @Transactional
    public GameSession startSession(UUID sessionId, User owner) {
        GameSession session = getById(sessionId);

        if (!session.getOwnerUserId().equals(owner.getId())) {
            throw new BusinessException("Только владелец может запустить игру", HttpStatus.FORBIDDEN);
        }

        if (session.getStatus() != SessionStatus.LOBBY) {
            throw new BusinessException("Сессия уже запущена или завершена", HttpStatus.CONFLICT);
        }

        session.setStatus(SessionStatus.ACTIVE);
        session.setStartedAt(Instant.now());
        GameSession saved = sessionRepository.save(session);

        eventPublisher.sessionStarted(sessionId);

        return saved;
    }

    private String generateUniqueRoomCode() {
        for (int attempt = 0; attempt < MAX_ROOM_CODE_ATTEMPTS; attempt++) {
            String code = randomCode();
            if (!sessionRepository.existsByRoomCode(code)) {
                return code;
            }
        }
        throw new BusinessException("Не удалось сгенерировать уникальный код комнаты", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @Transactional
    public SessionPlayer leaveSession(UUID sessionId, User user) {
        SessionPlayer player = getPlayerForUser(sessionId, user);

        if (!player.isActive()) {
            return player;
        }

        player.setActive(false);
        SessionPlayer saved = playerRepository.save(player);

        eventPublisher.playerLeft(sessionId, player.getDisplayName());

        return saved;
    }

    @Transactional
    public GameSession closeSession(UUID sessionId, User owner) {
        GameSession session = getById(sessionId);

        if (!session.getOwnerUserId().equals(owner.getId())) {
            throw new BusinessException("Только владелец может закрыть сессию", HttpStatus.FORBIDDEN);
        }

        if (session.getStatus() == SessionStatus.FINISHED || session.getStatus() == SessionStatus.ABANDONED) {
            throw new BusinessException("Сессия уже завершена", HttpStatus.CONFLICT);
        }

        session.setStatus(SessionStatus.ABANDONED);
        session.setFinishedAt(Instant.now());

        List<SessionPlayer> players = playerRepository.findBySessionIdOrderByJoinedAtAsc(sessionId);
        for (SessionPlayer p : players) {
            if (p.isActive()) {
                p.setActive(false);
            }
        }
        playerRepository.saveAll(players);

        eventPublisher.sessionClosed(sessionId, "Владелец закрыл сессию");

        return sessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public SessionPlayer getPlayerForUser(UUID sessionId, User user) {
        if (user == null) {
            throw new BusinessException("Требуется авторизация", HttpStatus.UNAUTHORIZED);
        }
        return playerRepository.findBySessionIdAndUserId(sessionId, user.getId())
                .orElseThrow(() -> new BusinessException(
                        "Вы не участник этой сессии", HttpStatus.FORBIDDEN));
    }

    @Transactional
    public SessionPlayer changeAvatar(UUID sessionId, User user, String newAvatarKey) {
        if (!figureRepository.existsByCode(newAvatarKey)) {
            throw new BusinessException(
                    "Неизвестный код фигурки", HttpStatus.BAD_REQUEST);
        }

        SessionPlayer player = getPlayerForUser(sessionId, user);

        if (newAvatarKey.equals(player.getAvatarKey())) {
            return player;
        }

        boolean taken = playerRepository
                .findBySessionIdOrderByJoinedAtAsc(sessionId).stream()
                .filter(SessionPlayer::isActive)
                .anyMatch(p -> !p.getId().equals(player.getId())
                        && newAvatarKey.equals(p.getAvatarKey()));

        if (taken) {
            throw new BusinessException(
                    "Эта фигурка уже занята", HttpStatus.CONFLICT);
        }

        player.setAvatarKey(newAvatarKey);
        SessionPlayer saved = playerRepository.save(player);

        eventPublisher.playerUpdated(sessionId, player.getId());

        return saved;
    }

    @Transactional
    public SessionPlayer setReady(UUID sessionId, User user, boolean ready) {
        SessionPlayer player = getPlayerForUser(sessionId, user);
        if (player.isReady() == ready) {
            return player;
        }
        player.setReady(ready);
        SessionPlayer saved = playerRepository.save(player);

        eventPublisher.playerUpdated(sessionId, player.getId());

        GameSession session = getById(sessionId);
        maybeStartWhenAllReady(session);

        return saved;
    }

    @Transactional
    protected void maybeStartWhenAllReady(GameSession session) {
        if (session.getStatus() != SessionStatus.LOBBY) return;

        List<SessionPlayer> active = playerRepository
                .findBySessionIdOrderByJoinedAtAsc(session.getId())
                .stream()
                .filter(SessionPlayer::isActive)
                .toList();

        if (active.isEmpty()) return;

        boolean allReady = active.stream().allMatch(SessionPlayer::isReady);
        if (!allReady) return;

        session.setStatus(SessionStatus.ACTIVE);
        session.setStartedAt(Instant.now());
        sessionRepository.save(session);

        eventPublisher.sessionStarted(session.getId());
    }

    /**
     * Перемещение игрока — в лобби или на сцене локации.
     *
     * <p>Античит: за один запрос не больше 5% по каждой оси.</p>
     *
     * <p>{@code req.locationId()} — UUID локации, где сейчас игрок. null
     * означает «на карте дела». Сохраняем в БД и рассылаем всем, чтобы
     * клиент мог фильтровать чужих аватаров по локации.</p>
     */
    @Transactional
    public void movePlayer(UUID sessionId, User user, MoveRequest req) {
        SessionPlayer player = getPlayerForUser(sessionId, user);

        float nx = clamp(req.x());
        float ny = clamp(req.y());

        float dx = nx - player.getPosX();
        float dy = ny - player.getPosY();
        if (Math.abs(dx) > 5f) {
            nx = player.getPosX() + Math.signum(dx) * 5f;
        }
        if (Math.abs(dy) > 5f) {
            ny = player.getPosY() + Math.signum(dy) * 5f;
        }

        player.setPosX(nx);
        player.setPosY(ny);
        player.setFacing(req.facing());
        player.setCurrentLocationId(req.locationId());
        playerRepository.save(player);

        eventPublisher.playerMoved(
                sessionId,
                player.getId(),
                player.getDisplayName(),
                nx, ny, req.facing(),
                req.locationId());
    }

    private float clamp(float v) {
        if (v < 0f) return 0f;
        if (v > 100f) return 100f;
        return v;
    }

    private void scatterStartPosition(SessionPlayer player) {
        double angle = Math.random() * 2 * Math.PI;
        player.setPosX((float) (50 + Math.cos(angle) * 20));
        player.setPosY((float) (50 + Math.sin(angle) * 20));
        player.setFacing("DOWN");
    }

    private String pickAvailableFigure(UUID sessionId) {
        List<String> codes = figureRepository
                .findByActiveTrueOrderBySortOrderAscCreatedAtAsc()
                .stream()
                .map(f -> f.getCode())
                .toList();

        for (String code : codes) {
            if (!playerRepository.existsBySessionIdAndAvatarKeyAndActiveTrue(sessionId, code)) {
                return code;
            }
        }
        return codes.isEmpty() ? FALLBACK_FIGURE : codes.get(0);
    }

    private String randomCode() {
        StringBuilder sb = new StringBuilder(ROOM_CODE_LENGTH);
        for (int i = 0; i < ROOM_CODE_LENGTH; i++) {
            sb.append(ROOM_CODE_CHARS.charAt(random.nextInt(ROOM_CODE_CHARS.length())));
        }
        return sb.toString();
    }
    /**
     * Удалить сессию. Только владелец и только если сессия
     * не активна (сначала закрой её).
     */
    @Transactional
    public void deleteSession(UUID sessionId, User owner) {
        GameSession session = getById(sessionId);

        if (!session.getOwnerUserId().equals(owner.getId())) {
            throw new BusinessException(
                    "Только владелец может удалить сессию",
                    HttpStatus.FORBIDDEN);
        }

        if (session.getStatus() == SessionStatus.ACTIVE) {
            throw new BusinessException(
                    "Нельзя удалить активную сессию — сначала закрой её",
                    HttpStatus.CONFLICT);
        }

        sessionRepository.delete(session);
    }

    /**
     * Исключить игрока из сессии. Доступно только владельцу.
     * Игрок становится inactive и вылетает из списка активных.
     */
    @Transactional
    public void kickPlayer(UUID sessionId, User owner, UUID playerId) {
        GameSession session = getById(sessionId);

        if (!session.getOwnerUserId().equals(owner.getId())) {
            throw new BusinessException(
                    "Только владелец может исключать игроков",
                    HttpStatus.FORBIDDEN);
        }

        SessionPlayer target = playerRepository.findById(playerId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Игрок не найден: " + playerId));

        if (!target.getSessionId().equals(sessionId)) {
            throw new BusinessException(
                    "Игрок из другой сессии",
                    HttpStatus.BAD_REQUEST);
        }

        if (target.getUserId() != null
                && target.getUserId().equals(owner.getId())) {
            throw new BusinessException(
                    "Нельзя исключить себя",
                    HttpStatus.BAD_REQUEST);
        }

        if (!target.isActive()) {
            return;
        }

        target.setActive(false);
        playerRepository.save(target);

        eventPublisher.playerKicked(
                sessionId, target.getId(), target.getDisplayName());
    }

    /**
     * Оповестить всех, что владелец начал писать финальный ответ.
     * Проверяет, что вызывающий — владелец и сессия активна.
     */
    @Transactional(readOnly = true)
    public void notifyFinalAnswerStarted(UUID sessionId, User user) {
        GameSession session = getById(sessionId);

        if (!session.getOwnerUserId().equals(user.getId())) {
            throw new BusinessException(
                    "Только владелец может начать финал",
                    HttpStatus.FORBIDDEN);
        }

        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new BusinessException(
                    "Сессия не в статусе игры",
                    HttpStatus.CONFLICT);
        }

        eventPublisher.finalAnswerStarted(sessionId, user.getDisplayName());
    }
}