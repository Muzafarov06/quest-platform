-- =====================================================================
-- V17: Инвентарь игрока + обнаруженные улики команды.
--
-- session_discovered_evidence — что команда нашла (общий прогресс).
-- player_inventory — что у игрока «в сумке» (личное).
-- =====================================================================

CREATE TABLE session_discovered_evidence (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id        UUID         NOT NULL,
    evidence_id       UUID         NOT NULL,
    discovered_by     UUID         NOT NULL,

    discovered_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT sde_session_fk FOREIGN KEY (session_id) REFERENCES game_sessions (id) ON DELETE CASCADE,
    CONSTRAINT sde_evidence_fk FOREIGN KEY (evidence_id) REFERENCES evidences (id) ON DELETE CASCADE,
    CONSTRAINT sde_player_fk FOREIGN KEY (discovered_by) REFERENCES session_players (id) ON DELETE CASCADE,
    CONSTRAINT sde_unique UNIQUE (session_id, evidence_id)
);

CREATE INDEX idx_sde_session ON session_discovered_evidence (session_id);
CREATE INDEX idx_sde_evidence ON session_discovered_evidence (evidence_id);

COMMENT ON TABLE session_discovered_evidence IS 'Улики, найденные командой в сессии';
COMMENT ON COLUMN session_discovered_evidence.discovered_by IS 'Игрок, который нашёл первым';

-- ---------------------------------------------------------------------

CREATE TABLE player_inventory (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id        UUID         NOT NULL,
    player_id         UUID         NOT NULL,
    evidence_id       UUID         NOT NULL,

    added_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pi_session_fk FOREIGN KEY (session_id) REFERENCES game_sessions (id) ON DELETE CASCADE,
    CONSTRAINT pi_player_fk FOREIGN KEY (player_id) REFERENCES session_players (id) ON DELETE CASCADE,
    CONSTRAINT pi_evidence_fk FOREIGN KEY (evidence_id) REFERENCES evidences (id) ON DELETE CASCADE,
    CONSTRAINT pi_unique UNIQUE (session_id, player_id, evidence_id)
);

CREATE INDEX idx_pi_player ON player_inventory (player_id);
CREATE INDEX idx_pi_session ON player_inventory (session_id);

COMMENT ON TABLE player_inventory IS 'Личный инвентарь игрока: улики, которые он взял';
COMMENT ON COLUMN player_inventory.player_id IS 'Игрок, у которого улика в сумке';