package com.questplatform.sessions.event;

import com.questplatform.engine.domain.ConditionType;
import com.questplatform.engine.dto.ActionRequest;
import com.questplatform.engine.service.EngineService;
import com.questplatform.locations.domain.DiscoveryMode;
import com.questplatform.sessions.service.LocationDiscoveryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Слушатель {@link EngineActionEvent}.
 *
 * <p>Срабатывает ПОСЛЕ коммита транзакции, в которой был осмотр объекта
 * или найдена улика. Внутри — вызов движка и открытие локаций в
 * отдельной транзакции. Ошибка движка не откатывает основной факт.</p>
 */
@Component
public class EngineActionListener {

    private static final Logger log = LoggerFactory.getLogger(EngineActionListener.class);

    private final EngineService engineService;
    private final LocationDiscoveryService locationDiscoveryService;

    public EngineActionListener(EngineService engineService,
                                LocationDiscoveryService locationDiscoveryService) {
        this.engineService = engineService;
        this.locationDiscoveryService = locationDiscoveryService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onEngineAction(EngineActionEvent event) {
        /* Находка улики может открыть локации с discoveryMode=ON_EVIDENCE. */
        if (event.conditionType() == ConditionType.EVIDENCE_DISCOVERED) {
            try {
                locationDiscoveryService.onTrigger(
                        event.sessionId(),
                        DiscoveryMode.ON_EVIDENCE,
                        event.targetId(),
                        event.playerId());
            } catch (Exception ex) {
                log.warn("LocationDiscoveryService.onTrigger failed for evidence {}: {}",
                        event.targetId(), ex.getMessage());
            }
        }

        /* Событие движка. */
        try {
            engineService.handleAction(
                    event.sessionId(),
                    event.playerId(),
                    new ActionRequest(event.conditionType(), event.targetId()));
        } catch (Exception ex) {
            log.warn("EngineService.handleAction failed for {} target {}: {}",
                    event.conditionType(), event.targetId(), ex.getMessage());
        }
    }
}