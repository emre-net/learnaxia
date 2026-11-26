/**
 * Normalizes API error responses across mixed `{ message }` and `{ error }` payloads.
 */
export function extractApiErrorMessage(err: unknown, fallback: string): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err.trim() || fallback;

  if (typeof err === 'object') {
    const obj = err as {
      message?: unknown;
      response?: {
        data?: {
          message?: unknown;
          error?: unknown;
          details?: Array<{ message?: unknown }>;
        };
      };
    };
    const responseData = obj.response?.data;
    if (responseData && typeof responseData === 'object') {
      const candidate =
        responseData.message || responseData.error || responseData.details?.[0]?.message;
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate;
      }
    }
    if (typeof obj.message === 'string' && obj.message.trim() && !obj.message.startsWith('Request failed')) {
      return obj.message;
    }
  }
  return fallback;
}
