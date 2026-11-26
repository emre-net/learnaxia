import type { DrawingCanvasData } from '../domain-types/drawing.types';
import { htmlToPlainText } from './content';

export interface ParsedNoteContent {
  plainText: string;
  rawRichText: string | null;
  isBlockNote: boolean;
  isHtml: boolean;
  drawing: DrawingCanvasData | null;
}

function extractTextFromBlockNoteArray(blocks: unknown[]): string {
  return blocks
    .map((rawBlock) => {
      if (!rawBlock || typeof rawBlock !== 'object') return '';
      const block = rawBlock as { content?: unknown };
      if (typeof block.content === 'string') return block.content;
      if (Array.isArray(block.content)) {
        return block.content
          .map((item) => {
            if (!item || typeof item !== 'object') return '';
            const span = item as { text?: unknown };
            return typeof span.text === 'string' ? span.text : '';
          })
          .join('');
      }
      return '';
    })
    .filter(Boolean)
    .join('\n');
}

/**
 * Parses a raw Note.content string stored in DB into readable text, rich source metadata, and embedded drawing.
 * Supports: BlockNote JSON array, Mobile hybrid `{ text, drawing }` JSON, raw HTML, and plain text.
 */
export function parseNoteContent(raw: string | null | undefined): ParsedNoteContent {
  if (!raw) {
    return { plainText: '', rawRichText: null, isBlockNote: false, isHtml: false, drawing: null };
  }

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return {
        plainText: extractTextFromBlockNoteArray(parsed),
        rawRichText: raw,
        isBlockNote: true,
        isHtml: false,
        drawing: null,
      };
    }

    if (parsed && typeof parsed === 'object') {
      const drawing: DrawingCanvasData | null =
        parsed.drawing && Array.isArray(parsed.drawing.paths) ? parsed.drawing : null;
      const textVal = typeof parsed.text === 'string' ? parsed.text : '';

      try {
        const nested = JSON.parse(textVal);
        if (Array.isArray(nested)) {
          return {
            plainText: extractTextFromBlockNoteArray(nested),
            rawRichText: textVal,
            isBlockNote: true,
            isHtml: false,
            drawing,
          };
        }
      } catch {
        // textVal is not serialized BlockNote JSON
      }

      const isHtml = /<[a-z][\s\S]*>/i.test(textVal);
      return {
        plainText: isHtml ? htmlToPlainText(textVal) : textVal,
        rawRichText: isHtml ? textVal : null,
        isBlockNote: false,
        isHtml,
        drawing,
      };
    }
  } catch {
    // Plain text or HTML string
  }

  const isHtml = /<[a-z][\s\S]*>/i.test(raw);
  return {
    plainText: isHtml ? htmlToPlainText(raw) : raw,
    rawRichText: isHtml ? raw : null,
    isBlockNote: false,
    isHtml,
    drawing: null,
  };
}

/**
 * Serializes note text + optional drawing safely without clobbering untouched Web BlockNote JSON.
 */
export function serializeNoteContent(params: {
  editedText: string;
  parsedOriginal?: ParsedNoteContent | null;
  textWasEdited: boolean;
  drawing: DrawingCanvasData | null;
}): string {
  const { editedText, parsedOriginal, textWasEdited, drawing } = params;
  const textPayload =
    !textWasEdited && parsedOriginal?.rawRichText ? parsedOriginal.rawRichText : editedText;

  if (drawing && Array.isArray(drawing.paths) && drawing.paths.length > 0) {
    return JSON.stringify({
      text: textPayload,
      drawing,
    });
  }

  return textPayload;
}
