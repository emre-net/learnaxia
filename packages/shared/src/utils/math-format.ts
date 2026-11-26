/**
 * Zero-dependency 60fps offline-safe LaTeX, Markdown & HTML rich-text parser for LearnAxia Web & Mobile.
 */

const SUPERSCRIPTS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ',
};

const SUBSCRIPTS: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  'a': 'ₐ', 'e': 'ₑ', 'i': 'ᵢ', 'n': 'ₙ', 'x': 'ₓ',
};

const LATEX_SYMBOLS: Array<[RegExp, string]> = [
  [/\\alpha(?![a-zA-Z])/g, 'α'],
  [/\\beta(?![a-zA-Z])/g, 'β'],
  [/\\gamma(?![a-zA-Z])/g, 'γ'],
  [/\\delta(?![a-zA-Z])/g, 'δ'],
  [/\\Delta(?![a-zA-Z])/g, 'Δ'],
  [/\\epsilon(?![a-zA-Z])/g, 'ε'],
  [/\\theta(?![a-zA-Z])/g, 'θ'],
  [/\\lambda(?![a-zA-Z])/g, 'λ'],
  [/\\mu(?![a-zA-Z])/g, 'μ'],
  [/\\pi(?![a-zA-Z])/g, 'π'],
  [/\\sigma(?![a-zA-Z])/g, 'σ'],
  [/\\Sigma(?![a-zA-Z])/g, 'Σ'],
  [/\\omega(?![a-zA-Z])/g, 'ω'],
  [/\\Omega(?![a-zA-Z])/g, 'Ω'],
  [/\\phi(?![a-zA-Z])/g, 'φ'],
  [/\\infty(?![a-zA-Z])/g, '∞'],
  [/\\pm(?![a-zA-Z])/g, '±'],
  [/\\times(?![a-zA-Z])/g, '×'],
  [/\\cdot(?![a-zA-Z])/g, '·'],
  [/\\div(?![a-zA-Z])/g, '÷'],
  [/\\neq(?![a-zA-Z])/g, '≠'],
  [/\\leq(?![a-zA-Z])/g, '≤'],
  [/\\geq(?![a-zA-Z])/g, '≥'],
  [/\\approx(?![a-zA-Z])/g, '≈'],
  [/\\rightarrow(?![a-zA-Z])|\\to(?![a-zA-Z])/g, '→'],
  [/\\leftarrow(?![a-zA-Z])/g, '←'],
  [/\\Rightarrow(?![a-zA-Z])/g, '⇒'],
  [/\\Leftrightarrow(?![a-zA-Z])/g, '⇔'],
  [/\\sum(?![a-zA-Z])/g, '∑'],
  [/\\int(?![a-zA-Z])/g, '∫'],
  [/\\partial(?![a-zA-Z])/g, '∂'],
  [/\\forall(?![a-zA-Z])/g, '∀'],
  [/\\exists(?![a-zA-Z])/g, '∃'],
  [/\\in(?![a-zA-Z])/g, '∈'],
  [/\\notin(?![a-zA-Z])/g, '∉'],
  [/\\subset(?![a-zA-Z])/g, '⊂'],
  [/\\cup(?![a-zA-Z])/g, '∪'],
  [/\\cap(?![a-zA-Z])/g, '∩'],
  [/\\degree(?![a-zA-Z])/g, '°'],
];

/** Extracts a balanced `{...}` group starting at `startIndex` (pointing at `{`). */
function readBalancedBraces(src: string, startIndex: number): { content: string; endIndex: number } | null {
  if (src[startIndex] !== '{') return null;
  let depth = 0;
  for (let i = startIndex; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        return { content: src.slice(startIndex + 1, i), endIndex: i + 1 };
      }
    }
  }
  return null;
}

function replaceLatexCommand(
  input: string,
  command: string,
  argCount: 1 | 2,
  formatter: (...args: string[]) => string
): string {
  let result = '';
  let idx = 0;
  const token = `\\${command}`;

  while (idx < input.length) {
    const found = input.indexOf(token, idx);
    if (found === -1) {
      result += input.slice(idx);
      break;
    }
    const afterCmd = found + token.length;
    if (/[a-zA-Z]/.test(input[afterCmd] || '') || input[afterCmd] !== '{') {
      result += input.slice(idx, afterCmd);
      idx = afterCmd;
      continue;
    }
    const arg1 = readBalancedBraces(input, afterCmd);
    if (!arg1) {
      result += input.slice(idx, afterCmd);
      idx = afterCmd;
      continue;
    }
    if (argCount === 1) {
      result += input.slice(idx, found) + formatter(arg1.content);
      idx = arg1.endIndex;
    } else {
      const arg2 = readBalancedBraces(input, arg1.endIndex);
      if (!arg2) {
        result += input.slice(idx, afterCmd);
        idx = afterCmd;
        continue;
      }
      result += input.slice(idx, found) + formatter(arg1.content, arg2.content);
      idx = arg2.endIndex;
    }
  }

  return result;
}

