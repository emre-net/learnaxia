
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
            <SheetContent className="sm:max-w-xl overflow-y-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-l border-white/20 dark:border-white/10">
                <SheetHeader className="mb-8">
                    <SheetTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        {getTitle()}
                    </SheetTitle>
                    <SheetDescription>
                        {initialData ? t('creation.itemEditor.editDescription') : t('creation.itemEditor.newDescription')}
                    </SheetDescription>
                </SheetHeader>

                <div className="grid gap-8 py-2">
                    {/* Question / Front */}
                    {type !== 'GAP' && (
                        <div className="grid gap-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="question" className="text-sm font-bold text-foreground/70 uppercase tracking-tight">
                                    {type === 'FLASHCARD' ? t('creation.itemEditor.frontSide') : t('creation.itemEditor.questionLabel')}
                                </Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-[10px] text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full px-3"
                                    onClick={() => toast({
                                        title: t('creation.itemEditor.comingSoon'),
                                        description: t('creation.itemEditor.imageFeatureHint'),
                                    })}
                                >
                                    📷 {t('creation.itemEditor.uploadImage')}
                                </Button>
                            </div>
                            <Textarea
                                id="question"
                                placeholder={t('creation.itemEditor.questionPlaceholder')}
                                className="resize-none min-h-[120px] bg-muted/30 border-muted-foreground/10 focus:border-primary/50 transition-all rounded-2xl p-4 text-lg font-medium"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Answer / Back (Flashcard) */}
                    {type === 'FLASHCARD' && (
                        <div className="grid gap-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="answer" className="text-sm font-bold text-foreground/70 uppercase tracking-tight">
                                    {t('creation.itemEditor.backSide')}
                                </Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-[10px] text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full px-3"
                                    onClick={() => toast({
                                        title: t('creation.itemEditor.comingSoon'),
                                        description: t('creation.itemEditor.imageFeatureHint'),
                                    })}
                                >
                                    📷 {t('creation.itemEditor.uploadImage')}
                                </Button>
                            </div>
                            <Textarea
                                id="answer"
                                placeholder={t('creation.itemEditor.answerPlaceholder')}
                                className="resize-none min-h-[120px] bg-muted/30 border-muted-foreground/10 focus:border-primary/50 transition-all rounded-2xl p-4 text-lg font-medium"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                            />
                        </div>
                    )}

                    {/* True / False */}
                    {type === 'TRUE_FALSE' && (
                        <div className="grid gap-4">
                            <Label className="text-sm font-bold text-foreground/70 uppercase tracking-tight">
                                {t('creation.itemEditor.correctAnswerLabel')}
                            </Label>
                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    variant={answer === "True" ? "default" : "outline"}
                                    className={`flex-1 h-14 rounded-2xl text-lg font-bold transition-all ${answer === "True"
                                            ? "bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20"
                                            : "border-muted-foreground/10 hover:border-green-500/30 hover:bg-green-500/5"
                                        }`}
                                    onClick={() => setAnswer("True")}
                                >
                                    <Check className={`mr-2 h-5 w-5 ${answer === "True" ? "animate-in zoom-in" : ""}`} /> {t('creation.itemEditor.trueLabel')}
                                </Button>
                                <Button
                                    type="button"
                                    variant={answer === "False" ? "default" : "outline"}
                                    className={`flex-1 h-14 rounded-2xl text-lg font-bold transition-all ${answer === "False"
                                            ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20"
                                            : "border-muted-foreground/10 hover:border-red-500/30 hover:bg-red-500/5"
                                        }`}
                                    onClick={() => setAnswer("False")}
                                >
                                    <X className={`mr-2 h-5 w-5 ${answer === "False" ? "animate-in zoom-in" : ""}`} /> {t('creation.itemEditor.falseLabel')}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Multiple Choice Options */}
                    {type === 'MC' && (
                        <div className="grid gap-6">
                            <div>
                                <Label className="text-sm font-bold text-foreground/70 uppercase tracking-tight">{t('creation.itemEditor.optionsLabel')}</Label>
                                <p className="text-[10px] text-muted-foreground mt-1">{t('creation.itemEditor.optionsHint')}</p>
                            </div>
                            <div className="space-y-4">
                                {options.map((opt, idx) => (
                                    <div key={idx} className="flex items-center gap-3 group/opt">
                                        <div className="relative flex-1">
                                            <Input
                                                value={opt}
                                                onChange={(e) => {
                                                    const newOpts = [...options];
                                                    const oldValue = newOpts[idx];
                                                    newOpts[idx] = e.target.value;
                                                    setOptions(newOpts);
                                                    if (answer === oldValue) setAnswer(e.target.value);
                                                }}
                                                placeholder={t('creation.itemEditor.optionPlaceholder', { index: idx + 1 })}
                                                className={`h-12 rounded-xl pr-12 transition-all ${answer === opt && opt !== ""
                                                        ? "border-green-500/50 bg-green-500/5 focus:border-green-500"
                                                        : "bg-muted/30 border-muted-foreground/10 focus:border-primary/50"
                                                    }`}
                                            />
                                            {answer === opt && opt !== "" && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
                                                    <Check className="h-5 w-5" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className={`h-10 w-10 rounded-xl transition-all ${answer === opt && opt !== ""
                                                        ? "text-green-600 bg-green-500/10"
                                                        : "text-muted-foreground hover:text-green-600 hover:bg-green-500/5"
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
                                                className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                                                onClick={() => {
                                                    const newOpts = options.filter((_, i) => i !== idx);
                                                    setOptions(newOpts);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setOptions([...options, ""])}
                                className="w-full h-11 border-dashed border-2 hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all rounded-xl border-muted-foreground/20"
                            >
                                <Plus className="mr-2 h-4 w-4" /> {t('creation.itemEditor.addOption')}
                            </Button>
                        </div>
                    )}

                    {/* GAP Fill */}
                    {type === 'GAP' && (
                        <div className="grid gap-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="question" className="text-sm font-bold text-foreground/70 uppercase tracking-tight">
                                    {t('creation.itemEditor.gapInstruction')}
                                </Label>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 text-[10px] bg-primary/10 text-primary hover:bg-primary transition-all rounded-full px-4 hover:text-white"
                                    onClick={() => {
                                        const textarea = document.getElementById('question') as HTMLTextAreaElement;
                                        if (!textarea) return;
                                        const start = textarea.selectionStart;
                                        const end = textarea.selectionEnd;
                                        const text = question;
                                        if (start === end) {
                                            toast({
                                                title: t('common.error'),
                                                description: t('creation.itemEditor.errorNoSelection'),
                                                variant: "destructive"
                                            });
                                            return;
                                        }
                                        const selected = text.substring(start, end);
                                        const before = text.substring(0, start);
                                        const after = text.substring(end);
                                        setQuestion(`${before}{{${selected}}}${after}`);
                                    }}
                                >
                                    ✨ {t('creation.itemEditor.hideSelected')}
                                </Button>
                            </div>
                            <Textarea
                                id="question"
                                placeholder={t('creation.itemEditor.gapPlaceholder')}
                                className="resize-none min-h-[140px] font-mono text-sm bg-muted/30 border-muted-foreground/10 focus:border-primary/50 transition-all rounded-2xl p-4"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                            />

                            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                                <span className="font-bold text-[10px] uppercase text-primary/70 block mb-2 tracking-widest">{t('creation.itemEditor.livePreview')}</span>
                                <div className="text-sm leading-relaxed">
                                    {question ? question.split(/(\{\{.*?\}\})/).map((part, i) => {
                                        if (part.startsWith('{{') && part.endsWith('}}')) {
                                            return (
                                                <span key={i} className="bg-primary text-white px-2 py-0.5 rounded-lg mx-0.5 font-bold shadow-sm inline-block my-0.5">
                                                    {part.slice(2, -2)}
                                                </span>
                                            );
                                        }
                                        return <span key={i} className="text-foreground/80">{part}</span>;
                                    }) : <span className="text-muted-foreground italic opacity-70">{t('creation.itemEditor.noGapsYet')}</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Solution / Explanation */}
                    <div className="grid gap-3 pt-4 border-t border-border/50">
                        <Label htmlFor="solution" className="text-sm font-bold text-foreground/70 uppercase tracking-tight">
                            {t('creation.itemEditor.solutionLabel')}
                        </Label>
                        <Textarea
                            id="solution"
                            placeholder={t('creation.itemEditor.solutionPlaceholder')}
                            className="resize-none min-h-[100px] bg-muted/30 border-muted-foreground/10 focus:border-primary/50 transition-all rounded-2xl p-4"
                            value={solution}
                            onChange={(e) => setSolution(e.target.value)}
                        />
                    </div>
                </div>

                <SheetFooter className="mt-8 pt-6 border-t border-border/50">
                    <SheetClose asChild>
                        <Button type="button" variant="ghost" className="rounded-xl hover:bg-accent/50">{t('common.cancel')}</Button>
                    </SheetClose>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={!question || (type !== 'GAP' && !answer)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 px-8 rounded-xl transition-all hover:scale-105 active:scale-95"
                    >
                        <Save className="mr-2 h-4 w-4" /> {initialData ? t('common.save') : t('common.add')}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
