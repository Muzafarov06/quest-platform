/**
 * Типы финального вопроса. Соответствуют backend DTO.
 */

export interface FinalQuestionOption {
  id: string;
  text: string;
}

/** Для игроков — без правильного ответа. */
export interface FinalQuestion {
  id: string;
  questionText: string;
  options: FinalQuestionOption[];
}

/** Для админа — со всеми полями. */
export interface FinalQuestionAdmin {
  id: string;
  caseId: string;
  questionText: string;
  options: FinalQuestionOption[];
  correctOptionId: string;
  explanationText: string | null;
  revealEvidenceIds: string[];
}

export interface CreateFinalQuestionRequest {
  questionText: string;
  options: FinalQuestionOption[];
  correctOptionId: string;
  explanationText?: string;
  revealEvidenceIds?: string[];
}

export interface EvidenceBrief {
  id: string;
  title: string;
  contentText: string | null;
}

export interface FinalAnswerResult {
  questionId: string;
  questionText: string;
  correctOptionId: string;
  correctOptionText: string;
  selectedOptionId: string;
  selectedOptionText: string;
  isCorrect: boolean;
  explanationText: string | null;
  revealedEvidences: EvidenceBrief[];
}