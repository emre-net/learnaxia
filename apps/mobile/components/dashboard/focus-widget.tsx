import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions, StyleSheet } from 'react-native';
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

    // Ambient glow colors matching web
    const glowColor = activeTab === 'POMODORO'
        ? (isRunning ? 'rgba(225, 29, 72, 0.2)' : 'rgba(249, 115, 22, 0.2)') // rose / orange
        : (isRunning ? 'rgba(59, 130, 246, 0.2)' : 'rgba(100, 116, 139, 0.2)'); // blue / slate

    return (
        <View style={styles.container}>
            {/* Ambient Background Glow matching web */}
            <View style={[styles.ambientGlow, { backgroundColor: glowColor }]} />

            <View style={styles.content}>
                {/* Header & Mode Switcher */}
                <View style={styles.header}>
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            onPress={() => handleTabChange('POMODORO')}
                            style={[styles.tabButton, activeTab === 'POMODORO' && styles.tabButtonActive]}
                        >
                            <MaterialIcons name="hourglass-top" size={14} color={activeTab === 'POMODORO' ? '#F8FAFC' : '#64748B'} style={{ marginRight: 4 }} />
                            <Text style={[styles.tabText, { color: activeTab === 'POMODORO' ? '#F8FAFC' : '#64748B' }]}>
                                {t('dashboard.focus.pomodoro', currentLang)}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleTabChange('STOPWATCH')}
                            style={[styles.tabButton, activeTab === 'STOPWATCH' && styles.tabButtonActive]}
                        >
                            <MaterialIcons name="timer" size={14} color={activeTab === 'STOPWATCH' ? '#F8FAFC' : '#64748B'} style={{ marginRight: 4 }} />
                            <Text style={[styles.tabText, { color: activeTab === 'STOPWATCH' ? '#F8FAFC' : '#64748B' }]}>
                                {t('dashboard.focus.stopwatch', currentLang)}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => setIsFullscreen(true)} style={styles.iconButtonSmall}>
                        <MaterialIcons name="fullscreen" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                {/* Main Timer Display */}
                <View style={styles.timerDisplay}>
                    <Text 
                        style={[
                            styles.timeText, 
                            { color: isRunning ? (activeTab === 'POMODORO' ? '#FB7185' : '#60A5FA') : '#F8FAFC' }
                        ]}
                    >
                        {formatTime(seconds)}
                    </Text>
                    <Text style={styles.timerSubtitle}>
                        {activeTab === 'POMODORO' ? (isRunning ? t('dashboard.focus.modePomodoro', currentLang) : t('dashboard.focus.statusReady', currentLang)) : t('dashboard.focus.modeStopwatch', currentLang)}
                    </Text>
                </View>

                {/* Controls */}
                <View style={styles.controlsRow}>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={handleReset}
                        style={styles.circleButtonSmall}
                    >
                        <MaterialIcons name="refresh" size={20} color="#94A3B8" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setIsRunning(!isRunning)}
                        style={[
                            styles.playButton,
                            isRunning ? styles.playButtonActive : (activeTab === 'POMODORO' ? styles.playButtonPomodoro : styles.playButtonStopwatch),
                            isRunning && styles.playButtonShadowActive
                        ]}
                    >
                        <MaterialIcons
                            name={isRunning ? "pause" : "play-arrow"}
                            size={28}
                            color={isRunning ? "#0F172A" : "#FFFFFF"}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setShowSettings(true)}
                        style={styles.circleButtonSmall}
                    >
                        <MaterialIcons name="tune" size={20} color="#94A3B8" />
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
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPressOut={() => setShowSettings(false)}
                >
                    <View style={styles.settingsModal}>
                        <Text style={styles.settingsTitle}>{t('dashboard.focus.settingsTitle', currentLang)}</Text>
                        {[15, 25, 45, 60].map((mins) => (
                            <TouchableOpacity key={mins} style={styles.settingsItem} onPress={() => changePomodoroDuration(mins)}>
                                <Text style={styles.settingsItemText}>{mins} DAKİKA</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.settingsCloseBtn} onPress={() => setShowSettings(false)}>
                            <Text style={styles.settingsCloseText}>KAPAT</Text>
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
                <View style={styles.fullscreenContainer}>
                    <View style={styles.fullscreenContent}>
                        <TouchableOpacity
                            style={styles.fullscreenCloseBtn}
                            onPress={() => setIsFullscreen(false)}
                        >
                            <MaterialIcons name="close" size={28} color="#94A3B8" />
                        </TouchableOpacity>

                        <Text style={styles.fullscreenSubtitle}>
                            {activeTab === 'POMODORO' ? t('dashboard.focus.modePomodoro', currentLang) : t('dashboard.focus.modeStopwatch', currentLang)}
                        </Text>

                        <Text 
                            style={[
                                styles.fullscreenTime, 
                                { fontSize: Dimensions.get('window').width * 0.25 },
                                isRunning ? (activeTab === 'POMODORO' ? { color: '#FB7185' } : { color: '#60A5FA' }) : { color: '#F1F5F9' }
                            ]}
                        >
                            {formatTime(seconds)}
                        </Text>

                        <View style={styles.fullscreenControls}>
                            <TouchableOpacity onPress={handleReset} style={styles.fullscreenIconBtn}>
                                <MaterialIcons name="refresh" size={28} color="#D1D5DB" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setIsRunning(!isRunning)}
                                style={[
                                    styles.fullscreenPlayBtn,
                                    isRunning ? styles.playButtonActive : (activeTab === 'POMODORO' ? styles.playButtonPomodoro : styles.playButtonStopwatch)
                                ]}
                            >
                                <MaterialIcons
                                    name={isRunning ? "pause" : "play-arrow"}
                                    size={48}
                                    color={isRunning ? "#0f172a" : "#ffffff"}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.fullscreenIconBtn}>
                                <MaterialIcons name="tune" size={28} color="#D1D5DB" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  ambientGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.8,
  },
  content: {
    padding: 24,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // pure black inside
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabButton: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  timeText: {
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  timerSubtitle: {
    color: '#64748B', // slate-500
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  circleButtonSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  playButtonActive: {
    backgroundColor: '#F8FAFC',
  },
  playButtonPomodoro: {
    backgroundColor: '#E11D48',
  },
  playButtonStopwatch: {
    backgroundColor: '#2563EB',
  },
  playButtonShadowActive: {
    shadowColor: '#fff',
    shadowOpacity: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsModal: {
    backgroundColor: '#050505',
    borderRadius: 24,
    padding: 24,
    width: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  settingsTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  settingsItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingsItemText: {
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsCloseBtn: {
    marginTop: 16,
    paddingVertical: 12,
  },
  settingsCloseText: {
    color: '#60A5FA',
    textAlign: 'center',
    fontWeight: '700',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000', // Pure black
  },
  fullscreenContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  fullscreenCloseBtn: {
    position: 'absolute',
    top: 48,
    right: 24,
    padding: 8,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  fullscreenSubtitle: {
    color: '#94A3B8', // slate-400
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 40,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  fullscreenTime: {
    fontWeight: '900',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  fullscreenControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    marginTop: 64,
  },
  fullscreenIconBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  fullscreenPlayBtn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
});
