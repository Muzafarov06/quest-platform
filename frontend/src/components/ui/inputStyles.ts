/**
 * Общие стили полей ввода как строки классов.
 *
 * Используются там, где нужен именно <input>/<textarea>/<select>
 * с className, а не готовый компонент <Input />. Например —
 * внутри больших форм админки, где удобнее управлять значениями
 * через generic onChange.
 *
 * Все четыре варианта — просто строки Tailwind, которые
 * подставляются в className нужного элемента.
 */

/** Подчёркивание — для полей на пергаменте. */
export const INPUT_PAPER =
  'w-full bg-transparent border-b-2 border-ink-text/40 text-ink-text ' +
  'placeholder:text-ink-text-dim/70 placeholder:italic focus:outline-none ' +
  'focus:border-blood font-type text-base px-0 py-2 transition-colors';

/** Рамка — для полей на тёмных карточках/модалках. */
export const INPUT_DARK =
  'w-full bg-ink-soft border border-ink-line text-bone px-3 py-2 ' +
  'placeholder:text-bone-dim/60 focus:outline-none focus:border-blood ' +
  'font-type text-[14px] transition-colors';

/** Моноширинный тёмный — для ID, кодов, координат. */
export const INPUT_DARK_MONO = INPUT_DARK + ' font-mono text-[13px]';

/** Моноширинный светлый. */
export const INPUT_PAPER_MONO = INPUT_PAPER + ' font-mono text-[13px]';