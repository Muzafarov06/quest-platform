-- =====================================================================
-- V49: правила открытия персонажа в «Вызове на допрос».
--
-- unlock_mode:
--   AUTO            — авто: если location_id задан, открывается с локацией;
--                     если нет — доступен сразу.
--   ALWAYS          — доступен с начала сессии.
--   LOCATION_OPENED — открывается вместе с локацией unlock_target_id.
--   EVIDENCE_FOUND  — открывается после находки улики unlock_target_id.
--
-- unlock_target_id — UUID локации/улики. NULL для AUTO и ALWAYS.
-- =====================================================================

ALTER TABLE characters
    ADD COLUMN unlock_mode VARCHAR(30) NOT NULL DEFAULT 'AUTO',
    ADD COLUMN unlock_target_id UUID;

ALTER TABLE characters
    ADD CONSTRAINT characters_unlock_mode_check
        CHECK (unlock_mode IN ('AUTO', 'ALWAYS', 'LOCATION_OPENED', 'EVIDENCE_FOUND'));

COMMENT ON COLUMN characters.unlock_mode IS
    'AUTO | ALWAYS | LOCATION_OPENED | EVIDENCE_FOUND';
COMMENT ON COLUMN characters.unlock_target_id IS
    'UUID локации или улики, к которой привязано открытие';