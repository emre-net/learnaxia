"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, Check, X, ImagePlus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from "@/lib/i18n/i18n";
import { resolveTrueFalseAnswer } from "@learnaxia/shared";

const generateId = () => uuidv4();

type ItemType = 'FLASHCARD' | 'MC' | 'GAP' | 'TRUE_FALSE';

async function resizeItemImage(file: File, maxDim = 640): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new window.Image();
            img.onload = () => {
                const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
                const w = Math.max(1, Math.round(img.width * scale));
                const h = Math.max(1, Math.round(img.height * scale));
                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    resolve(typeof reader.result === "string" ? reader.result : "");
                    return;
                }
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL("image/jpeg", 0.72));
            };
            img.onerror = () => resolve("");
            img.src = typeof reader.result === "string" ? reader.result : "";
        };
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
    });
}

export function ItemEditorSheet({
    open,
    onOpenChange,
    onSave,
    type,
    initialData
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (item: any) => void;
    type: ItemType;
    initialData?: any;
}) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [solution, setSolution] = useState("");
    const [image, setImage] = useState("");
    const [options, setOptions] = useState<string[]>(["", ""]);
    const [id, setId] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            if (initialData) {
                const c = initialData.content || {};
                setId(initialData.id);
                setQuestion(c.question || c.front || c.statement || c.text || "");
                if (type === "TRUE_FALSE") {
                    setAnswer(resolveTrueFalseAnswer(c) ? "True" : "False");
                } else {
                    setAnswer(c.answer || c.back || (Array.isArray(c.answers) ? c.answers[0] : "") || "");
                }
                setSolution(c.solution || c.explanation || "");
                setImage(c.image || c.imageUrl || "");
                setOptions(Array.isArray(c.options) && c.options.length > 0 ? c.options : ["", ""]);
            } else {
                setId(null);
                setQuestion("");
                setAnswer(type === "TRUE_FALSE" ? "True" : "");
                setSolution("");
                setImage("");
                setOptions(["", ""]);
            }
        }
    }, [open, initialData, type]);

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const resized = await resizeItemImage(file, 640);
        if (resized) setImage(resized);
        e.target.value = "";
    };

    const handleSave = () => {
        if (!question.trim()) return;
        if (type !== 'GAP' && !answer.trim()) return;
        if (type === 'GAP' && !question.includes('{{')) {
            toast({
                title: t('common.error'),
                description: t('creation.itemEditor.errorNoGaps'),
                variant: "destructive"
            });
            return;
        }

        let finalAnswer = answer.trim();
        const finalSolution = solution.trim();
        const finalOptions = type === 'MC' ? options.filter(Boolean) : undefined;
        const finalQuestion = question.trim();
        let gapAnswers: string[] | undefined;

        if (type === 'GAP') {
            const matches = finalQuestion.match(/\{\{(.*?)\}\}/g) || [];
            gapAnswers = matches.map(m => m.slice(2, -2).trim());
            finalAnswer = gapAnswers[0] || "";
        }

        const content: Record<string, any> = {
            question: finalQuestion,
            answer: finalAnswer,
            solution: finalSolution || undefined,
            explanation: finalSolution || undefined,
            image: image.trim() || undefined,
        };

        if (type === 'FLASHCARD') {
            content.front = finalQuestion;
            content.back = finalAnswer;
        } else if (type === 'MC') {
            content.options = finalOptions;
            content.correctAnswer = finalAnswer;
        } else if (type === 'TRUE_FALSE') {
            const boolVal = finalAnswer === 'True';
            content.statement = finalQuestion;
            content.isTrue = boolVal;
            content.correctAnswer = boolVal;
        } else if (type === 'GAP') {
            content.text = finalQuestion;
            content.answers = gapAnswers;
        }

        onSave({
            id: id || generateId(),
            type,
            content,
            isSelected: false
        });
        onOpenChange(false);
    };

    const getTypeLabel = (t_key: string) => {
        switch (t_key) {
            case 'FLASHCARD': return t('creation.itemFlashcard');
            case 'MC': return t('creation.itemMC');
            case 'GAP': return t('creation.itemGap');
            case 'TRUE_FALSE': return t('creation.itemTF');
            default: return t('creation.itemGeneric');
        }
    };

    const getTitle = () => {
        const typeLabel = getTypeLabel(type);
        return initialData
            ? t('creation.itemEditor.edit', { type: typeLabel })
            : t('creation.itemEditor.add', { type: typeLabel });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl overflow-y-auto bg-[#121215] border-l border-zinc-800 text-zinc-100">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-2xl font-bold text-zinc-100">
                        {getTitle()}
                    </SheetTitle>
                    <SheetDescription className="text-zinc-400">
                        {initialData ? t('creation.itemEditor.editDescription') : t('creation.itemEditor.newDescription')}
                    </SheetDescription>
                </SheetHeader>

                <div className="grid gap-6 py-2">
                    {/* Question / Front / Statement */}
                    {type !== 'GAP' && (
                        <div className="grid gap-2.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="question" className="text-sm font-semibold text-zinc-300">
                                    {type === 'FLASHCARD' ? t('creation.itemEditor.frontSide') : t('creation.itemEditor.questionLabel')}
                                </Label>
                                <div className="flex items-center gap-2">
                                    {image && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs text-rose-400 hover:bg-rose-500/10 rounded-full px-2.5"
                                            onClick={() => setImage("")}
                                        >
                                            Görseli Kaldır
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs text-sky-400 hover:bg-sky-500/10 rounded-full px-3 gap-1.5"
                                        onClick={() => imageInputRef.current?.click()}
                                    >
                                        <ImagePlus className="h-3.5 w-3.5" /> {image ? "Değiştir" : t('creation.itemEditor.uploadImage')}
                                    </Button>
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageSelect}
                                    />
                                </div>
                            </div>
                            {image && (
                                <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-[#09090b] p-2">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={image} alt="Kart görseli" className="max-h-40 mx-auto object-contain rounded-lg" />
                                </div>
                            )}
                            <Textarea
                                id="question"
                                placeholder={t('creation.itemEditor.questionPlaceholder')}
                                className="resize-none min-h-[110px] bg-[#18181b] border-zinc-800 focus:border-sky-400 rounded-2xl p-4 text-base text-zinc-100"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Answer / Back (Flashcard) */}
                    {type === 'FLASHCARD' && (
                        <div className="grid gap-2.5">
                            <Label htmlFor="answer" className="text-sm font-semibold text-zinc-300">
                                {t('creation.itemEditor.backSide')}
                            </Label>
                            <Textarea
                                id="answer"
                                placeholder={t('creation.itemEditor.answerPlaceholder')}
                                className="resize-none min-h-[110px] bg-[#18181b] border-zinc-800 focus:border-sky-400 rounded-2xl p-4 text-base text-zinc-100"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                            />
                        </div>
                    )}

                    {/* True / False */}
                    {type === 'TRUE_FALSE' && (
                        <div className="grid gap-3">
                            <Label className="text-sm font-semibold text-zinc-300">
                                {t('creation.itemEditor.correctAnswerLabel')}
                            </Label>
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant={answer === "True" ? "default" : "outline"}
                                    className={`flex-1 h-12 rounded-xl font-semibold ${answer === "True"
                                        ? "bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
                                        : "border-zinc-800 bg-[#18181b] text-zinc-300 hover:border-emerald-500/40"
                                    }`}
                                    onClick={() => setAnswer("True")}
                                >
                                    <Check className="mr-2 h-4 w-4" /> {t('creation.itemEditor.trueLabel')}
                                </Button>
                                <Button
                                    type="button"
                                    variant={answer === "False" ? "default" : "outline"}
                                    className={`flex-1 h-12 rounded-xl font-semibold ${answer === "False"
                                        ? "bg-rose-500 hover:bg-rose-400 text-zinc-950"
                                        : "border-zinc-800 bg-[#18181b] text-zinc-300 hover:border-rose-500/40"
                                    }`}
                                    onClick={() => setAnswer("False")}
                                >
                                    <X className="mr-2 h-4 w-4" /> {t('creation.itemEditor.falseLabel')}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Multiple Choice Options */}
                    {type === 'MC' && (
                        <div className="grid gap-4">
                            <div>
                                <Label className="text-sm font-semibold text-zinc-300">{t('creation.itemEditor.optionsLabel')}</Label>
                                <p className="text-xs text-zinc-400 mt-1">{t('creation.itemEditor.optionsHint')}</p>
                            </div>
                            <div className="space-y-3">
                                {options.map((opt, idx) => (
                                    <div key={idx} className="flex items-center gap-2.5">
                                        <div className="relative flex-1">
                                            <Input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => {
                                                    const newOpts = [...options];
                                                    const oldValue = newOpts[idx];
                                                    newOpts[idx] = e.target.value;
                                                    setOptions(newOpts);
                                                    if (answer === oldValue) setAnswer(e.target.value);
                                                }}
                                                placeholder={t('creation.itemEditor.optionPlaceholder', { index: idx + 1 })}
                                                className={`h-11 rounded-xl pr-10 ${answer === opt && opt !== ""
                                                    ? "border-emerald-500/60 bg-emerald-500/10"
                                                    : "bg-[#18181b] border-zinc-800"
                                                }`}
                                            />
                                            {answer === opt && opt !== "" && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400">
                                                    <Check className="h-4 w-4" />
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className={`h-10 w-10 rounded-xl ${answer === opt && opt !== ""
                                                ? "text-emerald-400 bg-emerald-500/15"
                                                : "text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                                            }`}
                                            onClick={() => setAnswer(opt)}
                                            title={t('creation.itemEditor.markAsCorrect')}
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
                                            onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setOptions([...options, ""])}
                                className="w-full h-10 border-dashed border-zinc-700 bg-[#18181b] hover:border-sky-500/50 text-zinc-300 rounded-xl"
                            >
                                <Plus className="mr-2 h-4 w-4" /> {t('creation.itemEditor.addOption')}
                            </Button>
                        </div>
                    )}

                    {/* GAP Fill */}
                    {type === 'GAP' && (
                        <div className="grid gap-3">
                            <div className="flex items-center justify-between gap-2">
                                <Label htmlFor="question" className="text-sm font-semibold text-zinc-300">
                                    {t('creation.itemEditor.gapInstruction')}
                                </Label>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 text-xs bg-sky-500/15 text-sky-400 hover:bg-sky-500 hover:text-zinc-950 rounded-full px-3"
                                    onClick={() => {
                                        const textarea = document.getElementById('question') as HTMLTextAreaElement;
                                        if (!textarea) return;
                                        const start = textarea.selectionStart;
                                        const end = textarea.selectionEnd;
                                        if (start === end) {
                                            toast({
                                                title: t('common.error'),
                                                description: t('creation.itemEditor.errorNoSelection'),
                                                variant: "destructive"
                                            });
                                            return;
                                        }
                                        setQuestion(`${question.slice(0, start)}{{${question.slice(start, end)}}}${question.slice(end)}`);
                                    }}
                                >
                                    {t('creation.itemEditor.hideSelected')}
                                </Button>
                            </div>
                            <Textarea
                                id="question"
                                placeholder={t('creation.itemEditor.gapPlaceholder')}
                                className="resize-none min-h-[130px] font-mono text-sm bg-[#18181b] border-zinc-800 rounded-2xl p-4"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                            />
                            <div className="p-4 bg-[#18181b] border border-zinc-800 rounded-2xl">
                                <span className="font-semibold text-xs text-sky-400 block mb-2">{t('creation.itemEditor.livePreview')}</span>
                                <div className="text-sm leading-relaxed">
                                    {question ? question.split(/(\{\{.*?\}\})/).map((part, i) => {
                                        if (part.startsWith('{{') && part.endsWith('}}')) {
                                            return (
                                                <span key={i} className="bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded-lg mx-0.5 font-semibold inline-block my-0.5">
                                                    {part.slice(2, -2)}
                                                </span>
                                            );
                                        }
                                        return <span key={i} className="text-zinc-300">{part}</span>;
                                    }) : <span className="text-zinc-500 italic">{t('creation.itemEditor.noGapsYet')}</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Solution / Explanation */}
                    <div className="grid gap-2.5 pt-3 border-t border-zinc-800">
                        <Label htmlFor="solution" className="text-sm font-semibold text-zinc-300">
                            {t('creation.itemEditor.solutionLabel')}
                        </Label>
                        <Textarea
                            id="solution"
                            placeholder={t('creation.itemEditor.solutionPlaceholder')}
                            className="resize-none min-h-[90px] bg-[#18181b] border-zinc-800 rounded-2xl p-4 text-sm text-zinc-100"
                            value={solution}
                            onChange={(e) => setSolution(e.target.value)}
                        />
                    </div>
                </div>

                <SheetFooter className="mt-6 pt-5 border-t border-zinc-800">
                    <SheetClose asChild>
                        <Button type="button" variant="ghost" className="rounded-xl text-zinc-400">{t('common.cancel')}</Button>
                    </SheetClose>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={!question.trim() || (type !== 'GAP' && !answer.trim())}
                        className="bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold px-8 rounded-xl"
                    >
                        <Save className="mr-2 h-4 w-4" /> {initialData ? (t('common.save') || "Kaydet") : "Ekle"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
