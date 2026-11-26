"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Timer, Hourglass, Settings2, Maximize2, Minimize2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTimer, TimerMode } from "@/hooks/use-timer";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/i18n";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function FocusWidget() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'POMODORO' | 'STOPWATCH'>('POMODORO');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [pomodoroDuration, setPomodoroDuration] = useState(25 * 60);

    // Escape key listener for exiting fullscreen
    useEffect(() => {
        if (!isFullscreen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsFullscreen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isFullscreen]);

    // Timer instances
    const timer = useTimer({
        initialMode: 'COUNTDOWN',
        initialSeconds: pomodoroDuration
    });

    const handleTabChange = (value: string) => {
        const mode = value as 'POMODORO' | 'STOPWATCH';
        setActiveTab(mode);
        timer.pause();

        if (mode === 'POMODORO') {
            timer.reset(pomodoroDuration, 'COUNTDOWN');
        } else {
            timer.reset(0, 'STOPWATCH');
        }
    };

    const handleReset = () => {
        if (activeTab === 'POMODORO') {
            timer.reset(pomodoroDuration, 'COUNTDOWN');
        } else {
            timer.reset(0, 'STOPWATCH');
        }
    };

    const changePomodoroDuration = (mins: number) => {
        const secs = mins * 60;
        setPomodoroDuration(secs);
        if (activeTab === 'POMODORO') {
            timer.reset(secs, 'COUNTDOWN');
        }
    };

    return (
        <Card className={cn(
            "relative overflow-hidden bg-[#121215] border border-white/[0.08] transition-all duration-300 group",
            isFullscreen
                ? "fixed inset-0 z-[100] m-0 rounded-none w-screen h-screen flex flex-col justify-center items-center shadow-none bg-[#09090b]"
                : "w-full shadow-xl"
        )}>

            <CardContent className={cn("p-6 relative z-10 flex flex-col pointer-events-auto", isFullscreen ? "w-full max-w-2xl h-[500px]" : "h-full")}>

                {/* Header & Mode Switcher */}
                <div className="flex justify-between items-center mb-6">
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-[210px]">
                        <TabsList className="grid w-full grid-cols-2 bg-[#18181b] border border-white/[0.06]">
                            <TabsTrigger value="POMODORO" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100">
                                <Hourglass className="w-3 h-3 mr-1.5" /> {t('dashboard.focus.pomodoro')}
                            </TabsTrigger>
                            <TabsTrigger value="STOPWATCH" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100">
                                <Timer className="w-3 h-3 mr-1.5" /> {t('dashboard.focus.stopwatch')}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                        title={isFullscreen ? "Tam ekrandan çık (Esc)" : "Tam ekran"}
                    >
                        {isFullscreen ? (
                            <Minimize2 className="h-4 w-4" />
                        ) : (
                            <Maximize2 className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {/* Main Timer Display */}
                <div className="flex flex-col items-center justify-center flex-1 py-4">
                    <div className="relative">
                        <span className={`text-6xl font-bold tracking-tighter tabular-nums transition-colors duration-300 ${timer.isRunning
                            ? (activeTab === 'POMODORO' ? 'text-rose-400' : 'text-sky-400')
                            : 'text-zinc-100'
                            }`}>
                            {timer.displayTime}
                        </span>
                    </div>

                    <span className="text-sm font-medium text-zinc-400 mt-2">
                        {activeTab === 'POMODORO' ? (timer.isRunning ? t('dashboard.focus.modePomodoro') : t('dashboard.focus.statusReady')) : t('dashboard.focus.modeStopwatch')}
                    </span>
                </div>

                {/* Controls */}
                <div className="flex justify-center items-center gap-4 mt-6">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleReset}
                        className="h-10 w-10 rounded-full border-zinc-800 bg-[#18181b] text-zinc-300 hover:bg-zinc-800"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>

                    <Button
                        size="icon"
                        onClick={timer.toggle}
                        className={`h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 ${timer.isRunning
                            ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-950'
                            : (activeTab === 'POMODORO' ? 'bg-rose-500 hover:bg-rose-400 text-white' : 'bg-sky-500 hover:bg-sky-400 text-zinc-950')
                            }`}
                    >
                        {timer.isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-full border-zinc-800 bg-[#18181b] text-zinc-300 hover:bg-zinc-800"
                                title="Ayarlar"
                            >
                                <Settings2 className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-[#18181b] border-zinc-800 text-zinc-100 backdrop-blur-md">
                        <DropdownMenuLabel>{t('dashboard.focus.settingsTitle')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => changePomodoroDuration(15)}>
                            {t('dashboard.focus.preset15')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => changePomodoroDuration(25)}>
                            {t('dashboard.focus.preset25')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => changePomodoroDuration(45)}>
                            {t('dashboard.focus.preset45')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => changePomodoroDuration(60)}>
                            {t('dashboard.focus.preset60')}
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    );
}
