"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { useStudyStore } from "@/stores/study-store";
import { useSettingsStore } from "@/stores/settings-store";

export function StudyTimer() {
    const { startTime } = useStudyStore();
    const { showStudyTimer } = useSettingsStore();

    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        if (!startTime) return;

        // Force a re-render every second to update UI
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const start = new Date(startTime).getTime();
            const diffInSeconds = Math.floor((now - start) / 1000);
            setElapsedSeconds(diffInSeconds);
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    // If disabled in settings, we don't render it, but elapsedSeconds technically still counts in React state.
    // The actual system analytics backend time is calculated differently anyway so we just return null.
    if (!showStudyTimer || !startTime) {
        return null;
    }

    const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
    const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');

    return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 tabular-nums font-mono text-sm border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-top-2">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>{minutes}:{seconds}</span>
        </div>
    );
}