function convertSuperscripts(expr: string): string {
  return expr
    .replace(/\^\{([^}]+)\}/g, (_, inner: string) =>
      inner.split('').map((ch) => SUPERSCRIPTS[ch] ?? ch).join('')
    )
    .replace(/\^([0-9a-zA-Z+-])/g, (_, ch: string) => SUPERSCRIPTS[ch] ?? `^${ch}`);
}

function convertSubscripts(expr: string): string {
  return expr
    .replace(/_\{([^}]+)\}/g, (_, inner: string) =>
      inner.split('').map((ch) => SUBSCRIPTS[ch] ?? ch).join('')
    )
    .replace(/_([0-9a-zA-Z+-])/g, (_, ch: string) => SUBSCRIPTS[ch] ?? `_${ch}`);
}

/**
 * Converts common inline/block LaTeX syntax into readable mathematical Unicode strings.
 */
export function formatLatexToUnicode(raw: string): string {
  if (!raw) return '';
  let out = raw;

  const formatInner = (tex: string): string => {
    let s = tex.trim();
    // Run commands up to 3 nesting passes (e.g., \sqrt{\frac{a}{b}}) with balanced braces
    for (let pass = 0; pass < 3; pass++) {
      const next = replaceLatexCommand(
        replaceLatexCommand(
          replaceLatexCommand(s, 'frac', 2, (num, den) => `(${num})/(${den})`),
          'sqrt',
          1,
          (inner) => `√(${inner})`
        ),
        'text',
        1,
        (inner) => inner
      );
      if (next === s) break;
      s = next;
    }
    for (const [pattern, rep] of LATEX_SYMBOLS) {
      s = s.replace(pattern, rep);
    }
    s = convertSuperscripts(s);
    s = convertSubscripts(s);
    s = s.replace(/\\([a-zA-Z]+)/g, '$1').replace(/[{}]/g, '');
    return s;
  };

  out = out.replace(/\$\$([\s\S]+?)\$\$/g, (_, inner) => `\n${formatInner(inner)}\n`);
  out = out.replace(/\\\[([\s\S]+?)\\\]/g, (_, inner) => `\n${formatInner(inner)}\n`);
  out = out.replace(/\\\(([\s\S]+?)\\\)/g, (_, inner) => formatInner(inner));
  out = out.replace(/\$([^$\n]+?)\$/g, (_, inner) => formatInner(inner));

  return out;
}

export interface RichBlock {
  type: 'heading' | 'list-item' | 'blockquote' | 'paragraph' | 'code';
  level?: 1 | 2 | 3;
  text: string;
}

export interface InlineRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

/**
 * Parses mixed HTML / Markdown / LaTeX content (AI notes, Journey slides, Solutions) into structured blocks.
 */
export function parseRichContentBlocks(raw: string): RichBlock[] {
  if (!raw) return [];

  // Normalize HTML tags into structured line markers first
  const normalized = formatLatexToUnicode(raw)
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '\n> $1\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1\n')
    .replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*')
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|ul|ol|section)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');

  const lines = normalized.split('\n');
  const blocks: RichBlock[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('### ')) {
      blocks.push({ type: 'heading', level: 3, text: line.slice(4).trim() });
    } else if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', level: 2, text: line.slice(3).trim() });
    } else if (line.startsWith('# ')) {
      blocks.push({ type: 'heading', level: 1, text: line.slice(2).trim() });
    } else if (line.startsWith('> ')) {
      blocks.push({ type: 'blockquote', text: line.slice(2).trim() });
    } else if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
      const cleaned = line.replace(/^([-*]|\d+\.)\s+/, '');
      blocks.push({ type: 'list-item', text: cleaned.trim() });
    } else {
      blocks.push({ type: 'paragraph', text: line });
    }
  }

  return blocks;
}

/**
 * Splits a line containing **bold**, *italic*, or `code` markers into renderable inline runs.
 */
export function parseInlineRuns(text: string): InlineRun[] {
  const runs: InlineRun[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ text: text.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      runs.push({ text: token.slice(2, -2), bold: true });
    } else if (token.startsWith('*') && token.endsWith('*')) {
      runs.push({ text: token.slice(1, -1), italic: true });
    } else if (token.startsWith('`') && token.endsWith('`')) {
      runs.push({ text: token.slice(1, -1), code: true });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    runs.push({ text: text.slice(lastIndex) });
  }

  return runs.length > 0 ? runs : [{ text }];
}
