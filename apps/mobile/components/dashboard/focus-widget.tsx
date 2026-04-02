import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Screen } from '@/components/ui/screen';
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
        <View 
            className="relative overflow-hidden rounded-[32px] border border-ocean-border w-full bg-ocean-panel"
            style={{ 
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20
            }}
        >
            <LinearGradient
                colors={bgColors as any}
                style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: 120, opacity: 0.5 }}
            />

            <View className="p-6 z-10">
                {/* Header & Mode Switcher */}
                <View className="flex-row justify-between items-center mb-6">
                    <View 
                        className="flex-row rounded-2xl p-1.5 w-full max-w-[220px]"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    >
                        <TouchableOpacity
                            onPress={() => handleTabChange('POMODORO')}
                            className={`flex-1 py-2 items-center rounded-xl ${activeTab === 'POMODORO' ? 'bg-blue-600/20' : ''}`}
                        >
                            <Text 
                                style={{ color: activeTab === 'POMODORO' ? '#60A5FA' : 'rgba(255, 255, 255, 0.3)' }}
                                className="text-[10px] font-black uppercase tracking-widest"
                            >
                                <MaterialIcons name="hourglass-top" size={12} color={activeTab === 'POMODORO' ? '#60A5FA' : 'rgba(255,255,255,0.2)'} /> {t('dashboard.focus.pomodoro', currentLang)}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleTabChange('STOPWATCH')}
                            className={`flex-1 py-2 items-center rounded-xl ${activeTab === 'STOPWATCH' ? 'bg-blue-600/20' : ''}`}
                        >
                            <Text 
                                style={{ color: activeTab === 'STOPWATCH' ? '#60A5FA' : 'rgba(255, 255, 255, 0.3)' }}
                                className="text-[10px] font-black uppercase tracking-widest"
                            >
                                <MaterialIcons name="timer" size={12} color={activeTab === 'STOPWATCH' ? '#60A5FA' : 'rgba(255,255,255,0.2)'} /> {t('dashboard.focus.stopwatch', currentLang)}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity 
                        onPress={() => setIsFullscreen(true)} 
                        className="w-10 h-10 rounded-xl items-center justify-center border"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.05)' }}
                    >
                        <MaterialIcons name="fullscreen" size={20} color="rgba(255,255,255,0.3)" />
                    </TouchableOpacity>
                </View>

                {/* Main Timer Display */}
                <View className="items-center justify-center py-4">
                    <Text 
                        className="text-7xl font-black tracking-tighter tabular-nums"
                        style={{ color: isRunning ? (activeTab === 'POMODORO' ? '#FB7185' : '#60A5FA') : 'rgba(255, 255, 255, 0.8)' }}
                    >
                        {formatTime(seconds)}
                    </Text>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.2)' }} className="text-xs font-black mt-2 uppercase tracking-[4px]">
                        {activeTab === 'POMODORO' ? (isRunning ? t('dashboard.focus.modePomodoro', currentLang) : t('dashboard.focus.statusReady', currentLang)) : t('dashboard.focus.modeStopwatch', currentLang)}
                    </Text>
                </View>

                {/* Controls */}
                <View className="flex-row justify-center items-center gap-6 mt-4">
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={handleReset}
                        className="w-14 h-14 rounded-2xl border items-center justify-center"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.05)' }}
                    >
                        <MaterialIcons name="refresh" size={24} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setIsRunning(!isRunning)}
                        className={`w-20 h-20 rounded-3xl items-center justify-center ${isRunning
                            ? 'bg-white'
                            : (activeTab === 'POMODORO' ? 'bg-rose-600' : 'bg-blue-600')
                            }`}
                        style={{ 
                          elevation: 10,
                          shadowColor: isRunning ? '#fff' : '#000',
                          shadowOffset: { width: 0, height: 10 },
                          shadowOpacity: 0.3,
                          shadowRadius: 20
                        }}
                    >
                        <MaterialIcons
                            name={isRunning ? "pause" : "play-arrow"}
                            size={40}
                            color={isRunning ? "#050B18" : "#ffffff"}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setShowSettings(true)}
                        className="w-14 h-14 rounded-2xl border items-center justify-center"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.05)' }}
                    >
                        <MaterialIcons name="tune" size={24} color="rgba(255,255,255,0.4)" />
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
                    style={{ flex: 1, backgroundColor: 'rgba(5, 11, 24, 0.9)' }}
                    activeOpacity={1}
                    onPressOut={() => setShowSettings(false)}
                >
                    <View 
                        className="bg-ocean-panel rounded-[32px] p-8 w-[85%] border border-ocean-border"
                        style={{ 
                          elevation: 12,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 15 },
                          shadowOpacity: 0.4,
                          shadowRadius: 30
                        }}
                    >
                        <Text className="text-white text-xl font-black mb-6 text-center tracking-tight">{t('dashboard.focus.settingsTitle', currentLang)}</Text>
                        {[15, 25, 45, 60].map((mins) => (
                            <TouchableOpacity key={mins} className="py-4 border-b border-white/5" onPress={() => changePomodoroDuration(mins)}>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }} className="text-center text-base font-bold">{mins} DAKİKA</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity className="mt-4 py-2" onPress={() => setShowSettings(false)}>
                            <Text className="text-blue-400 text-center font-black uppercase tracking-widest">KAPAT</Text>
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
                <Screen className="bg-slate-950">
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
                </Screen>
            </Modal>
        </View>
    );
}
