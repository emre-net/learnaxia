
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
        if (!question || !answer) return; // Validation

        const newItem = {
            id: id || generateId(), // Preserve ID if editing, else generate UUID
            type: type, // Inherit from module type
            content: {
                question: question,
                answer: answer,
                solution: solution, // Renamed from explanation
                options: type === 'MC' ? options : undefined
            },
            isSelected: false // Ensure new items are not selected by default
        };

        onSave(newItem);
        onOpenChange(false);
    };

    const getTitle = () => {
        const action = initialData ? "Düzenle" : "Ekle";
        switch (type) {
            case 'FLASHCARD': return `Kart ${action}`;
            case 'MC': return `Çoktan Seçmeli Soru ${action}`;
            case 'GAP': return `Boşluk Doldurma ${action}`;
            case 'TRUE_FALSE': return `Doğru / Yanlış Sorusu ${action}`;
            default: return `Soru ${action}`;
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{getTitle()}</SheetTitle>
                    <SheetDescription>
                        {initialData ? "İçeriği güncelleyin." : "Yeni içerik oluşturun."}
                    </SheetDescription>
                </SheetHeader>

                <div className="grid gap-6 py-6">
                    {/* Question / Front */}
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="question">
                                {type === 'FLASHCARD' ? 'Ön Yüz (Soru)' : 'Soru Metni'}
                            </Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-muted-foreground hover:text-primary"
                                onClick={() => toast({ title: "Yakında", description: "Görsel yükleme özelliği çok yakında eklenecek.", variant: "default" })}
                            >
                                📷 Görsel Ekle
                            </Button>
                        </div>
                        <Textarea
                            id="question"
                            placeholder={type === 'GAP' ? "Örn: Ankara Türkiye'nin [...] şehridir." : "Sorunuzu buraya yazın..."}
                            className="resize-none min-h-[100px]"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        />
                    </div>

                    {/* Answer / Back (Flashcard) */}
                    {type === 'FLASHCARD' && (
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="answer">Arka Yüz (Cevap)</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-muted-foreground hover:text-primary"
                                    onClick={() => toast({ title: "Yakında", description: "Görsel yükleme özelliği çok yakında eklenecek.", variant: "default" })}
                                >
                                    📷 Görsel Ekle
                                </Button>
                            </div>
                            <Textarea
                                id="answer"
                                placeholder="Cevabı buraya yazın..."
                                className="resize-none min-h-[100px]"
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
                                            const oldValue = newOpts[idx];
                                            newOpts[idx] = e.target.value;
                                            setOptions(newOpts);

                                            // If this option was selected as answer, update answer too
                                            if (answer === oldValue) {
                                                setAnswer(e.target.value);
                                            }
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

                    {/* Solution / Explanation - Simplified and Renamed */}
                    <div className="grid gap-2">
                        <Label htmlFor="solution">Çözüm / Detaylı Açıklama (Opsiyonel)</Label>
                        <Textarea
                            id="solution"
                            placeholder="Cevabın mantığını veya detayını buraya ekleyebilirsiniz."
                            className="resize-none"
                            value={solution}
                            onChange={(e) => setSolution(e.target.value)}
                        />
                    </div>
                </div>

                <SheetFooter>
                    <SheetClose asChild>
                        <Button type="button" variant="outline">İptal</Button>
                    </SheetClose>
                    <Button type="button" onClick={handleSave} disabled={!question || !answer}>
                        <Save className="mr-2 h-4 w-4" /> {initialData ? "Güncelle" : "Ekle"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
