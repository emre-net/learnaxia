import { useSettingsStore } from "@/stores/settings-store";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
            }
        }
        if (audioCtx && audioCtx.state === "suspended") {
            audioCtx.resume().catch(() => {});
        }
        return audioCtx;
    } catch {
        return null;
    }
}

export function playStudySound(type: 'SUCCESS' | 'FAILURE') {
    const { soundEnabled } = useSettingsStore.getState();
    if (!soundEnabled) return;

    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        if (type === 'SUCCESS') {
            // Pleasant 2-note ascending chime (C5 -> E5)
            [523.25, 659.25].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now + i * 0.09);

                gain.gain.setValueAtTime(0.001, now + i * 0.09);
                gain.gain.exponentialRampToValueAtTime(0.2, now + i * 0.09 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.22);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now + i * 0.09);
                osc.stop(now + i * 0.09 + 0.25);
            });
        } else {
            // Soft descending gentle tone (E4 -> C4)
            [329.63, 261.63].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now + i * 0.1);

                gain.gain.setValueAtTime(0.001, now + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.15, now + i * 0.1 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now + i * 0.1);
                osc.stop(now + i * 0.1 + 0.23);
            });
        }
    } catch {
        // Silently ignore audio playback errors
    }
}
