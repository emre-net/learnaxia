import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView, StatusBar, StyleSheet } from 'react-native';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useAuth } from '../context/AuthContext';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { t, MobileLoginSchema, MobileRegisterSchema } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';
import api from '@/lib/api';

export default function LoginScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const { login, register } = useAuth();
    const { language: currentLang } = useLanguage();

    const handleSubmit = async () => {
        const formData = isLogin
            ? { email: email.trim(), password: password.trim() }
            : { name: name.trim(), email: email.trim(), password: password.trim() };

        const schema = isLogin ? MobileLoginSchema : MobileRegisterSchema;
        const result = schema.safeParse(formData);

        if (!result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const firstError = result.error.issues[0].message;
            Alert.alert(t('auth.error', currentLang), firstError);
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);
        try {
            if (isLogin) {
                await login(formData.email, formData.password);
            } else {
                await register(formData.name!, formData.email, formData.password);
            }
        } catch (error) {
            let message = isLogin
                ? t('auth.loginErrorMessage', currentLang)
                : t('auth.registerErrorMessage', currentLang);

            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { message?: string } } };
                message = axiosError.response?.data?.message || message;
            }
            Alert.alert(t('auth.errorTitle', currentLang), message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        Alert.alert(
            'Şifre Sıfırlama',
            'Kayıtlı e-posta adresinize şifre sıfırlama bağlantısı göndermek ister misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Gönder',
                    onPress: async () => {
                        if (!email.trim()) {
                            Alert.alert('Hata', 'Lütfen önce e-posta adresinizi girin.');
                            return;
                        }
                        setLoading(true);
                        try {
                            await api.post('/mobile/forgot-password', { email: email.trim() });
                            Alert.alert(
                                'Gönderildi ✓',
                                `${email.trim()} adresine şifre sıfırlama bağlantısı gönderildi. Lütfen gelen kutunuzu kontrol edin.`
                            );
                        } catch (err: any) {
                            Alert.alert(
                                'Hata',
                                err?.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.'
                            );
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Minimalist Premium Header */}
                    <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
                        <Text style={styles.brandText}>LEARNAXIA</Text>
                        <Text style={styles.title}>
                            {isLogin ? t('auth.loginTitle', currentLang) : t('auth.registerTitle', currentLang)}
                        </Text>
                        <Text style={styles.subtitle}>
                            {isLogin 
                                ? "Lütfen hesabınıza giriş yapın." 
                                : "Aramıza katılmak için bilgilerinizi girin."}
                        </Text>
                    </Animated.View>

                    {/* Clean Form */}
                    <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.formContainer}>
                        {!isLogin && (
                            <View style={[styles.inputGroup, focusedInput === 'name' && styles.inputGroupFocused]}>
                                <Text style={styles.label}>{t('auth.fullNamePlaceholder', currentLang)}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="John Doe"
                                    placeholderTextColor="#475569"
                                    value={name}
                                    onChangeText={setName}
                                    editable={!loading}
                                    onFocus={() => setFocusedInput('name')}
                                    onBlur={() => setFocusedInput(null)}
                                />
                            </View>
                        )}

                        <View style={[styles.inputGroup, focusedInput === 'email' && styles.inputGroupFocused]}>
                            <Text style={styles.label}>{t('auth.emailPlaceholder', currentLang)}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="ornek@posta.com"
                                placeholderTextColor="#475569"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                editable={!loading}
                                onFocus={() => setFocusedInput('email')}
                                onBlur={() => setFocusedInput(null)}
                            />
                        </View>

                        <View style={[styles.inputGroup, focusedInput === 'password' && styles.inputGroupFocused]}>
                            <View style={styles.labelRow}>
                                <Text style={styles.label}>{t('auth.passwordPlaceholder', currentLang)}</Text>
                                {isLogin && (
                                    <TouchableOpacity onPress={handleForgotPassword} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                        <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword', currentLang)}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor="#475569"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                editable={!loading}
                                onFocus={() => setFocusedInput('password')}
                                onBlur={() => setFocusedInput(null)}
                            />
                        </View>

                        {/* Premium Solid Button */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleSubmit}
                            disabled={loading}
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        >
                            {loading ? (
                                <BrandLoader size={20} showBlur={false} />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {isLogin ? t('auth.loginButton', currentLang) : t('auth.createButton', currentLang)}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Social Sign in - Minimal */}
                        <View style={styles.socialContainer}>
                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>VEYA</Text>
                                <View style={styles.dividerLine} />
                            </View>
                            
                            <TouchableOpacity style={styles.socialButton} disabled={true}>
                                <Text style={styles.socialButtonText}>{t('auth.googleLogin', currentLang)}</Text>
                                <View style={styles.soonBadge}>
                                    <Text style={styles.soonText}>YAKINDA</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                    </Animated.View>

                    {/* Footer */}
                    <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.footer}>
                        <Text style={styles.footerText}>
                            {isLogin ? t('auth.noAccount', currentLang) : t('auth.alreadyHaveAccount', currentLang)}
                        </Text>
                        <TouchableOpacity 
                            onPress={() => {
                                Haptics.selectionAsync();
                                setIsLogin(!isLogin);
                            }} 
                            style={styles.footerAction}
                        >
                            <Text style={styles.footerActionText}>
                                {isLogin ? t('auth.signUp', currentLang) : t('auth.loginAction', currentLang)}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000', // Pure Black minimalism
    },
    keyboardView: {
        flex: 1
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 28,
        paddingTop: 60,
        paddingBottom: 40
    },
    header: {
        marginBottom: 48,
        marginTop: 20
    },
    brandText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 2,
        marginBottom: 16,
        opacity: 0.8
    },
    title: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: '600',
        letterSpacing: -0.5,
        marginBottom: 8
    },
    subtitle: {
        color: '#94A3B8',
        fontSize: 15,
        fontWeight: '400'
    },
    formContainer: {
        gap: 24,
    },
    inputGroup: {
        borderBottomWidth: 1,
        borderBottomColor: '#262626',
        paddingBottom: 8,
        transition: 'border-color 0.2s'
    },
    inputGroupFocused: {
        borderBottomColor: '#2563EB', // Tech Blue accent when focused
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    label: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 8
    },
    forgotPasswordText: {
        color: '#2563EB',
        fontSize: 13,
        fontWeight: '600'
    },
    input: {
        color: '#FFFFFF',
        fontSize: 16,
        height: 32,
        padding: 0
    },
    submitButton: {
        backgroundColor: '#2563EB', // Tech Blue
        height: 56,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8
    },
    submitButtonDisabled: {
        opacity: 0.7
    },
    submitButtonText: {
        color: '#FFFFFF', // White text on blue
        fontSize: 16,
        fontWeight: '700'
    },
    socialContainer: {
        marginTop: 16
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#1E293B'
    },
    dividerText: {
        color: '#64748B',
        fontSize: 12,
        paddingHorizontal: 16,
        fontWeight: '500'
    },
    socialButton: {
        height: 56,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#1E293B',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent'
    },
    socialButtonText: {
        color: '#F8FAFC',
        fontSize: 15,
        fontWeight: '500'
    },
    soonBadge: {
        marginLeft: 8,
        backgroundColor: '#1E293B',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6
    },
    soonText: {
        color: '#94A3B8',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 48,
        gap: 6
    },
    footerText: {
        color: '#94A3B8',
        fontSize: 14
    },
    footerAction: {
        paddingVertical: 8
    },
    footerActionText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600'
    }
});
