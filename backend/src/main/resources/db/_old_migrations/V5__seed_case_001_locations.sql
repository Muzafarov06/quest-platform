-- =====================================================================
-- V5: Локации для CASE-001 «Дело №001 · Город Новоморск».
--
-- Seed-миграция. Создаёт 6 локаций:
--   Дом Соколовых (корневая, HOUSE)
--     ├── Гостиная (ROOM)
--     ├── Спальня (ROOM)
--     └── Кухня (ROOM)
--   Улица Лесная (корневая, STREET)
--   Лес (корневая, FOREST)
--
-- Использует CASE-001, созданный в V3.
-- =====================================================================

-- Корневые локации
INSERT INTO locations (case_id, name, description, location_type, sort_order)
SELECT id, 'Дом Соколовых',
       'Двухэтажный частный дом на окраине Новоморска. Именно здесь произошло преступление.',
       'HOUSE', 1
FROM cases WHERE code = 'CASE-001';

INSERT INTO locations (case_id, name, description, location_type, sort_order)
SELECT id, 'Улица Лесная',
       'Тихая улица, ведущая к лесу. Соседи редко выходят из дома по ночам.',
       'STREET', 2
FROM cases WHERE code = 'CASE-001';

INSERT INTO locations (case_id, name, description, location_type, sort_order)
SELECT id, 'Лес',
       'Густой лес за домом. Через него можно добраться до реки и соседней деревни.',
       'FOREST', 3
FROM cases WHERE code = 'CASE-001';

-- Вложенные локации дома (parent_id = дом)
INSERT INTO locations (case_id, parent_id, name, description, location_type, sort_order)
SELECT c.id, h.id, 'Гостиная',
       'Просторная комната с камином. Здесь семья проводила вечера.',
       'ROOM', 1
FROM cases c
JOIN locations h ON h.case_id = c.id AND h.name = 'Дом Соколовых'
WHERE c.code = 'CASE-001';

INSERT INTO locations (case_id, parent_id, name, description, location_type, sort_order)
SELECT c.id, h.id, 'Спальня',
       'Спальня родителей на втором этаже. Окно выходит во двор.',
       'ROOM', 2
FROM cases c
JOIN locations h ON h.case_id = c.id AND h.name = 'Дом Соколовых'
WHERE c.code = 'CASE-001';

INSERT INTO locations (case_id, parent_id, name, description, location_type, sort_order)
SELECT c.id, h.id, 'Кухня',
       'Кухня на первом этаже. Здесь стоят ножи и посуда.',
       'ROOM', 3
FROM cases c
JOIN locations h ON h.case_id = c.id AND h.name = 'Дом Соколовых'
WHERE c.code = 'CASE-001';