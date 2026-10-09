-- =====================================================================
-- V48: новый тип объекта — телефон для вызова на допрос.
--
-- Используется только на сцене Штаба следственной группы. При клике
-- игроку открывается список персонажей кейса и окно допроса.
-- Обычный тип TELEPHONE остаётся для мобильников и городских телефонов.
-- =====================================================================

ALTER TABLE game_objects DROP CONSTRAINT IF EXISTS game_objects_type_check;

ALTER TABLE game_objects ADD CONSTRAINT game_objects_type_check CHECK (object_type IN (
    'TELEPHONE',
    'COMPUTER',
    'DOOR',
    'SAFE',
    'CONTAINER',
    'DOCUMENT',
    'ITEM',
    'OTHER',
    'INTERROGATION_PHONE'
));

COMMENT ON COLUMN game_objects.object_type IS
    'TELEPHONE, COMPUTER, DOOR, SAFE, CONTAINER, DOCUMENT, ITEM, OTHER, INTERROGATION_PHONE';