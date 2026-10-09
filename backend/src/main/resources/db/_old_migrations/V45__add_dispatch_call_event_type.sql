-- =====================================================================
-- V45: новый тип события DISPATCH_CALL.
--
-- Используется для «звонков от диспетчера» — сообщений, которые
-- появляются у игроков в отдельной панели телефона после находки
-- улики или взаимодействия с объектом.
--
-- Семантически близко к SHOW_MESSAGE, но на фронте обрабатывается
-- иначе: не показывается модалкой, а копится в журнал звонков.
-- =====================================================================

ALTER TABLE game_events DROP CONSTRAINT IF EXISTS ge_type_check;

ALTER TABLE game_events ADD CONSTRAINT ge_type_check CHECK (event_type IN (
    'SHOW_MESSAGE',
    'REVEAL_EVIDENCE',
    'UNLOCK_OBJECT',
    'UNLOCK_LOCATION',
    'DISPATCH_CALL'
));

COMMENT ON COLUMN game_events.event_type IS
    'SHOW_MESSAGE, REVEAL_EVIDENCE, UNLOCK_OBJECT, UNLOCK_LOCATION, DISPATCH_CALL';