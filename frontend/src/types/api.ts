/**
 * Общий формат ошибок от backend.
 *
 * Соответствует ApiErrorResponse.java.
 * Все endpoint'ы при ошибке возвращают этот формат.
 */
export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  validationErrors?: Record<string, string>;
}