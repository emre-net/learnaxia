"use client";

import { useState } from "react";
import { Play, Pause, RotateCcw, Timer, Hourglass, Settings2, Maximize2 } from "lucide-react";
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
            "relative overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-white/10 transition-all duration-500 group",
            isFullscreen
                ? "fixed inset-0 z-[100] m-0 rounded-none w-screen h-screen flex flex-col justify-center items-center shadow-none bg-white/90 dark:bg-slate-950/90"
                : "w-full shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]"
        )}>

            {/* Ambient Background Glow */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-1000 ${activeTab === 'POMODORO'
                    ? (timer.isRunning ? 'bg-rose-500' : 'bg-orange-500')
                    : (timer.isRunning ? 'bg-blue-500' : 'bg-slate-500')
                }`} />

            <CardContent className={cn("p-6 relative z-10 flex flex-col pointer-events-auto", isFullscreen ? "w-full max-w-2xl h-[500px]" : "h-full")}>

                {/* Header & Mode Switcher */}
                <div className="flex justify-between items-center mb-6">
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full max-w-[200px]">
                        <TabsList className="grid w-full grid-cols-2 bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-md">
                            <TabsTrigger value="POMODORO" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                                <Hourglass className="w-3 h-3 mr-1.5" /> {t('dashboard.focus.pomodoro')}
                            </TabsTrigger>
                            <TabsTrigger value="STOPWATCH" className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                                <Timer className="w-3 h-3 mr-1.5" /> {t('dashboard.focus.stopwatch')}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <Maximize2 className="h-4 w-4" />
                    </Button>
                </div>

                {/* Main Timer Display */}
                <div className="flex flex-col items-center justify-center flex-1 py-4">
                    <div className="relative">
                        <span className={`text-6xl font-black tracking-tighter tabular-nums transition-colors duration-500 ${timer.isRunning
                            ? (activeTab === 'POMODORO' ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400')
                            : 'text-slate-800 dark:text-slate-100'
                            }`}>
                            {timer.displayTime}
                        </span>

                        {/* Status Dots */}
                        <div className="absolute -right-4 top-2 h-2 w-2 rounded-full hidden" />
                    </div>

                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
                        {activeTab === 'POMODORO' ? (timer.isRunning ? t('dashboard.focus.modePomodoro') : t('dashboard.focus.statusReady')) : t('dashboard.focus.modeStopwatch')}
                    </span>
                </div>

                {/* Controls */}
                <div className="flex justify-center items-center gap-4 mt-6">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleReset}
                        className="h-10 w-10 rounded-full border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>

                    <Button
                        size="icon"
                        onClick={timer.toggle}
                        className={`h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 ${timer.isRunning
                            ? 'bg-slate-800 hover:bg-slate-900 text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900'
                            : (activeTab === 'POMODORO' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700')
                            } text-white`}
                    >
                        {timer.isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-full border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Ayarlar"
                            >
                                <Settings2 className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
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
