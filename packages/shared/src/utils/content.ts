export interface GapSegment {
  type: 'text' | 'gap';
  content: string;
  gapIndex?: number;
}

/**
 * Normalizes a text answer using locale-aware case folding (handles Turkish İ/i and I/ı).
 */
export function normalizeAnswerText(value: string, locale: string = 'tr'): string {
  return (value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase(locale);
}

/**
 * Parses `{{answer}}` (and fallback `[answer]` if `{{}}` is absent) into renderable segments and expected answers.
 */
export function parseGapSegments(
  rawText: string,
  explicitAnswers?: string[]
): { segments: GapSegment[]; answers: string[] } {
  const text = rawText || '';
  const hasDoubleBraces = /\{\{([^}]+)\}\}/.test(text);
  const regex = hasDoubleBraces ? /\{\{([^}]+)\}\}/g : /\[([^\]\n]{1,80})\]/g;

  const segments: GapSegment[] = [];
  const extracted: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let gapCounter = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    const token = match[1].trim();
    const expected = explicitAnswers?.[gapCounter]?.trim() || token;
    segments.push({ type: 'gap', content: expected, gapIndex: gapCounter });
    extracted.push(expected);
    gapCounter++;
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  if (segments.length === 0 && text.length > 0) {
    segments.push({ type: 'text', content: text });
  }

  const finalAnswers =
    extracted.length > 0
      ? extracted
      : (explicitAnswers || []).map((a) => a.trim()).filter(Boolean);

  return { segments, answers: finalAnswers };
}

/**
 * Evaluates all user gap answers against expected targets.
 * Returns `allCorrect: false` when expected answers list is empty (never vacuous true).
 */
export function evaluateGapAnswers(
  userInputs: string[],
  expectedAnswers: string[],
  locale: string = 'tr'
): { allCorrect: boolean; perGap: boolean[] } {
  if (!expectedAnswers || expectedAnswers.length === 0) {
    return { allCorrect: false, perGap: [] };
  }
  const perGap = expectedAnswers.map((expected, index) => {
    const userVal = normalizeAnswerText(userInputs[index] || '', locale);
    const targetVal = normalizeAnswerText(expected, locale);
    return targetVal.length > 0 && userVal === targetVal;
  });
  return {
    allCorrect: perGap.every(Boolean),
    perGap,
  };
}

/**
 * Resolves a True/False card's boolean ground truth without swallowing `false` via `||`.
 */
export function resolveTrueFalseAnswer(content: Record<string, unknown>): boolean {
  const candidates = [content.isTrue, content.correctAnswer, content.answer, content.back];
  for (const val of candidates) {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      const normalized = val.trim().toLocaleLowerCase('tr');
      if (normalized === 'true' || normalized === 'doğru' || normalized === '1') return true;
      if (normalized === 'false' || normalized === 'yanlış' || normalized === '0') return false;
    }
  }
  return true;
}

/**
 * Safely strips structural HTML (e.g. AI generated slides/notes) to clean multi-line readable text.
 */
export function htmlToPlainText(input: string): string {
  if (!input) return '';
  return input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|blockquote)>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
