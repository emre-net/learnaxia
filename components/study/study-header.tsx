"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStudyStore } from "@/stores/study-store";
import { useTranslation } from "@/lib/i18n/i18n";
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

    const { t } = useTranslation();

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
                                {t('common.confirmExit')}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('common.exitDescription', { progress: `${currentIndex + 1}/${items.length}` })}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>
                                {t('common.cancel')}
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={handleExit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                {t('common.exit')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <div className="flex flex-col w-full max-w-xs gap-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t('study.progress')}</span>
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
