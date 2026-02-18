
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, Check, X } from "lucide-react";
import { useState, useEffect } from "react";

// Temporary ID generator for local items
const generateId = () => Math.random().toString(36).substr(2, 9);

type ItemType = 'FLASHCARD' | 'MC' | 'GAP' | 'TRUE_FALSE';

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
        if (!question || !answer) return; // Validation

        const newItem = {
            id: generateId(),
            type: type, // Inherit from module type
            content: {
                question: question,
                answer: answer,
                explanation: explanation,
                options: type === 'MC' ? options : undefined
            },
            isSelected: false // Ensure new items are not selected by default
        };

        onSave(newItem);
        onOpenChange(false);
    };

    const getTitle = () => {
        switch (type) {
            case 'FLASHCARD': return 'Yeni Kart Ekle';
            case 'MC': return 'Çoktan Seçmeli Soru Ekle';
            case 'GAP': return 'Boşluk Doldurma Ekle';
            case 'TRUE_FALSE': return 'Doğru / Yanlış Sorusu Ekle';
            default: return 'Soru Ekle';
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{getTitle()}</SheetTitle>
                    <SheetDescription>
                        Modülünüz için yeni bir içerik oluşturun.
                    </SheetDescription>
                </SheetHeader>

                <div className="grid gap-6 py-6">
                    {/* Question / Front */}
                    <div className="grid gap-2">
                        <Label htmlFor="question">
                            {type === 'FLASHCARD' ? 'Ön Yüz (Soru/Kavram)' : 'Soru Metni'}
                        </Label>
                        <Textarea
                            id="question"
                            placeholder={type === 'GAP' ? "Örn: Ankara Türkiye'nin [...] şehridir." : "Sorunuzu buraya yazın..."}
                            className="resize-none"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        />
                    </div>

                    {/* Answer / Back (Flashcard) */}
                    {type === 'FLASHCARD' && (
                        <div className="grid gap-2">
                            <Label htmlFor="answer">Arka Yüz (Cevap/Tanım)</Label>
                            <Textarea
                                id="answer"
                                placeholder="Cevabı buraya yazın..."
                                className="resize-none"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                            />
                        </div>
                    )}

                    {/* True / False */}
                    {type === 'TRUE_FALSE' && (
                        <div className="grid gap-4">
                            <Label>Doğru Cevap</Label>
                            <div className="flex gap-4">
                                <Button
                                    type="button"
                                    variant={answer === "True" ? "default" : "outline"}
                                    className={`flex-1 ${answer === "True" ? "bg-green-600 hover:bg-green-700" : ""}`}
                                    onClick={() => setAnswer("True")}
                                >
                                    <Check className="mr-2 h-4 w-4" /> Doğru
                                </Button>
                                <Button
                                    type="button"
                                    variant={answer === "False" ? "default" : "outline"}
                                    className={`flex-1 ${answer === "False" ? "bg-red-600 hover:bg-red-700" : ""}`}
                                    onClick={() => setAnswer("False")}
                                >
                                    <X className="mr-2 h-4 w-4" /> Yanlış
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Multiple Choice Options */}
                    {type === 'MC' && (
                        <div className="grid gap-4">
                            <Label>Seçenekler</Label>
                            <p className="text-xs text-muted-foreground mb-2">Doğru cevabı işaretlemeyi unutmayın.</p>
                            {options.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <Input
                                        value={opt}
                                        onChange={(e) => {
                                            const newOpts = [...options];
                                            newOpts[idx] = e.target.value;
                                            setOptions(newOpts);
                                        }}
                                        placeholder={`Seçenek ${idx + 1}`}
                                    />
                                    <div
                                        className={`h-9 w-9 rounded-md border cursor-pointer flex items-center justify-center transition-all ${answer === opt && opt !== "" ? "bg-green-500 border-green-500 text-white shadow-md" : "border-muted hover:bg-muted"}`}
                                        onClick={() => setAnswer(opt)}
                                        title="Doğru cevap olarak işaretle"
                                    >
                                        {answer === opt && opt !== "" && <Check className="h-5 w-5" />}
                                    </div>
                                    <Button
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
                            <Button variant="outline" size="sm" onClick={() => setOptions([...options, ""])} className="w-fit">
                                <Plus className="mr-2 h-4 w-4" /> Seçenek Ekle
                            </Button>
                        </div>
                    )}

                    {/* GAP Fill */}
                    {type === 'GAP' && (
                        <div className="grid gap-2">
                            <Label htmlFor="gap-answer">Cevap (Eksik Kelime)</Label>
                            <Input
                                id="gap-answer"
                                placeholder="Boşluğa gelecek kelimeyi yazın..."
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">İpucu: Soruda boşluk bırakmak istediğiniz yere [...] yazın.</p>
                        </div>
                    )}

                    {/* Explanation */}
                    <div className="grid gap-2">
                        <Label htmlFor="explanation">Açıklama (Opsiyonel)</Label>
                        <Textarea
                            id="explanation"
                            placeholder="Cevap hakkında ek bilgi veya ipucu..."
                            className="resize-none"
                            value={explanation}
                            onChange={(e) => setExplanation(e.target.value)}
                        />
                    </div>
                </div>

                <SheetFooter>
                    <SheetClose asChild>
                        <Button variant="outline">İptal</Button>
                    </SheetClose>
                    <Button onClick={handleSave} disabled={!question || !answer}>
                        <Save className="mr-2 h-4 w-4" /> Kaydet
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
