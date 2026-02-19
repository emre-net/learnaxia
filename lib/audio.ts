import { useSettingsStore } from "@/stores/settings-store";

const SOUND_URLS = {
    SUCCESS: "https://www.soundjay.com/buttons/sounds/button-37.mp3",
    FAILURE: "https://www.soundjay.com/buttons/sounds/button-10.mp3",
};

export function playStudySound(type: 'SUCCESS' | 'FAILURE') {
    const { soundEnabled } = useSettingsStore.getState();

    if (!soundEnabled) return;

    const audio = new Audio(SOUND_URLS[type]);
    audio.volume = 0.5;
    audio.play().catch(err => console.error("Audio play failed:", err));
}
