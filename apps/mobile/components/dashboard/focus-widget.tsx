import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, SafeAreaView, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { t } from '@learnaxia/shared';
import { LinearGradient } from 'expo-linear-gradient';

const currentLang = 'tr'; // Default to Turkish for now

export function FocusWidget() {
    const [activeTab, setActiveTab] = useState<'POMODORO' | 'STOPWATCH'>('POMODORO');
    const [isRunning, setIsRunning] = useState(false);
    const [pomodoroDuration, setPomodoroDuration] = useState(25 * 60);
    const [seconds, setSeconds] = useState(pomodoroDuration);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isRunning) {
            interval = setInterval(() => {
                setSeconds((s) => {
                    if (activeTab === 'POMODORO') {
                        if (s <= 1) {
                            setIsRunning(false);
                            return 0;
                        }
                        return s - 1;
                    } else {
                        return s + 1;
                    }
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, activeTab]);

    const handleTabChange = (mode: 'POMODORO' | 'STOPWATCH') => {
        setActiveTab(mode);
        setIsRunning(false);
        setSeconds(mode === 'POMODORO' ? pomodoroDuration : 0);
    };

    const handleReset = () => {
        setIsRunning(false);
        setSeconds(activeTab === 'POMODORO' ? pomodoroDuration : 0);
    };

    const changePomodoroDuration = (mins: number) => {
        const secs = mins * 60;
        setPomodoroDuration(secs);
        if (activeTab === 'POMODORO') {
            setIsRunning(false);
            setSeconds(secs);
        }
        setShowSettings(false);
    };

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const bgColors = activeTab === 'POMODORO'
        ? (isRunning ? ['rgba(225, 29, 72, 0.2)', 'transparent'] : ['rgba(249, 115, 22, 0.2)', 'transparent'])
        : (isRunning ? ['rgba(59, 130, 246, 0.2)', 'transparent'] : ['rgba(100, 116, 139, 0.2)', 'transparent']);

    return (
        <View className="relative overflow-hidden rounded-3xl border border-slate-700 w-full" style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}>
            <LinearGradient
                colors={bgColors as any}
                className="absolute -top-10 -right-10 w-48 h-48 rounded-full"
            />

            <View className="p-6 z-10">
                {/* Header & Mode Switcher */}
                <View className="flex-row justify-between items-center mb-6">
                    <View className="flex-row bg-slate-800/80 rounded-lg p-1 w-full max-w-[200px]">
                        <TouchableOpacity
                            onPress={() => handleTabChange('POMODORO')}
                            className={`flex-1 py-1.5 items-center rounded-md ${activeTab === 'POMODORO' ? 'bg-slate-700' : ''}`}
                        >
                            <Text className="text-white text-[10px] font-bold uppercase tracking-wider">
                                <MaterialIcons name="hourglass-top" size={10} color="white" /> {t('dashboard.focus.pomodoro', currentLang)}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleTabChange('STOPWATCH')}
                            className={`flex-1 py-1.5 items-center rounded-md ${activeTab === 'STOPWATCH' ? 'bg-slate-700' : ''}`}
                        >
                            <Text className="text-white text-[10px] font-bold uppercase tracking-wider">
                                <MaterialIcons name="timer" size={10} color="white" /> {t('dashboard.focus.stopwatch', currentLang)}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => setIsFullscreen(true)}>
                        <MaterialIcons name="fullscreen" size={24} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                {/* Main Timer Display */}
                <View className="items-center justify-center py-4">
                    <Text className={`text-6xl font-black tracking-tighter tabular-nums ${isRunning
                        ? (activeTab === 'POMODORO' ? 'text-rose-400' : 'text-blue-400')
                        : 'text-slate-100'
                        }`}>
                        {formatTime(seconds)}
                    </Text>
                    <Text className="text-sm font-medium text-slate-400 mt-2">
                        {activeTab === 'POMODORO' ? (isRunning ? t('dashboard.focus.modePomodoro', currentLang) : t('dashboard.focus.statusReady', currentLang)) : t('dashboard.focus.modeStopwatch', currentLang)}
                    </Text>
                </View>

                {/* Controls */}
                <View className="flex-row justify-center items-center gap-6 mt-4">
                    <TouchableOpacity
                        onPress={handleReset}
                        className="w-12 h-12 rounded-full border border-slate-600 items-center justify-center bg-slate-800 hover:bg-slate-700"
                    >
                        <MaterialIcons name="refresh" size={22} color="#D1D5DB" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setIsRunning(!isRunning)}
                        className={`w-16 h-16 rounded-full items-center justify-center shadow-lg ${isRunning
                            ? 'bg-slate-100'
                            : (activeTab === 'POMODORO' ? 'bg-rose-600' : 'bg-blue-600')
                            }`}
                    >
                        <MaterialIcons
                            name={isRunning ? "pause" : "play-arrow"}
                            size={32}
                            color={isRunning ? "#0f172a" : "#ffffff"}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setShowSettings(true)}
                        className="w-12 h-12 rounded-full border border-slate-600 items-center justify-center bg-slate-800 hover:bg-slate-700"
                    >
                        <MaterialIcons name="tune" size={22} color="#D1D5DB" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Settings Actions Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showSettings}
                onRequestClose={() => setShowSettings(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}
                    activeOpacity={1}
                    onPressOut={() => setShowSettings(false)}
                >
                    <View className="bg-slate-800 rounded-2xl p-6 w-[80%] border border-slate-700">
                        <Text className="text-white text-lg font-bold mb-4 text-center">{t('dashboard.focus.settingsTitle', currentLang)}</Text>
                        <TouchableOpacity className="py-3 border-b border-slate-700" onPress={() => changePomodoroDuration(15)}>
                            <Text className="text-slate-300 text-center text-base">{t('dashboard.focus.preset15', currentLang)}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="py-3 border-b border-slate-700" onPress={() => changePomodoroDuration(25)}>
                            <Text className="text-slate-300 text-center text-base">{t('dashboard.focus.preset25', currentLang)}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="py-3 border-b border-slate-700" onPress={() => changePomodoroDuration(45)}>
                            <Text className="text-slate-300 text-center text-base">{t('dashboard.focus.preset45', currentLang)}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="py-3 pb-1" onPress={() => changePomodoroDuration(60)}>
                            <Text className="text-slate-300 text-center text-base">{t('dashboard.focus.preset60', currentLang)}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Fullscreen Timer Modal */}
            <Modal
                animationType="slide"
                transparent={false}
                visible={isFullscreen}
                onRequestClose={() => setIsFullscreen(false)}
            >
                <SafeAreaView className="flex-1 bg-slate-950">
                    <View className="flex-1 items-center justify-center px-8">
                        <TouchableOpacity
                            className="absolute top-12 right-6 p-2 rounded-full bg-slate-800"
                            onPress={() => setIsFullscreen(false)}
                        >
                            <MaterialIcons name="close" size={28} color="#94A3B8" />
                        </TouchableOpacity>

                        <Text className="text-slate-400 text-lg font-medium mb-10 uppercase tracking-widest">
                            {activeTab === 'POMODORO' ? t('dashboard.focus.modePomodoro', currentLang) : t('dashboard.focus.modeStopwatch', currentLang)}
                        </Text>

                        <Text className={`font-black tracking-tighter tabular-nums ${isRunning
                            ? (activeTab === 'POMODORO' ? 'text-rose-400' : 'text-blue-400')
                            : 'text-slate-100'
                            }`}
                            style={{ fontSize: Dimensions.get('window').width * 0.25 }}
                        >
                            {formatTime(seconds)}
                        </Text>

                        <View className="flex-row justify-center items-center gap-8 mt-16">
                            <TouchableOpacity
                                onPress={handleReset}
                                className="w-16 h-16 rounded-full border border-slate-700 items-center justify-center bg-slate-800"
                            >
                                <MaterialIcons name="refresh" size={28} color="#D1D5DB" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setIsRunning(!isRunning)}
                                className={`w-24 h-24 rounded-full items-center justify-center shadow-lg ${isRunning
                                    ? 'bg-slate-100'
                                    : (activeTab === 'POMODORO' ? 'bg-rose-600' : 'bg-blue-600')
                                    }`}
                            >
                                <MaterialIcons
                                    name={isRunning ? "pause" : "play-arrow"}
                                    size={48}
                                    color={isRunning ? "#0f172a" : "#ffffff"}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setShowSettings(true)}
                                className="w-16 h-16 rounded-full border border-slate-700 items-center justify-center bg-slate-800"
                            >
                                <MaterialIcons name="tune" size={28} color="#D1D5DB" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </Modal>
        </View>
    );
}
