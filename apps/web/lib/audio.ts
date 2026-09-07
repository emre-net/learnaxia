import { useSettingsStore } from "@/stores/settings-store";

const SOUND_URLS = {
    SUCCESS: "/sounds/success.ogg",
    FAILURE: "/sounds/failure.ogg",
};

export function playStudySound(type: 'SUCCESS' | 'FAILURE') {
    const { soundEnabled } = useSettingsStore.getState();

    if (!soundEnabled) return;

    const audio = new Audio(SOUND_URLS[type]);
    audio.volume = 0.5;
    audio.play().catch(err => console.error("Audio play failed:", err));
}
