import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { register } from '../api/auth';
import { Container } from '../components/layout/Container';
import { Input } from '../components/ui/Input';
import { Field } from '../components/ui/Field';
import type { ApiErrorResponse } from '../types/api';

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  // Клик мимо карточки — на главную
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        navigate('/');
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [navigate]);

  // Escape — тоже на главную
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate('/');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});
    setIsSubmitting(true);

    try {
      await register({ email, password, displayName });
      await login(email, password);
      navigate('/profile', { replace: true });
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: ApiErrorResponse } };
      const data = apiError.response?.data;

      if (data?.validationErrors) {
        setValidationErrors(data.validationErrors);
      } else if (data?.message) {
        setError(data.message);
      } else {
        setError('Не удалось зарегистрироваться. Попробуйте ещё раз.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <div className="max-w-lg mx-auto py-10 md:py-20 relative">

        {/* Рукописная пометка сверху */}
        <div className="absolute top-2 right-0 rotate-[-4deg] z-10 hidden md:block">
          <span className="hand text-2xl md:text-3xl drop-shadow-strong">
            новое дело — новое имя
          </span>
        </div>

        <div className="relative" ref={cardRef}>
          <div className="pin" style={{ top: -8, left: '50%', marginLeft: -7, zIndex: 20 }} />

          <div className="paper paper-old p-7 md:p-10 relative">
            {/* Крестик */}
            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label="Вернуться на главную"
              className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center
                         text-ink-text-dim hover:text-blood
                         transition-colors cursor-pointer text-xl leading-none
                         hover:bg-black/[0.05] rounded-none z-20"
            >
              ✕
            </button>


            <div className="flex items-baseline justify-between mb-6 pb-3 border-b border-ink-text/20">
              <span className="type text-[11px] uppercase tracking-[0.28em] text-ink-text-soft">
                Заведение дела
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl text-ink-text leading-none mb-3">
              Регистрация
            </h1>
            <div className="hand text-xl md:text-2xl text-blood rotate-[-1deg] mb-8">
              заведём на вас папку
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <Field label="Email" required variant="paper" error={validationErrors.email}>
                <Input
                  type="email"
                  variant="paper"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="detective@example.com"
                />
              </Field>

              <Field
                label="Пароль"
                required
                variant="paper"
                error={validationErrors.password}
                hint="минимум 8 символов"
              >
                <Input
                  type="password"
                  variant="paper"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </Field>

              <Field
                label="Имя"
                required
                variant="paper"
                error={validationErrors.displayName}
                hint="под этим именем вас увидят напарники"
              >
                <Input
                  type="text"
                  variant="paper"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={50}
                  autoComplete="nickname"
                  placeholder="Как вас звать?"
                />
              </Field>

              {error && (
                <div className="px-3 py-2 bg-blood/10 border-l-4 border-blood
                                type text-sm text-blood">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 bg-blood text-paper px-6 py-3
                           type text-sm uppercase tracking-[0.24em]
                           hover:bg-blood-hover transition-colors
                           disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? 'Оформление...' : 'Завести дело'}
              </button>
            </form>

            <div className="mt-8 pt-5 border-t border-ink-text/20 flex items-center
                            justify-between flex-wrap gap-2">
              <span className="type text-[11px] uppercase tracking-[0.24em] text-ink-text-dim">
                Уже в деле?
              </span>
              <Link
                to="/login"
                className="type text-sm text-blood hover:text-blood-hover transition-colors
                           underline underline-offset-4 decoration-dotted"
              >
                Войти →
              </Link>
            </div>
          </div>
        </div>

        {/* Записка снизу-справа */}
        <div className="absolute -bottom-4 -right-4 rotate-[3deg] z-10 hidden md:block max-w-[210px]">
          <div className="paper paper-fresh p-3 relative shadow-paper-lift">
            <div className="pin brass" style={{ top: -7, left: 22 }} />
            <div className="font-hand text-lg text-ink-text leading-tight">
              Никто не узнает, кроме напарников.
            </div>
          </div>
        </div>

      </div>
    </Container>
  );
}