
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from 'uuid';

// Temporary ID generator for local items - REPLACED with UUID
const generateId = () => uuidv4();

type ItemType = 'FLASHCARD' | 'MC' | 'GAP' | 'TRUE_FALSE';

import { useTranslation } from "@/lib/i18n/i18n";

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
    const [answer, setAnswer] = useState(""); // Back of card or correct answer
    const [solution, setSolution] = useState(""); // Detailed solution / explanation
    const [options, setOptions] = useState<string[]>(["", ""]); // For MC
    const [id, setId] = useState<string | null>(null);

    // Reset or Populate form when opening
    useEffect(() => {
        if (open) {
            if (initialData) {
                // Edit Mode
                setId(initialData.id);
                setQuestion(initialData.content?.question || "");
                setAnswer(initialData.content?.answer || "");
                setSolution(initialData.content?.solution || "");
                setOptions(initialData.content?.options || ["", ""]);
            } else {
                // New Item Mode
                setId(null);
                setQuestion("");
                setAnswer("");
                setSolution("");
                setOptions(["", ""]);
            }
        }
    }, [open, initialData]);

    const handleSave = () => {
        // Validation
        if (!question) return;
        if (type !== 'GAP' && !answer) return; // Flashcard/MC/TF needs explict answer field
        if (type === 'GAP' && !question.includes('{{')) {
            toast({
                title: t('common.error'),
                description: t('creation.itemEditor.errorNoGaps'),
                variant: "destructive"
            });
            return;
        }

        // Logic to extract answers for GAP
        let finalAnswer = answer;
        let finalSolution = solution;
        let finalOptions = type === 'MC' ? options : undefined;
        let finalQuestion = question;

        if (type === 'GAP') {
            const matches = question.match(/\{\{(.*?)\}\}/g);
            if (matches) {
                const answers = matches.map(m => m.slice(2, -2));
                finalQuestion = question;
                finalAnswer = answers[0];
            }
        }

        const newItem = {
            id: id || generateId(),
            type: type,
            content: {
                question: finalQuestion,
                answer: finalAnswer,
                solution: finalSolution,
                options: finalOptions,
                text: type === 'GAP' ? finalQuestion : undefined,
                answers: type === 'GAP' ? (question.match(/\{\{(.*?)\}\}/g) || []).map(m => m.slice(2, -2)) : undefined
            },
            isSelected: false
        };

        onSave(newItem);
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
            <SheetContent className="sm:max-w-xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{getTitle()}</SheetTitle>
                    <SheetDescription>
                        {initialData ? t('creation.itemEditor.editDescription') : t('creation.itemEditor.newDescription')}
                    </SheetDescription>
                </SheetHeader>

                <div className="grid gap-6 py-6">
                    {/* Question / Front - Hide for GAP (handled separately) */}
                    {type !== 'GAP' && (
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="question">
                                    {type === 'FLASHCARD' ? t('creation.itemEditor.frontSide') : t('creation.itemEditor.questionLabel')}
                                </Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-muted-foreground hover:text-primary"
                                    onClick={() => toast({
                                        title: t('creation.itemEditor.comingSoon'),
                                        description: t('creation.itemEditor.imageFeatureHint'),
                                        variant: "default"
                                    })}
                                >
                                    📷 {t('creation.itemEditor.uploadImage')}
                                </Button>
                            </div>
                            <Textarea
                                id="question"
                                placeholder={t('creation.itemEditor.gapPlaceholder')}
                                className="resize-none min-h-[100px]"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Answer / Back (Flashcard) */}
                    {type === 'FLASHCARD' && (
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="answer">{t('creation.itemEditor.backSide')}</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-muted-foreground hover:text-primary"
                                    onClick={() => toast({
                                        title: t('creation.itemEditor.comingSoon'),
                                        description: t('creation.itemEditor.imageFeatureHint'),
                                        variant: "default"
                                    })}
                                >
                                    📷 {t('creation.itemEditor.uploadImage')}
                                </Button>
                            </div>
                            <Textarea
                                id="answer"
                                placeholder={t('creation.itemEditor.backSide')}
                                className="resize-none min-h-[100px]"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                            />
                        </div>
                    )}

                    {/* True / False */}
                    {type === 'TRUE_FALSE' && (
                        <div className="grid gap-4">
                            <Label>{t('creation.itemEditor.correctAnswerLabel')}</Label>
                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    variant={answer === "True" ? "default" : "outline"}
                                    className={`flex-1 ${answer === "True" ? "bg-green-600 hover:bg-green-700" : ""}`}
                                    onClick={() => setAnswer("True")}
                                >
                                    <Check className="mr-2 h-4 w-4" /> {t('creation.itemEditor.trueLabel')}
                                </Button>
                                <Button
                                    type="button"
                                    variant={answer === "False" ? "default" : "outline"}
                                    className={`flex-1 ${answer === "False" ? "bg-red-600 hover:bg-red-700" : ""}`}
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
                            <Label>{t('creation.itemEditor.optionsLabel')}</Label>
                            <p className="text-xs text-muted-foreground mb-2">{t('creation.itemEditor.optionsHint')}</p>
                            {options.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <Input
                                        value={opt}
                                        onChange={(e) => {
                                            const newOpts = [...options];
                                            const oldValue = newOpts[idx];
                                            newOpts[idx] = e.target.value;
                                            setOptions(newOpts);

                                            if (answer === oldValue) {
                                                setAnswer(e.target.value);
                                            }
                                        }}
                                        placeholder={t('creation.itemEditor.optionPlaceholder', { index: idx + 1 })}
                                    />
                                    <div
                                        className={`h-9 w-9 rounded-md border cursor-pointer flex items-center justify-center transition-all ${answer === opt && opt !== "" ? "bg-green-500 border-green-500 text-white shadow-md" : "border-muted hover:bg-muted"}`}
                                        onClick={() => setAnswer(opt)}
                                        title={t('creation.itemEditor.markAsCorrect')}
                                    >
                                        {answer === opt && opt !== "" && <Check className="h-5 w-5" />}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                        onClick={() => {
                                            const newOpts = options.filter((_, i) => i !== idx);
                                            setOptions(newOpts);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={() => setOptions([...options, ""])} className="w-fit">
                                <Plus className="mr-2 h-4 w-4" /> {t('creation.itemEditor.addOption')}
                            </Button>
                        </div>
                    )}

                    {/* GAP Fill */}
                    {type === 'GAP' && (
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="question">{t('creation.itemEditor.gapInstruction')}</Label>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                        const textarea = document.getElementById('question') as HTMLTextAreaElement;
                                        if (!textarea) return;

                                        const start = textarea.selectionStart;
                                        const end = textarea.selectionEnd;
                                        const text = question;

                                        if (start === end) {
                                            toast({
                                                title: t('creation.itemEditor.comingSoon'),
                                                description: t('creation.itemEditor.errorNoGaps'),
                                                variant: "destructive"
                                            });
                                            return;
                                        }

                                        const selected = text.substring(start, end);
                                        const before = text.substring(0, start);
                                        const after = text.substring(end);

                                        const newText = `${before}{{${selected}}}${after}`;
                                        setQuestion(newText);
                                    }}
                                >
                                    {t('creation.itemEditor.hideSelected')}
                                </Button>
                            </div>
                            <Textarea
                                id="question"
                                placeholder={t('creation.itemEditor.gapPlaceholder')}
                                className="resize-none min-h-[100px] font-mono text-sm"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                            />

                            {/* Live Preview of Blanks */}
                            <div className="p-3 bg-muted/50 rounded-md text-sm">
                                <span className="font-semibold text-xs uppercase text-muted-foreground block mb-2">{t('creation.itemEditor.livePreview')}</span>
                                {question.split(/(\{\{.*?\}\})/).map((part, i) => {
                                    if (part.startsWith('{{') && part.endsWith('}}')) {
                                        return (
                                            <span key={i} className="bg-primary/20 text-primary px-1.5 py-0.5 rounded mx-0.5 font-medium border border-primary/30">
                                                {part.slice(2, -2)}
                                            </span>
                                        );
                                    }
                                    return <span key={i}>{part}</span>;
                                })}
                                {question && !question.includes('{{') && (
                                    <span className="text-muted-foreground italic opacity-70">{t('creation.itemEditor.noGapsYet')}</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Solution / Explanation */}
                    <div className="grid gap-2">
                        <Label htmlFor="solution">{t('creation.itemEditor.solutionLabel')}</Label>
                        <Textarea
                            id="solution"
                            placeholder={t('creation.itemEditor.solutionPlaceholder')}
                            className="resize-none"
                            value={solution}
                            onChange={(e) => setSolution(e.target.value)}
                        />
                    </div>
                </div>

                <SheetFooter>
                    <SheetClose asChild>
                        <Button type="button" variant="outline">{t('common.cancel')}</Button>
                    </SheetClose>
                    <Button type="button" onClick={handleSave} disabled={!question || (type !== 'GAP' && !answer)}>
                        <Save className="mr-2 h-4 w-4" /> {initialData ? t('common.save') : t('common.add')}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
