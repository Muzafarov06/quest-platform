import { useEffect, useState, type FormEvent } from 'react';
import {
  adminGetFinalQuestion,
  adminSaveFinalQuestion,
  adminDeleteFinalQuestion,
} from '../../api/finalQuestion';
import { adminListEvidences } from '../../api/evidences';
import { Checkbox } from '../../components/ui/Checkbox';
import { Field } from '../../components/ui/Field';
import { INPUT_PAPER } from '../../components/ui/inputStyles';
import type { FinalQuestionAdmin } from '../../types/finalQuestion';
import type { Evidence } from '../../types/evidence';
import type { ApiErrorResponse } from '../../types/api';

interface Props {
  caseId: string;
}

/** Техническая заглушка — на бэке DTO требует непустые options/correctOptionId. */
const TECH_OPTION = { id: 'free-form', text: 'Свободный ответ' };
const TECH_CORRECT = 'free-form';

export function AdminFinalTab({ caseId }: Props) {
  const [existing, setExisting] = useState<FinalQuestionAdmin | null>(null);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [questionText, setQuestionText] = useState('');
  const [explanationText, setExplanationText] = useState('');
  const [revealEvidenceIds, setRevealEvidenceIds] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const reload = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [q, evs] = await Promise.all([
        adminGetFinalQuestion(caseId),
        adminListEvidences(caseId),
      ]);
      setEvidences(evs);
      if (q) {
        setExisting(q);
        setQuestionText(q.questionText);
        setExplanationText(q.explanationText ?? '');
        setRevealEvidenceIds(q.revealEvidenceIds ?? []);
      }
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setError(apiError.response?.data?.message ?? 'Не удалось загрузить финал.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const toggleEvidence = (id: string) => {
    setRevealEvidenceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaved(false);

    if (questionText.trim().length < 5) {
      setSaveError('Напишите хотя бы один вопрос');
      return;
    }

    setIsSaving(true);
    try {
      const result = await adminSaveFinalQuestion(caseId, {
        questionText: questionText.trim(),
        options: [TECH_OPTION],
        correctOptionId: TECH_CORRECT,
        explanationText: explanationText.trim() || undefined,
        revealEvidenceIds,
      });
      setExisting(result);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      setSaveError(apiError.response?.data?.message ?? 'Не удалось сохранить.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    if (!confirm('Удалить финал? Кейс нельзя будет завершить.')) return;
    try {
      await adminDeleteFinalQuestion(existing.id);
      setExisting(null);
      setQuestionText('');
      setExplanationText('');
      setRevealEvidenceIds([]);
    } catch {
      alert('Не удалось удалить');
    }
  };

  if (isLoading) {
    return (
      <div className="type text-[13px] uppercase tracking-[0.28em] text-bone-muted py-8">
        Загружаем финал…
      </div>
    );
  }
  if (error) {
    return (
      <div className="border border-blood/40 bg-blood/10 p-5 max-w-2xl">
        <div className="type text-[12px] uppercase tracking-[0.28em] text-blood mb-2">
          Ошибка
        </div>
        <div className="text-bone text-base">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="type text-[11px] uppercase tracking-[0.28em] text-bone-muted mb-1">
            Финал · свободная форма
          </div>
          <div className="font-poster text-2xl text-bone">
            {existing ? 'Настроен' : 'Не настроен'}
          </div>
        </div>
        {existing && (
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2.5 border border-blood/40 text-blood
                       type text-[11px] uppercase tracking-[0.22em]
                       hover:bg-blood/10 transition-colors cursor-pointer"
          >
            Удалить финал
          </button>
        )}
      </div>

      {!existing && (
        <div className="mb-6 px-5 py-3 border border-brass/40 bg-brass/10
                        type text-[12px] text-brass leading-relaxed">
          Без финала команда не сможет завершить расследование. Игроки
          напишут свою версию текстом, после отправки им покажется письмо-разгадка.
        </div>
      )}

      <div className="relative">
        <div className="pin" style={{ top: -8, left: 44, zIndex: 20 }} />

        <form
          onSubmit={handleSubmit}
          className="paper paper-old p-6 md:p-8 relative flex flex-col gap-6"
        >
          <div className="absolute -top-3 -right-3 rotate-[6deg] z-10">
            <span className="stamp-red text-xs">
              {existing ? 'Правка' : 'Новый'}
            </span>
          </div>

          <div className="flex items-baseline justify-between pb-3 border-b border-ink-text/20">
            <span className="type text-[11px] uppercase tracking-[0.28em] text-ink-text-soft">
              Карточка финала
            </span>
          </div>

          <Field
            label="Вопросы команде"
            hint="Один или несколько. Каждый с новой строки. Игроки ответят свободным текстом."
            required
            variant="paper"
          >
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder={
                'Кто убил и почему?\nКак вы это поняли?\nКакие улики это подтверждают?'
              }
              rows={6}
              required
              maxLength={8000}
              className={INPUT_PAPER + ' resize-none'}
            />
          </Field>

          <Field
            label="Письмо-разгадка"
            hint="Покажется команде после отправки. Что произошло на самом деле: хронология, мотив, ключевые детали."
            variant="paper"
          >
            <textarea
              value={explanationText}
              onChange={(e) => setExplanationText(e.target.value)}
              placeholder="Вторник, 12:05. В коридоре фабрики…"
              rows={20}
              maxLength={30000}
              className={INPUT_PAPER + ' resize-y'}
              style={{ fontFamily: 'var(--font-type, monospace)' }}
            />
          </Field>

          <div className="flex flex-col gap-3">
            <div className="type text-[11px] uppercase tracking-[0.24em] text-ink-text-dim">
              Улики, которые покажем после ответа · {revealEvidenceIds.length}
            </div>
            {evidences.length === 0 ? (
              <p className="type text-[12px] text-ink-text-dim italic">
                У кейса нет улик. Добавьте их на вкладке «Улики».
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto border border-ink-text/25
                              p-3 space-y-2 scroll-paper">
                {evidences.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 py-1">
                    <Checkbox
                      checked={revealEvidenceIds.includes(e.id)}
                      onChange={() => toggleEvidence(e.id)}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="flex-1 text-ink-text text-[13px] leading-snug">
                      <span className="font-medium">{e.title}</span>
                      <span className="text-ink-text-dim ml-2 text-[11px] uppercase tracking-[0.2em]">
                        {e.importance}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {saveError && (
            <div className="px-4 py-3 bg-blood/15 border-l-4 border-blood type text-[13px] text-blood">
              {saveError}
            </div>
          )}
          {saved && (
            <div className="px-4 py-3 bg-green-700/15 border-l-4 border-green-600
                            type text-[13px] text-green-700">
              ✓ Сохранено
            </div>
          )}

          <div className="flex gap-3 pt-2 flex-wrap">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blood text-paper px-6 py-3
                         type text-[13px] uppercase tracking-[0.26em]
                         hover:bg-blood-hover transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? 'Сохраняем…' : existing ? 'Сохранить' : 'Создать финал'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}