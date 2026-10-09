-- =====================================================================
-- V9: Улики для CASE-001 «Дело №001 · Город Новоморск».
--
-- Привязаны к объектам (Телефон Андрея, Записка на тумбочке) или к
-- локациям (Гостиная, Кухня). Часть — KEY (ключевые), часть — SUPPORTING.
-- =====================================================================

-- SMS от Андрея — находят, кликая на телефон
INSERT INTO evidences (case_id, object_id, title, description, content_text, evidence_type, importance, sort_order)
SELECT c.id, o.id,
       'SMS от Андрея',
       'Сообщение, найденное в телефоне Андрея.',
       '«Я сегодня зайду позже. Не жди меня к ужину. У меня есть разговор с твоими родителями.»',
       'DIGITAL', 'KEY', 1
FROM cases c
JOIN game_objects o ON o.location_id IN (SELECT id FROM locations WHERE name = 'Гостиная')
    AND o.name = 'Телефон Андрея'
WHERE c.code = 'CASE-001';

-- Записка на тумбочке — в спальне
INSERT INTO evidences (case_id, object_id, title, description, content_text, evidence_type, importance, sort_order)
SELECT c.id, o.id,
       'Записка на тумбочке',
       'Мятая записка, оставленная кем-то из семьи.',
       '«Я больше не могу это терпеть. Сегодня я ухожу. Не ищи меня.»',
       'DOCUMENT', 'KEY', 2
FROM cases c
JOIN game_objects o ON o.location_id IN (SELECT id FROM locations WHERE name = 'Спальня')
    AND o.name = 'Записка на тумбочке'
WHERE c.code = 'CASE-001';

-- Нож на кухне — привязан к локации (Кухня)
INSERT INTO evidences (case_id, location_id, title, description, content_text, evidence_type, importance, sort_order)
SELECT c.id, l.id,
       'Кухонный нож',
       'Нож, оставленный на разделочной доске. На рукоятке — следы.',
       'Отпечатки пальцев не совпадают ни с одним из членов семьи.',
       'PHYSICAL', 'KEY', 3
FROM cases c
JOIN locations l ON l.case_id = c.id AND l.name = 'Кухня'
WHERE c.code = 'CASE-001';

-- Старая фотография — привязана к локации (Гостиная)
INSERT INTO evidences (case_id, location_id, title, description, content_text, evidence_type, importance, sort_order)
SELECT c.id, l.id,
       'Старая фотография',
       'Пожелтевшая фотография на камине. Андрей с незнакомым мужчиной.',
       'На обороте надпись: «Вместе навсегда, 1998».',
       'PHOTO', 'SUPPORTING', 4
FROM cases c
JOIN locations l ON l.case_id = c.id AND l.name = 'Гостиная'
WHERE c.code = 'CASE-001';

-- Показания соседа — ложный след
INSERT INTO evidences (case_id, location_id, title, description, content_text, evidence_type, importance, sort_order)
SELECT c.id, l.id,
       'Слова соседа',
       'Сосед утверждает, что слышал крик около 22:00.',
       '«Я вышел на крыльцо — никого. Только машина уехала.»',
       'TESTIMONY', 'RED_HERRING', 5
FROM cases c
JOIN locations l ON l.case_id = c.id AND l.name = 'Улица Лесная'
WHERE c.code = 'CASE-001';