-- =====================================================================
-- V30: События и условия для CASE-002 «Мармелад для Беллы».
--
-- Логика: у нас 35 улик, привязанных к объектам или локациям.
-- Нужно, чтобы при клике на объект или входе в локацию сработал
-- event REVEAL_EVIDENCE и игрок получил улику в модалке.
--
-- Вместо 35 явных INSERT'ов используем PL/pgSQL-цикл: для каждого
-- объекта с уликами создаём ОДНУ condition (OBJECT_INTERACTED → object_id)
-- и N events по числу улик. То же для локаций (LOCATION_VISITED).
--
-- Это идиоматичнее и защищает от ошибок при копировании.
-- =====================================================================

DO $$
DECLARE
    rec RECORD;
    cond_id uuid;
BEGIN

    -- ============================================================
    -- БЛОК 1: объекты с уликами
    -- ============================================================
    FOR rec IN
        SELECT DISTINCT loc.case_id, obj.id AS object_id
        FROM evidences e
        JOIN locations loc ON loc.id = e.location_id
        JOIN game_objects obj ON obj.id = e.object_id
        WHERE e.object_id IS NOT NULL
          AND loc.case_id = (SELECT id FROM cases WHERE code = 'CASE-002')
    LOOP
        INSERT INTO game_conditions (case_id, condition_type, target_id)
        VALUES (rec.case_id, 'OBJECT_INTERACTED', rec.object_id)
        RETURNING id INTO cond_id;

        INSERT INTO game_events (
            case_id, condition_id, event_type, target_id, message, once, sort_order
        )
        SELECT
            rec.case_id,
            cond_id,
            'REVEAL_EVIDENCE',
            e.id,
            'Вы обнаружили улику: ' || e.title,
            true,
            e.sort_order
        FROM evidences e
        JOIN locations e_loc ON e_loc.id = e.location_id
        WHERE e.object_id = rec.object_id
          AND e_loc.case_id = rec.case_id;
    END LOOP;

    -- ============================================================
    -- БЛОК 2: локации с автоуликами (без привязки к объекту)
    -- ============================================================
    FOR rec IN
        SELECT DISTINCT loc.case_id, loc.id AS location_id
        FROM evidences e
        JOIN locations loc ON loc.id = e.location_id
        WHERE e.object_id IS NULL
          AND loc.case_id = (SELECT id FROM cases WHERE code = 'CASE-002')
    LOOP
        INSERT INTO game_conditions (case_id, condition_type, target_id)
        VALUES (rec.case_id, 'LOCATION_VISITED', rec.location_id)
        RETURNING id INTO cond_id;

        INSERT INTO game_events (
            case_id, condition_id, event_type, target_id, message, once, sort_order
        )
        SELECT
            rec.case_id,
            cond_id,
            'REVEAL_EVIDENCE',
            e.id,
            'Вы обнаружили улику: ' || e.title,
            true,
            e.sort_order
        FROM evidences e
        JOIN locations e_loc ON e_loc.id = e.location_id
        WHERE e.object_id IS NULL
          AND e_loc.id = rec.location_id
          AND e_loc.case_id = rec.case_id;
    END LOOP;

END $$;