"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStudyStore } from "@/stores/study-store";
import { useSettingsStore } from "@/stores/settings-store";
import { getStudyDictionary } from "@/lib/i18n/dictionaries";
import { X } from "lucide-react";
import { NotesSidebar } from "@/components/notes/notes-sidebar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

export function StudyHeader() {
    const router = useRouter();
    const {
        items,
        currentIndex,
        correctCount,
        wrongCount,
        moduleId
    } = useStudyStore();

    const { language } = useSettingsStore();
    const dict = getStudyDictionary(language);

    if (!items.length) return null;

    const progressValue = ((currentIndex) / items.length) * 100;

    const handleExit = () => {
        router.push(`/dashboard/modules/${moduleId}`);
    };

    return (
        <header className="w-full max-w-5xl flex items-center justify-between py-4 mb-8">
            <div className="flex items-center gap-4 flex-1">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <X className="h-5 w-5" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {language === 'tr' ? 'Çıkmak istediğine emin misin?' : 'Are you sure you want to exit?'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {language === 'tr'
                                    ? `İlerlemen (${currentIndex + 1}/${items.length}) kaydedilecek. İstediğin zaman kaldığın yerden devam edebilirsin.`
                                    : `Your progress (${currentIndex + 1}/${items.length}) will be saved. You can resume anytime from where you left off.`}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>
                                {language === 'tr' ? 'Vazgeç' : 'Cancel'}
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={handleExit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                {language === 'tr' ? 'Çıkış Yap' : 'Exit'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <div className="flex flex-col w-full max-w-xs gap-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{dict.progress}</span>
                        <span>{currentIndex + 1} / {items.length}</span>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                </div>
            </div>

            <div className="flex gap-4 text-sm font-medium items-center">
                <span className="text-green-500">{correctCount}</span>
                <span className="text-red-500">{wrongCount}</span>
                <div className="h-4 w-[1px] bg-border mx-2" />
                <NotesSidebar moduleId={moduleId || ""} itemId={items[currentIndex]?.id || undefined} />
                {/* Fallback empty string for moduleId if null, though logically valid in valid session */}
            </div>
        </header>
    );
}
