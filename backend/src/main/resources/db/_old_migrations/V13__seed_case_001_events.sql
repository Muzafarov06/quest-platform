-- =====================================================================
-- V13: События и условия для CASE-001.
--
-- Демонстрация движка:
--   • Клик на телефон → сообщение «Экран загорается...».
--   • Первое посещение кухни → сообщение «Вы заходите на кухню...».
--   • Найдена улика «Кухонный нож» → сообщение «Это может быть орудие».
-- =====================================================================

-- 1. Клик на телефон Андрея → сообщение
INSERT INTO game_conditions (case_id, condition_type, target_id)
SELECT c.id, 'OBJECT_INTERACTED', o.id
FROM cases c
JOIN game_objects o ON o.name = 'Телефон Андрея'
WHERE c.code = 'CASE-001';

INSERT INTO game_events (case_id, condition_id, event_type, message, once, sort_order)
SELECT c.id, gc.id, 'SHOW_MESSAGE',
       'Экран телефона загорается. Похоже, есть непрочитанные сообщения.',
       true, 1
FROM cases c
JOIN game_conditions gc ON gc.case_id = c.id AND gc.condition_type = 'OBJECT_INTERACTED'
JOIN game_objects o ON o.id = gc.target_id AND o.name = 'Телефон Андрея'
WHERE c.code = 'CASE-001';

-- 2. Первое посещение кухни → сообщение
INSERT INTO game_conditions (case_id, condition_type, target_id)
SELECT c.id, 'LOCATION_VISITED', l.id
FROM cases c
JOIN locations l ON l.name = 'Кухня' AND l.case_id = c.id
WHERE c.code = 'CASE-001';

INSERT INTO game_events (case_id, condition_id, event_type, message, once, sort_order)
SELECT c.id, gc.id, 'SHOW_MESSAGE',
       'На кухне всё выглядит обычно, но что-то здесь не так. Слишком тихо.',
       true, 1
FROM cases c
JOIN game_conditions gc ON gc.case_id = c.id AND gc.condition_type = 'LOCATION_VISITED'
JOIN locations l ON l.id = gc.target_id AND l.name = 'Кухня'
WHERE c.code = 'CASE-001';

-- 3. Найдена улика «Кухонный нож» → сообщение
INSERT INTO game_conditions (case_id, condition_type, target_id)
SELECT c.id, 'EVIDENCE_DISCOVERED', e.id
FROM cases c
JOIN evidences e ON e.title = 'Кухонный нож' AND e.case_id = c.id
WHERE c.code = 'CASE-001';

INSERT INTO game_events (case_id, condition_id, event_type, message, once, sort_order)
SELECT c.id, gc.id, 'SHOW_MESSAGE',
       'Похоже, это может быть орудие преступления. Надо проверить отпечатки.',
       true, 1
FROM cases c
JOIN game_conditions gc ON gc.case_id = c.id AND gc.condition_type = 'EVIDENCE_DISCOVERED'
JOIN evidences e ON e.id = gc.target_id AND e.title = 'Кухонный нож'
WHERE c.code = 'CASE-001';