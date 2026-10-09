-- =====================================================================
-- V11: Переходы между локациями CASE-001.
--
-- Создаём связную карту: дом ↔ улица ↔ лес.
-- Внутри дома: гостиная ↔ спальня, гостиная ↔ кухня.
-- =====================================================================

-- Улица → Дом (вход)
INSERT INTO location_connections (case_id, from_location_id, to_location_id, label, sort_order)
SELECT c.id, lf.id, lt.id, 'Войти в дом', 1
FROM cases c
JOIN locations lf ON lf.case_id = c.id AND lf.name = 'Улица Лесная'
JOIN locations lt ON lt.case_id = c.id AND lt.name = 'Дом Соколовых'
WHERE c.code = 'CASE-001';

-- Дом → Улица (выход)
INSERT INTO location_connections (case_id, from_location_id, to_location_id, label, sort_order)
SELECT c.id, lf.id, lt.id, 'Выйти на улицу', 1
FROM cases c
JOIN locations lf ON lf.case_id = c.id AND lf.name = 'Дом Соколовых'
JOIN locations lt ON lt.case_id = c.id AND lt.name = 'Улица Лесная'
WHERE c.code = 'CASE-001';

-- Дом → Гостиная
INSERT INTO location_connections (case_id, from_location_id, to_location_id, label, sort_order)
SELECT c.id, lf.id, lt.id, 'Пройти в гостиную', 1
FROM cases c
JOIN locations lf ON lf.case_id = c.id AND lf.name = 'Дом Соколовых'
JOIN locations lt ON lt.case_id = c.id AND lt.name = 'Гостиная'
WHERE c.code = 'CASE-001';

-- Гостиная → Дом
INSERT INTO location_connections (case_id, from_location_id, to_location_id, label, sort_order)
SELECT c.id, lf.id, lt.id, 'Выйти в холл', 1
FROM cases c
JOIN locations lf ON lf.case_id = c.id AND lf.name = 'Гостиная'
JOIN locations lt ON lt.case_id = c.id AND lt.name = 'Дом Соколовых'
WHERE c.code = 'CASE-001';

-- Гостиная → Спальня
INSERT INTO location_connections (case_id, from_location_id, to_location_id, label, sort_order)
SELECT c.id, lf.id, lt.id, 'Подняться в спальню', 2
FROM cases c
JOIN locations lf ON lf.case_id = c.id AND lf.name = 'Гостиная'
JOIN locations lt ON lt.case_id = c.id AND lt.name = 'Спальня'
WHERE c.code = 'CASE-001';

-- Спальня → Гостиная
INSERT INTO location_connections (case_id, from_location_id, to_location_id, label, sort_order)
SELECT c.id, lf.id, lt.id, 'Спуститься в гостиную', 1
FROM cases c
JOIN locations lf ON lf.case_id = c.id AND lf.name = 'Спальня'
JOIN locations lt ON lt.case_id = c.id AND lt.name = 'Гостиная'
WHERE c.code = 'CASE-001';

-- Гостиная → Кухня
INSERT INTO location_connections (case_id, from_location_id, to_location_id, label, sort_order)
SELECT c.id, lf.id, lt.id, 'Пройти на кухню', 3
FROM cases c
JOIN locations lf ON lf.case_id = c.id AND lf.name = 'Гостиная'
JOIN locations lt ON lt.case_id = c.id AND lt.name = 'Кухня'
WHERE c.code = 'CASE-001';

-- Кухня → Гостиная
INSERT INTO location_connections (case_id, from_location_id, to_location_id, label, sort_order)
SELECT c.id, lf.id, lt.id, 'Вернуться в гостиную', 1
FROM cases c
JOIN locations lf ON lf.case_id = c.id AND lf.name = 'Кухня'
JOIN locations lt ON lt.case_id = c.id AND lt.name = 'Гостиная'
WHERE c.code = 'CASE-001';

-- Улица → Лес
INSERT INTO location_connections (case_id, from_location_id, to_location_id, label, sort_order)
SELECT c.id, lf.id, lt.id, 'Уйти в лес', 2
FROM cases c
JOIN locations lf ON lf.case_id = c.id AND lf.name = 'Улица Лесная'
JOIN locations lt ON lt.case_id = c.id AND lt.name = 'Лес'
WHERE c.code = 'CASE-001';

-- Лес → Улица
INSERT INTO location_connections (case_id, from_location_id, to_location_id, label, sort_order)
SELECT c.id, lf.id, lt.id, 'Вернуться на улицу', 1
FROM cases c
JOIN locations lf ON lf.case_id = c.id AND lf.name = 'Лес'
JOIN locations lt ON lt.case_id = c.id AND lt.name = 'Улица Лесная'
WHERE c.code = 'CASE-001';