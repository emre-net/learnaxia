import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettingsStore } from '@/stores/settings-store';

export type TimerMode = 'COUNTDOWN' | 'STOPWATCH';

interface UseTimerProps {
    initialMode?: TimerMode;
    initialSeconds?: number;
    onExpire?: () => void;
}

export function useTimer({
    initialMode = 'COUNTDOWN',
    initialSeconds = 25 * 60, // Default Pomodoro 25 min
    onExpire
}: UseTimerProps = {}) {
    const [mode, setMode] = useState<TimerMode>(initialMode);
    const [seconds, setSeconds] = useState(initialSeconds);
    const [isRunning, setIsRunning] = useState(false);

    // We use refs to avoid dependency staleness inside setInterval closures
    const modeRef = useRef(mode);
    const setSecondsRef = useRef(setSeconds);
    const isRunningRef = useRef(isRunning);
    const secondsRef = useRef(seconds);

    // Sync refs
    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
    useEffect(() => { secondsRef.current = seconds; }, [seconds]);

    const playSound = useSettingsStore(state => state.soundEnabled);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isRunning) {
            interval = setInterval(() => {
                if (modeRef.current === 'COUNTDOWN') {
                    if (secondsRef.current > 0) {
                        setSeconds(s => s - 1);
                    } else {
                        // Timer expired
                        setIsRunning(false);
                        if (interval) clearInterval(interval);

                        if (playSound) {
                            try {
                                const audio = new Audio('/sounds/bell.mp3'); // We'll assume a generic bell sound if it exists, or just browser beep fallback later.
                                audio.volume = 0.5;
                                audio.play().catch(() => { }); // Catch if user hasn't interacted
                            } catch (e) { }
                        }

                        if (onExpire) setTimeout(onExpire, 0);
                    }
                } else if (modeRef.current === 'STOPWATCH') {
                    setSeconds(s => s + 1);
                }
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, onExpire, playSound]);

    const start = useCallback(() => setIsRunning(true), []);
    const pause = useCallback(() => setIsRunning(false), []);

    const reset = useCallback((newSeconds?: number, newMode?: TimerMode) => {
        setIsRunning(false);
        if (newMode) setMode(newMode);

        if (newSeconds !== undefined) {
            setSeconds(newSeconds);
        } else {
            // Revert back to defaults if no override
            setSeconds(newMode === 'STOPWATCH' ? 0 : 25 * 60);
        }
    }, []);

    const toggle = useCallback(() => setIsRunning(prev => !prev), []);

    // Formatting helpers
    const formattedMinutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const formattedSeconds = (seconds % 60).toString().padStart(2, '0');
    const displayTime = `${formattedMinutes}:${formattedSeconds}`;

    return {
        mode,
        seconds,
        displayTime,
        isRunning,
        start,
        pause,
        reset,
        toggle,
        setMode
    };
}
