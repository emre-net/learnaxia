
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { ModuleFormData } from "./manual-creation-wizard";

// Temporary ID generator for local items
const generateId = () => Math.random().toString(36).substr(2, 9);

type ItemType = 'FLASHCARD' | 'MC' | 'GAP';

export function ItemEditorSheet({
    open,
    onOpenChange,
    onSave,
    type
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (item: any) => void;
    type: ItemType;
}) {
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState(""); // Back of card or correct answer
    const [explanation, setExplanation] = useState("");
    const [options, setOptions] = useState<string[]>(["", ""]); // For MC

    // Reset form when opening
    useEffect(() => {
        if (open) {
            setQuestion("");
            setAnswer("");
            setExplanation("");
            setOptions(["", ""]);
        }
    }, [open]);

    const handleSave = () => {
        if (!question) return; // Validation

        const newItem = {
            id: generateId(),
            type: type, // Inherit from module type
            content: {
                question: question,
                answer: answer,
                explanation: explanation,
                options: type === 'MC' ? options : undefined
            }
        };

        onSave(newItem);
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Add {type === 'FLASHCARD' ? 'Flashcard' : type === 'MC' ? 'Question' : 'Gap Fill'}</SheetTitle>
                    <SheetDescription>
                        Create a new item for your module.
                    </SheetDescription>
                </SheetHeader>

                <div className="grid gap-6 py-6">
                    {/* Question / Front */}
                    <div className="grid gap-2">
                        <Label htmlFor="question">{type === 'FLASHCARD' ? 'Front (Question)' : 'Question Text'}</Label>
                        <Textarea
                            id="question"
                            placeholder="Enter the question or term..."
                            className="resize-none"
                            value={question}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuestion(e.target.value)}
                        />
                    </div>

                    {/* Answer / Back (Flashcard) */}
                    {type === 'FLASHCARD' && (
                        <div className="grid gap-2">
                            <Label htmlFor="answer">Back (Answer)</Label>
                            <Textarea
                                id="answer"
                                placeholder="Enter the answer or definition..."
                                className="resize-none"
                                value={answer}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAnswer(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Multiple Choice Options */}
                    {type === 'MC' && (
                        <div className="grid gap-4">
                            <Label>answer Options</Label>
                            <p className="text-xs text-muted-foreground mb-2">Check the correct answer.</p>
                            {options.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <Input
                                        value={opt}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            const newOpts = [...options];
                                            newOpts[idx] = e.target.value;
                                            setOptions(newOpts);
                                        }}
                                        placeholder={`Option ${idx + 1}`}
                                    />
                                    {/* Simple radio logic for MVP - just store index or text?
                                Design mentions "Answer: Input".
                                For MC, we need to know WHICH is correct.
                                Let's assume 'answer' state holds the CORRECT option text.
                            */}
                                    <div
                                        className={`h-6 w-6 rounded-full border cursor-pointer flex items-center justify-center ${answer === opt && opt !== "" ? "bg-green-500 border-green-500 text-white" : "border-muted"}`}
                                        onClick={() => setAnswer(opt)}
                                    >
                                        {answer === opt && opt !== "" && "✓"}
                                    </div>
                                    <Button
                                        variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => {
                                            const newOpts = options.filter((_, i) => i !== idx);
                                            setOptions(newOpts);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={() => setOptions([...options, ""])} className="w-fit">
                                <Plus className="mr-2 h-4 w-4" /> Add Option
                            </Button>
                        </div>
                    )}

                    {/* GAP Fill (Simple Text Input for now) */}
                    {type === 'GAP' && (
                        <div className="grid gap-2">
                            <Label htmlFor="gap-answer">Answer (Missing Word)</Label>
                            <Input
                                id="gap-answer"
                                placeholder="The word to fill in..."
                                value={answer}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnswer(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Tip: Use [...] in Question where you want the gap to appear.</p>
                        </div>
                    )}

                    {/* Explanation */}
                    <div className="grid gap-2">
                        <Label htmlFor="explanation">Explanation (Optional)</Label>
                        <Textarea
                            id="explanation"
                            placeholder="Context or why this is the answer..."
                            className="resize-none"
                            value={explanation}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setExplanation(e.target.value)}
                        />
                    </div>
                </div>

                <SheetFooter>
                    <SheetClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </SheetClose>
                    <Button onClick={handleSave} disabled={!question || !answer}>
                        <Save className="mr-2 h-4 w-4" /> Save Item
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
