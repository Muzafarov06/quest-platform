-- =====================================================================
-- V24: Финальные вопросы кейса и ответы команд.
--
-- final_questions — по одному финальному вопросу на кейс.
--   options — JSONB-массив [{id, text}].
--   correct_option_id — id правильного варианта.
--   reveal_evidence_ids — JSONB-массив UUID улик для раскрытия.
--
-- session_final_answers — что команда ответила.
--   UNIQUE(session_id, question_id) — повторно ответить нельзя.
-- =====================================================================

CREATE TABLE final_questions (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id             UUID         NOT NULL,
    question_text       TEXT         NOT NULL,
    options             JSONB        NOT NULL DEFAULT '[]'::jsonb,
    correct_option_id   VARCHAR(100) NOT NULL,
    explanation_text    TEXT,
    reveal_evidence_ids JSONB        NOT NULL DEFAULT '[]'::jsonb,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT fq_case_fk FOREIGN KEY (case_id)
        REFERENCES cases (id) ON DELETE CASCADE,
    CONSTRAINT fq_case_unique UNIQUE (case_id)
);

COMMENT ON TABLE final_questions IS 'Финальные вопросы кейса (по одному на кейс)';
COMMENT ON COLUMN final_questions.options IS 'JSONB: [{id, text}, ...]';
COMMENT ON COLUMN final_questions.reveal_evidence_ids IS 'JSONB: список UUID улик для раскрытия';

CREATE TABLE session_final_answers (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id         UUID         NOT NULL,
    question_id        UUID         NOT NULL,
    selected_option_id VARCHAR(100) NOT NULL,
    submitted_by       UUID         NOT NULL,
    submitted_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    is_correct         BOOLEAN      NOT NULL,

    CONSTRAINT sfa_session_fk FOREIGN KEY (session_id)
        REFERENCES game_sessions (id) ON DELETE CASCADE,
    CONSTRAINT sfa_question_fk FOREIGN KEY (question_id)
        REFERENCES final_questions (id) ON DELETE RESTRICT,
    CONSTRAINT sfa_unique UNIQUE (session_id, question_id)
);

COMMENT ON TABLE session_final_answers IS 'Ответы команд на финальный вопрос';

CREATE INDEX idx_sfa_session ON session_final_answers (session_id);