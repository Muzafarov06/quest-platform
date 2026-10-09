/**
 * Склонение русских существительных после чисел.
 *
 * pluralRu(1,  ['игрок', 'игрока', 'игроков']) → 'игрок'
 * pluralRu(2,  ['игрок', 'игрока', 'игроков']) → 'игрока'
 * pluralRu(5,  ['игрок', 'игрока', 'игроков']) → 'игроков'
 * pluralRu(11, ['игрок', 'игрока', 'игроков']) → 'игроков'
 * pluralRu(21, ['игрок', 'игрока', 'игроков']) → 'игрок'
 * pluralRu(22, ['игрок', 'игрока', 'игроков']) → 'игрока'
 *
 * Формы: [1, 2..4, 5..20]
 */
export function pluralRu(
  n: number,
  forms: [string, string, string]
): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;

  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}

/** «игрок» / «игрока» / «игроков». */
export function playersRu(n: number): string {
  return pluralRu(n, ['игрок', 'игрока', 'игроков']);
}

/** «минута» / «минуты» / «минут». */
export function minutesRu(n: number): string {
  return pluralRu(n, ['минута', 'минуты', 'минут']);
}

/** «улика» / «улики» / «улик». */
export function evidencesRu(n: number): string {
  return pluralRu(n, ['улика', 'улики', 'улик']);
}

/** «локация» / «локации» / «локаций». */
export function locationsRu(n: number): string {
  return pluralRu(n, ['локация', 'локации', 'локаций']);
}

/** «правило» / «правила» / «правил». */
export function rulesRu(n: number): string {
  return pluralRu(n, ['правило', 'правила', 'правил']);
}

/** «переход» / «перехода» / «переходов». */
export function connectionsRu(n: number): string {
  return pluralRu(n, ['переход', 'перехода', 'переходов']);
}

/** «персонаж» / «персонажа» / «персонажей». */
export function charactersRu(n: number): string {
  return pluralRu(n, ['персонаж', 'персонажа', 'персонажей']);
}

/** «объект» / «объекта» / «объектов». */
export function objectsRu(n: number): string {
  return pluralRu(n, ['объект', 'объекта', 'объектов']);
}

/** «фигурка» / «фигурки» / «фигурок». */
export function figuresRu(n: number): string {
  return pluralRu(n, ['фигурка', 'фигурки', 'фигурок']);
}

/** «сообщение» / «сообщения» / «сообщений». */
export function messagesRu(n: number): string {
  return pluralRu(n, ['сообщение', 'сообщения', 'сообщений']);
}