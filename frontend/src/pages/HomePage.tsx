import { Link } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { useAuth } from '../auth/useAuth';

export function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="overflow-hidden">

      {/* HERO */}
      <section className="relative pt-6 md:pt-10 pb-24 md:pb-32">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,9,7,0.55) 0%, rgba(10,9,7,0.35) 45%, rgba(10,9,7,0.9) 100%)',
          }}
        />

        <Container>
          <div className="relative grid lg:grid-cols-[1fr_1.35fr] gap-10 lg:gap-16 items-center">

            {/* ЛЕВАЯ КОЛОНКА */}
            <div className="relative">
              <span className="kicker text-[10px] tracking-[0.18em] sm:text-[0.85rem] sm:tracking-[0.26em]">
                Частное детективное агентство
              </span>

              <h1 className="mt-6 text-[clamp(4.5rem,13vw,7rem)] leading-[0.82] tracking-[-0.02em] text-texture-bone lg:whitespace-nowrap">
                Улики
              </h1>
              <h1 className="text-[clamp(4.5rem,13vw,7rem)] leading-[0.82] tracking-[-0.02em] mt-1 text-texture-blood lg:whitespace-nowrap">
                не лгут.
              </h1>

              <div className="mt-5 -rotate-2">
                <span className="hand text-2xl md:text-3xl">
                  Правду расскажет только тот, кто ищет
                </span>
              </div>

              <p className="mt-8 max-w-md text-bone text-base md:text-lg leading-relaxed">
                Интерактивная платформа для детективных квестов.{' '}
                <span className="text-bone font-semibold">
                  Настоящее следствие, живые подозреваемые, десятки улик
                </span>{' '}
                — в одной общей комнате для всей команды.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
                <Link
                  to={isAuthenticated ? '/cases' : '/register'}
                  className="w-full sm:w-auto"
                >
                  <Button
                    variant="primary"
                    size="lg"
                    withArrow
                    className="w-full sm:w-auto"
                  >
                    Открыть дело
                  </Button>
                </Link>
                <a href="#brief" className="w-full sm:w-auto">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    Что внутри
                  </Button>
                </a>
              </div>
            </div>

            {/* ПРАВАЯ КОЛОНКА — папка */}
            <div className="relative">
              <div
                className="relative
                          -mx-6 sm:-mx-4 md:mx-0
                          lg:-mr-8 xl:-mr-16
                          lg:scale-110 xl:scale-125
                          origin-center"
              >
                <img
                  src="/images/case-folder.png"
                  alt="Материалы дела № 0237"
                  className="w-full h-auto select-none pointer-events-none"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </Container>

        <div className="absolute bottom-0 left-0 right-0">
          <div className="thread" />
        </div>
      </section>

      {/* BRIEF */}
      <section id="brief" className="section-cream py-20 md:py-28">
        <Container>
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-12 lg:gap-16 items-start">

            <div>
              <span className="kicker">Оперативная сводка</span>

              <h2 className="mt-6 text-[clamp(2rem,3.6vw,3.75rem)] leading-[0.9]">
                <span className="block text-texture-ink">Что такое</span>
                <span className="block text-texture-blood-deep">онлайн-расследование</span>
              </h2>

              <div className="mt-6 hand text-2xl md:text-3xl rotate-[-1deg]">
                ← держите всю команду в деле
              </div>
            </div>

            <div>
              <p className="text-base md:text-lg text-ink-text leading-relaxed max-w-2xl">
                Это не настолка в коробке. Это{' '}
                <span className="hand text-2xl">живой детективный движок</span>{' '}
                в браузере — со своей картой, досье, подозреваемыми и общей доской расследования.
              </p>

              <div className="grid md:grid-cols-2 gap-5 mt-10">
                {[
                  { n: '01', t: 'Общее досье', d: 'Все улики, документы и связи — на одной доске. Ничего не теряется.' },
                  { n: '02', t: 'Живые подозреваемые', d: 'Фигурантов отыгрывает ИИ. Допрос — свободным текстом, как в жизни.' },
                  { n: '03', t: 'Красные нити', d: 'Соединяйте факты, стройте хронологию, проверяйте версии.' },
                  { n: '04', t: 'Свобода действий', d: 'Никакого «по рельсам». Куда пойти и что спросить — решает команда.' },
                ].map((item) => (
                  <div
                    key={item.n}
                    className="paper paper-fresh p-6 relative lift"
                  >
                    <div className="pin brass" style={{ top: -6, left: 20 }} />

                    <div className="font-poster text-3xl md:text-4xl text-blood leading-none mb-3">
                      {item.n}
                    </div>

                    <div className="type text-[13px] uppercase tracking-[0.15em] text-ink-text mb-2">
                      {item.t}
                    </div>

                    <div className="text-[15px] text-ink-text-soft leading-relaxed">
                      {item.d}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* КАК ВЕДЁТСЯ СЛЕДСТВИЕ */}
      <section className="section-kraft py-20 md:py-28">
        <Container>
          <div className="max-w-3xl mb-12">
            <span className="kicker">Порядок действий</span>

            <h2 className="mt-6 text-[clamp(2rem,3.6vw,3.75rem)] leading-[0.9]">
              <span className="block text-texture-ink">Как ведётся</span>
              <span className="block text-texture-blood-deep">следствие</span>
            </h2>

            <p className="mt-6 text-ink-text-soft text-base md:text-lg leading-relaxed">
              Четыре шага от <span className="hand text-2xl">«собрались»</span>{' '}
              до <span className="hand text-2xl">«преступник найден»</span>.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { n: '01', t: 'Дело',     d: 'Открываете дело и собираете команду — до 6 человек в одной комнате.' },
              { n: '02', t: 'Досье',    d: 'Получаете материалы: карту, фигурантов, первые улики и показания.' },
              { n: '03', t: 'Следствие',d: 'Исследуете локации, допрашиваете, сопоставляете, ведёте доску.' },
              { n: '04', t: 'Вердикт',  d: 'Отправляете финальную версию и смотрите, попали ли в цель.' },
            ].map((step, i) => (
              <div key={step.n} className="relative">
                <div className="paper paper-fresh p-6 relative h-full lift">
                  <div className="pin" style={{ top: -6, left: '50%', marginLeft: -7 }} />

                  <div className="type text-[12px] uppercase tracking-[0.28em] text-blood mb-3">
                    Шаг {step.n}
                  </div>

                  <div className="font-poster text-2xl md:text-3xl text-ink-text leading-none mb-3">
                    {step.t}
                  </div>

                  <div className="text-[15px] text-ink-text-soft leading-relaxed">
                    {step.d}
                  </div>

                  {i < 3 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-blood" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* КАТАЛОГ */}
      <section className="section-cream py-20 md:py-28">
        <Container>
          <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
            <div>
              <span className="kicker">Картотека</span>

              <h2 className="mt-6 text-[clamp(2rem,3.6vw,3.75rem)] leading-[0.9]">
                <span className="block text-texture-ink">Открытые</span>
                <span className="block text-texture-blood-deep">дела</span>
              </h2>
            </div>

            <Link
              to="/cases"
              className="type text-sm uppercase tracking-[0.24em] text-blood hover:text-blood-hover transition-colors"
            >
              Все дела →
            </Link>
          </div>

          <Link to="/cases" className="block group">
            <div className="grid lg:grid-cols-[1fr_1.3fr] gap-10 items-center">

              <div className="relative w-full">
                <div className="pin" style={{ top: 12, left: '50%', marginLeft: -7, zIndex: 20 }} />

                <div className="paper paper-old p-3 transition-transform duration-300 shadow-paper-lift">
                  <div className="relative aspect-[4/5] bg-ink-card overflow-hidden">
                    <div className="photo-corner tl" />
                    <div className="photo-corner tr" />
                    <div className="photo-corner br" />
                    <div className="photo-corner bl" />

                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'radial-gradient(circle at 30% 25%, rgba(156,28,28,0.45), transparent 55%), ' +
                          'radial-gradient(circle at 75% 80%, rgba(201,162,74,0.2), transparent 60%), ' +
                          'linear-gradient(135deg, #1a1712 0%, #0b0a08 100%)',
                      }}
                    />

                    <div className="absolute top-4 left-4">
                      <span className="stamp-red text-xs">Дело № 001</span>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col items-center gap-1">
                      <div className="type text-[11px] uppercase tracking-[0.32em] text-bone-muted">
                        первое дело платформы
                      </div>
                      <div className="font-poster text-3xl text-bone">
                        Новоморск
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="hand text-2xl md:text-3xl text-blood rotate-[-2deg] mb-3">
                  дело № 001
                </div>

                <h3 className="text-4xl md:text-5xl text-ink-text leading-[0.9] transition-colors group-hover:text-blood">
                  Первое
                  <br />
                  расследование
                </h3>

                <p className="mt-6 text-ink-text-soft text-base md:text-lg leading-relaxed max-w-xl">
                  Курортный город, найденный мёртвым человек, недоверчивые свидетели
                  и много противоречий. Следствие на месте не знает ни имён,
                  ни версий, <span className="hand text-2xl">ни кто врёт</span>.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Tag>Детектив</Tag>
                  <Tag>1–6 игроков</Tag>
                  <Tag>~90 минут</Tag>
                  <Tag>16+</Tag>
                </div>

                <div className="mt-10 flex items-center gap-3 text-blood">
                  <span className="type text-[13px] uppercase tracking-[0.32em]">
                    Открыть дело
                  </span>
                  <span>→</span>
                </div>
              </div>
            </div>
          </Link>
        </Container>
      </section>

      {/* CTA */}
      <section className="section-dark py-20 md:py-28">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <span className="kicker justify-center inline-flex">Приступайте</span>

            <h2 className="mt-8 text-[clamp(2.5rem,5.5vw,5.5rem)] leading-[0.88]">
              <span className="block text-texture-bone">Собирайте команду.</span>
              <span className="block text-texture-blood">Беритесь за дело.</span>
            </h2>

            <div className="mt-6 hand text-3xl md:text-4xl rotate-[-1deg]">
              Улики не будут ждать
            </div>

            <div className="mt-10 flex justify-center gap-4 flex-wrap">
              <Link to={isAuthenticated ? '/cases' : '/register'}>
                <Button variant="primary" size="lg" withArrow>
                  {isAuthenticated ? 'Выбрать дело' : 'Начать'}
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="tag">{children}</span>;
}