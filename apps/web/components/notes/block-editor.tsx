"use client";

import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef, useCallback } from "react";
import type { PartialBlock } from "@blocknote/core";
import { DrawingCanvasData, DrawingPath } from "@learnaxia/shared";
import { PenTool, Eraser, Highlighter, Undo2, Trash2, Plus } from "lucide-react";

interface BlockEditorProps {
    initialContent?: string;
    onChange: (content: string) => void;
    readOnly?: boolean;
}

const PEN_COLORS = ["#38BDF8", "#F4F4F5", "#10B981", "#F59E0B", "#FB7185"];

export function BlockEditor({ initialContent, onChange, readOnly = false }: BlockEditorProps) {
    const { theme } = useTheme();
    const [initialBlocks, setInitialBlocks] = useState<PartialBlock[] | undefined | "loading">("loading");
    const [plainTextFallback, setPlainTextFallback] = useState<string>("");
    const [embeddedDrawing, setEmbeddedDrawing] = useState<DrawingCanvasData | null>(null);
    const [showDrawingPad, setShowDrawingPad] = useState(false);

    // Interactive SVG Drawing state
    const [tool, setTool] = useState<"pen" | "highlighter" | "eraser">("pen");
    const [color, setColor] = useState<string>("#38BDF8");
    const [strokeWidth, setStrokeWidth] = useState<number>(3);
    const [activePath, setActivePath] = useState<DrawingPath | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (!initialContent) {
            setInitialBlocks(undefined);
            return;
        }

        try {
            const parsed = JSON.parse(initialContent);

            if (Array.isArray(parsed) && parsed.length > 0) {
                setInitialBlocks(parsed as PartialBlock[]);
                return;
            }

            if (parsed && typeof parsed === "object") {
                if (parsed.drawing && Array.isArray(parsed.drawing.paths)) {
                    setEmbeddedDrawing(parsed.drawing);
                    if (parsed.drawing.paths.length > 0) {
                        setShowDrawingPad(true);
                    }
                }
                const textStr = typeof parsed.text === "string" ? parsed.text : "";

                try {
                    const nested = JSON.parse(textStr);
                    if (Array.isArray(nested) && nested.length > 0) {
                        setInitialBlocks(nested as PartialBlock[]);
                        return;
                    }
                } catch { }

                setPlainTextFallback(textStr);
                setInitialBlocks(undefined);
                return;
            }
        } catch {
            // Plain text or HTML
        }

        setPlainTextFallback(initialContent);
        setInitialBlocks(undefined);
    }, [initialContent]);

    const editor = useCreateBlockNote();

    useEffect(() => {
        if (editor && initialBlocks === undefined) {
            const textToInsert = plainTextFallback || "";
            if (textToInsert.trim().startsWith("<")) {
                editor.tryParseHTMLToBlocks(textToInsert).then((blocks) => {
                    if (blocks && blocks.length > 0) {
                        editor.replaceBlocks(editor.document, blocks);
                    }
                }).catch(console.error);
            } else if (textToInsert.length > 0) {
                const lines = textToInsert.split("\n\n").filter(Boolean);
                const blocks = lines.map(line => ({
                    type: "paragraph" as const,
                    content: line,
                }));
                editor.replaceBlocks(editor.document, blocks.length > 0 ? blocks : [
                    { type: "paragraph", content: textToInsert }
                ]);
            }
        } else if (editor && Array.isArray(initialBlocks)) {
            editor.replaceBlocks(editor.document, initialBlocks);
        }
    }, [editor, plainTextFallback, initialBlocks]);

    const emitCombinedChange = useCallback(
        (nextDrawing: DrawingCanvasData | null) => {
            const documentJson = JSON.stringify(editor.document);
            if (nextDrawing && nextDrawing.paths.length > 0) {
                onChange(JSON.stringify({ text: documentJson, drawing: nextDrawing }));
            } else {
                onChange(documentJson);
            }
        },
        [editor, onChange]
    );

    const viewBoxWidth = embeddedDrawing?.canvasWidth || 640;
    const viewBoxHeight = embeddedDrawing?.canvasHeight || 320;

    const getSvgPoint = (e: React.PointerEvent<SVGSVGElement>) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
        const x = ((e.clientX - rect.left) / rect.width) * viewBoxWidth;
        const y = ((e.clientY - rect.top) / rect.height) * viewBoxHeight;
        return { x, y };
    };

    const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
        if (readOnly) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        const pt = getSvgPoint(e);
        lastPointRef.current = pt;

        if (tool === "eraser") {
            const existing = embeddedDrawing?.paths || [];
            if (existing.length > 0) {
                const updated: DrawingCanvasData = {
                    version: 1,
                    paths: existing.slice(0, -1),
                    canvasWidth: viewBoxWidth,
                    canvasHeight: viewBoxHeight,
                    updatedAt: Date.now(),
                };
                setEmbeddedDrawing(updated);
                emitCombinedChange(updated);
            }
            return;
        }

        setActivePath({
            id: `web_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            d: `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
            color,
            strokeWidth: tool === "highlighter" ? strokeWidth * 3 : strokeWidth,
            tool,
            opacity: tool === "highlighter" ? 0.35 : 1,
        });
    };

    const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
        if (readOnly || !activePath || tool === "eraser") return;
        const pt = getSvgPoint(e);
        const prev = lastPointRef.current;
        if (!prev) {
            lastPointRef.current = pt;
            return;
        }
        const midX = ((prev.x + pt.x) / 2).toFixed(1);
        const midY = ((prev.y + pt.y) / 2).toFixed(1);
        setActivePath(p => (p ? { ...p, d: `${p.d} Q ${prev.x.toFixed(1)} ${prev.y.toFixed(1)}, ${midX} ${midY}` } : null));
        lastPointRef.current = pt;
    };

    const handlePointerUp = () => {
        if (readOnly || !activePath) {
            lastPointRef.current = null;
            return;
        }
        const updatedPaths = [...(embeddedDrawing?.paths || []), activePath];
        const nextDrawing: DrawingCanvasData = {
            version: 1,
            paths: updatedPaths,
            canvasWidth: viewBoxWidth,
            canvasHeight: viewBoxHeight,
            updatedAt: Date.now(),
        };
        setEmbeddedDrawing(nextDrawing);
        setActivePath(null);
        lastPointRef.current = null;
        emitCombinedChange(nextDrawing);
    };

    const handleUndo = () => {
        if (!embeddedDrawing?.paths.length) return;
        const nextDrawing: DrawingCanvasData = {
            ...embeddedDrawing,
            paths: embeddedDrawing.paths.slice(0, -1),
            updatedAt: Date.now(),
        };
        setEmbeddedDrawing(nextDrawing);
        emitCombinedChange(nextDrawing);
    };

    const handleClear = () => {
        const nextDrawing: DrawingCanvasData = {
            version: 1,
            paths: [],
            canvasWidth: viewBoxWidth,
            canvasHeight: viewBoxHeight,
            updatedAt: Date.now(),
        };
        setEmbeddedDrawing(nextDrawing);
        emitCombinedChange(null);
    };

    if (initialBlocks === "loading") {
        return <div className="animate-pulse h-40 bg-zinc-900/50 rounded-lg w-full"></div>;
    }

    const pathsToRender = embeddedDrawing?.paths || [];

    return (
        <div className="w-full relative mx-0 sm:-mx-[54px] space-y-6">
            <BlockNoteView
                editor={editor}
                theme={theme === "dark" || theme === "system" ? "dark" : "light"}
                editable={!readOnly}
                onChange={() => emitCombinedChange(embeddedDrawing)}
            />

            {!readOnly && !showDrawingPad && (
                <div className="mx-4 sm:mx-14">
                    <button
                        type="button"
                        onClick={() => setShowDrawingPad(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-zinc-700 hover:border-sky-500/50 bg-[#121215] text-xs font-medium text-sky-400 transition-colors"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        El Yazısı / Çizim Alanı Ekle
                    </button>
                </div>
            )}

            {showDrawingPad && (pathsToRender.length > 0 || !readOnly) && (
                <div className="mx-4 sm:mx-14 p-4 sm:p-5 rounded-2xl border border-white/[0.08] bg-[#121215]">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
                            <PenTool className="h-3.5 w-3.5" />
                            <span>El Yazısı &amp; Çizim Tuvali</span>
                        </div>

                        {!readOnly && (
                            <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setTool("pen")}
                                    className={`p-1.5 rounded-lg border text-xs ${tool === "pen" ? "border-sky-400 bg-sky-500/15 text-sky-400" : "border-zinc-800 bg-[#18181b] text-zinc-400"}`}
                                    title="Kalem"
                                >
                                    <PenTool className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTool("highlighter")}
                                    className={`p-1.5 rounded-lg border text-xs ${tool === "highlighter" ? "border-amber-400 bg-amber-500/15 text-amber-400" : "border-zinc-800 bg-[#18181b] text-zinc-400"}`}
                                    title="Fosforlu Kalem"
                                >
                                    <Highlighter className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTool("eraser")}
                                    className={`p-1.5 rounded-lg border text-xs ${tool === "eraser" ? "border-rose-400 bg-rose-500/15 text-rose-400" : "border-zinc-800 bg-[#18181b] text-zinc-400"}`}
                                    title="Son Çizgiyi Sil"
                                >
                                    <Eraser className="h-3.5 w-3.5" />
                                </button>

                                <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

                                {PEN_COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => { setColor(c); if (tool === "eraser") setTool("pen"); }}
                                        className={`w-4 h-4 rounded-full transition-transform ${color === c && tool !== "eraser" ? "ring-2 ring-zinc-200 scale-110" : "opacity-80"}`}
                                        style={{ backgroundColor: c }}
                                        aria-label={`Renk ${c}`}
                                    />
                                ))}

                                <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

                                <button
                                    type="button"
                                    onClick={() => setStrokeWidth(w => (w === 3 ? 6 : 3))}
                                    className="px-2 py-1 rounded-lg border border-zinc-800 bg-[#18181b] text-[11px] text-zinc-300"
                                >
                                    {strokeWidth}px
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUndo}
                                    disabled={pathsToRender.length === 0}
                                    className="p-1.5 rounded-lg border border-zinc-800 bg-[#18181b] text-zinc-400 hover:text-zinc-100 disabled:opacity-40"
                                    title="Geri Al"
                                >
                                    <Undo2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    disabled={pathsToRender.length === 0}
                                    className="p-1.5 rounded-lg border border-zinc-800 bg-[#18181b] text-rose-400 hover:bg-rose-500/10 disabled:opacity-40"
                                    title="Temizle"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="w-full overflow-hidden rounded-xl bg-[#09090b] border border-zinc-800">
                        <svg
                            ref={svgRef}
                            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            className={`w-full h-[280px] sm:h-[320px] touch-none select-none ${readOnly ? "" : "cursor-crosshair"}`}
                        >
                            {pathsToRender.map((p) => (
                                <path
                                    key={p.id}
                                    d={p.d}
                                    stroke={p.color || "#38BDF8"}
                                    strokeWidth={p.strokeWidth || 3}
                                    opacity={p.opacity ?? 1}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            ))}
                            {activePath && (
                                <path
                                    d={activePath.d}
                                    stroke={activePath.color}
                                    strokeWidth={activePath.strokeWidth}
                                    opacity={activePath.opacity ?? 1}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            )}
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
}
