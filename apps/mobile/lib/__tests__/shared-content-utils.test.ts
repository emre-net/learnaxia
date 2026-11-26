import {
    parseGapSegments,
    evaluateGapAnswers,
    resolveTrueFalseAnswer,
    parseNoteContent,
    serializeNoteContent,
    formatLatexToUnicode,
    parseRichContentBlocks,
    parseInlineRuns,
} from '@learnaxia/shared';

describe('Shared Content, Notes, Study & Math Utilities', () => {
    describe('parseGapSegments & evaluateGapAnswers', () => {
        it('parses double-brace and fallback bracket gap markers', () => {
            const braces = parseGapSegments('Türkiye başkenti {{Ankara}} şehridir.');
            expect(braces.answers).toEqual(['Ankara']);
            expect(braces.segments).toEqual([
                { type: 'text', content: 'Türkiye başkenti ' },
                { type: 'gap', content: 'Ankara', gapIndex: 0 },
                { type: 'text', content: ' şehridir.' },
            ]);

            const brackets = parseGapSegments('Su formülü [H2O] şeklindedir.');
            expect(brackets.answers).toEqual(['H2O']);
            expect(brackets.segments[1]).toEqual({ type: 'gap', content: 'H2O', gapIndex: 0 });
        });

        it('returns allCorrect=false when expectedAnswers list is empty', () => {
            const res = evaluateGapAnswers([], []);
            expect(res.allCorrect).toBe(false);
            expect(res.perGap).toEqual([]);
        });

        it('evaluates Turkish locale-aware case folding (İ/i, I/ı, ö, ğ)', () => {
            const res = evaluateGapAnswers(
                ['İSTANBUL', 'ışık', 'ÖĞRETMEN'],
                ['istanbul', 'IŞIK', 'öğretmen'],
                'tr'
            );
            expect(res.allCorrect).toBe(true);
            expect(res.perGap).toEqual([true, true, true]);
        });
    });

    describe('resolveTrueFalseAnswer', () => {
        it('preserves boolean false without swallowing it via fallback candidates', () => {
            expect(resolveTrueFalseAnswer({ isTrue: false, answer: true })).toBe(false);
            expect(resolveTrueFalseAnswer({ correctAnswer: false })).toBe(false);
        });

        it('resolves Turkish and English string representations', () => {
            expect(resolveTrueFalseAnswer({ answer: 'Yanlış' })).toBe(false);
            expect(resolveTrueFalseAnswer({ answer: 'Doğru' })).toBe(true);
        });
    });

    describe('parseNoteContent & serializeNoteContent', () => {
        it('extracts plainText from Web BlockNote JSON and preserves rawRichText on drawing-only edits', () => {
            const blockNoteJson = JSON.stringify([
                { type: 'paragraph', content: [{ type: 'text', text: 'Biyoloji Özeti' }] },
                { type: 'paragraph', content: 'Hücre zarı seçici geçirgendir.' },
            ]);

            const parsed = parseNoteContent(blockNoteJson);
            expect(parsed.isBlockNote).toBe(true);
            expect(parsed.plainText).toBe('Biyoloji Özeti\nHücre zarı seçici geçirgendir.');
            expect(parsed.drawing).toBeNull();

            const serialized = serializeNoteContent({
                editedText: parsed.plainText,
                parsedOriginal: parsed,
                textWasEdited: false,
                drawing: {
                    version: 1,
                    canvasWidth: 360,
                    paths: [{ id: 'p-1', d: 'M 0 0 L 10 10', color: '#38BDF8', strokeWidth: 3, tool: 'pen' }],
                },
            });

            const reparsed = parseNoteContent(serialized);
            expect(reparsed.isBlockNote).toBe(true);
            expect(reparsed.rawRichText).toBe(blockNoteJson);
            expect(reparsed.drawing?.canvasWidth).toBe(360);
            expect(reparsed.drawing?.paths).toHaveLength(1);
        });

        it('updates text cleanly when textWasEdited is true', () => {
            const blockNoteJson = JSON.stringify([{ type: 'paragraph', content: 'Eski metin' }]);
            const parsed = parseNoteContent(blockNoteJson);

            const serialized = serializeNoteContent({
                editedText: 'Yeni mobil metin',
                parsedOriginal: parsed,
                textWasEdited: true,
                drawing: null,
            });

            expect(serialized).toBe('Yeni mobil metin');
        });
    });

    describe('formatLatexToUnicode & parseRichContentBlocks', () => {
        it('formats common LaTeX fractions, roots, Greek symbols, and scripts to Unicode', () => {
            const out = formatLatexToUnicode('$\\frac{a}{b} + \\sqrt{x^{2}} + \\alpha_{1}$');
            expect(out).toContain('(a)/(b)');
            expect(out).toContain('√(x²)');
            expect(out).toContain('α₁');

            const nested = formatLatexToUnicode('$\\sqrt{\\frac{x^{2}}{y}}$');
            expect(nested).toContain('√((x²)/(y))');
        });

        it('parses mixed HTML/Markdown into structured RichBlocks and InlineRuns', () => {
            const blocks = parseRichContentBlocks(
                '<h2>Fizik Kuralları</h2><ul><li><b>F = m × a</b> ve `v = x/t`</li></ul><blockquote>Not: Birim SI</blockquote>'
            );
            expect(blocks).toHaveLength(3);
            expect(blocks[0]).toEqual({ type: 'heading', level: 2, text: 'Fizik Kuralları' });
            expect(blocks[1].type).toBe('list-item');
            expect(blocks[2]).toEqual({ type: 'blockquote', text: 'Not: Birim SI' });

            const runs = parseInlineRuns(blocks[1].text);
            expect(runs.some((r) => r.bold && r.text === 'F = m × a')).toBe(true);
            expect(runs.some((r) => r.code && r.text === 'v = x/t')).toBe(true);
        });
    });
});
