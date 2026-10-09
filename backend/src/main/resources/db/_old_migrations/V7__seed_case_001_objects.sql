-- =====================================================================
-- V7: Игровые объекты для CASE-001 «Дело №001 · Город Новоморск».
--
-- Объекты внутри локаций. Привязаны к локациям по имени.
-- =====================================================================

-- Гостиная
INSERT INTO game_objects (location_id, name, description, object_type, state, sort_order)
SELECT l.id, 'Телевизор', 'Старый телевизор в углу гостиной. Экран потрескался.', 'ITEM', 'CLOSED', 1
FROM locations l WHERE l.name = 'Гостиная';

INSERT INTO game_objects (location_id, name, description, object_type, state, sort_order)
SELECT l.id, 'Диван', 'Кожаный диван, на котором часто сидел Андрей.', 'ITEM', 'CLOSED', 2
FROM locations l WHERE l.name = 'Гостиная';

INSERT INTO game_objects (location_id, name, description, object_type, state, sort_order)
SELECT l.id, 'Телефон Андрея', 'Смартфон, найденный на журнальном столике. Экран заблокирован.', 'TELEPHONE', 'LOCKED', 3
FROM locations l WHERE l.name = 'Гостиная';

-- Спальня
INSERT INTO game_objects (location_id, name, description, object_type, state, sort_order)
SELECT l.id, 'Дверь на балкон', 'Стеклянная дверь на балкон второго этажа. Приоткрыта.', 'DOOR', 'OPEN', 1
FROM locations l WHERE l.name = 'Спальня';

INSERT INTO game_objects (location_id, name, description, object_type, state, sort_order)
SELECT l.id, 'Записка на тумбочке', 'Мятая записка, оставленная кем-то из семьи.', 'DOCUMENT', 'CLOSED', 2
FROM locations l WHERE l.name = 'Спальня';

-- Кухня
INSERT INTO game_objects (location_id, name, description, object_type, state, sort_order)
SELECT l.id, 'Нож на столе', 'Кухонный нож, оставленный на разделочной доске.', 'ITEM', 'CLOSED', 1
FROM locations l WHERE l.name = 'Кухня';

INSERT INTO game_objects (location_id, name, description, object_type, state, sort_order)
SELECT l.id, 'Задняя дверь', 'Ведёт во двор. Заперта изнутри.', 'DOOR', 'LOCKED', 2
FROM locations l WHERE l.name = 'Кухня';

-- Улица Лесная
INSERT INTO game_objects (location_id, name, description, object_type, state, sort_order)
SELECT l.id, 'Дом на колёсах', 'Старый фургон, припаркованный у обочины. Принадлежит Андрею.', 'ITEM', 'CLOSED', 1
FROM locations l WHERE l.name = 'Улица Лесная';