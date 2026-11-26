"use client";

import React from "react";
import { parseRichContentBlocks, parseInlineRuns, type RichBlock } from "@learnaxia/shared";

interface RichMathTextProps {
    text: string;
    className?: string;
    compact?: boolean;
}

function renderRuns(line: string) {
    const runs = parseInlineRuns(line);
    return runs.map((run, idx) => {
        if (run.bold) {
            return <strong key={idx} className="font-semibold text-zinc-100">{run.text}</strong>;
        }
        if (run.italic) {
            return <em key={idx} className="italic text-zinc-200">{run.text}</em>;
        }
        if (run.code) {
            return (
                <code key={idx} className="px-1.5 py-0.5 rounded bg-zinc-800/90 text-sky-300 font-mono text-[0.9em]">
                    {run.text}
                </code>
            );
        }
        return <React.Fragment key={idx}>{run.text}</React.Fragment>;
    });
}

export function RichMathText({ text, className = "", compact = false }: RichMathTextProps) {
    if (!text) return null;

    if (compact) {
        const blocks = parseRichContentBlocks(text);
        if (blocks.length === 0) return <span className={className}>{text}</span>;
        return (
            <span className={className}>
                {blocks.map((b, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && " "}
                        {renderRuns(b.text)}
                    </React.Fragment>
                ))}
            </span>
        );
    }

    const blocks: RichBlock[] = parseRichContentBlocks(text);
    if (blocks.length === 0) {
        return <p className={className}>{text}</p>;
    }

    return (
        <div className={`space-y-2.5 ${className}`}>
            {blocks.map((block, index) => {
                if (block.type === "heading") {
                    const headingCls =
                        block.level === 1
                            ? "text-lg font-bold text-zinc-100 mt-1"
                            : block.level === 2
                            ? "text-base font-bold text-zinc-100 mt-1"
                            : "text-sm font-semibold text-zinc-200 mt-0.5";
                    return <div key={index} className={headingCls}>{renderRuns(block.text)}</div>;
                }
                if (block.type === "list-item") {
                    return (
                        <div key={index} className="flex items-start gap-2 pl-1">
                            <span className="text-sky-400 mt-0.5">•</span>
                            <div className="flex-1 leading-relaxed">{renderRuns(block.text)}</div>
                        </div>
                    );
                }
                if (block.type === "blockquote") {
                    return (
                        <div key={index} className="border-l-2 border-sky-500/60 pl-3 py-0.5 text-zinc-300 italic">
                            {renderRuns(block.text)}
                        </div>
                    );
                }
                return (
                    <p key={index} className="leading-relaxed">
                        {renderRuns(block.text)}
                    </p>
                );
            })}
        </div>
    );
}
