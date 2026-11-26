import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView, StatusBar, StyleSheet } from 'react-native';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useAuth } from '../context/AuthContext';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { t, LoginSchema, RegisterSchema, extractApiErrorMessage } from '@learnaxia/shared';
import { useLanguage } from '@/hooks/use-language';
import api, { API_BASE_URL } from '@/lib/api';
import { GoogleIcon } from '@/components/ui/google-icon';

export default function LoginScreen() {
    const [name, setName] = useState('');
    const [handle, setHandle] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const { login, register, loginWithTokens } = useAuth();
    const { language: currentLang } = useLanguage();

    useEffect(() => {
        const handleDeepLink = async (url: string) => {
            if (url.includes('auth/callback')) {
                const parsed = Linking.parse(url);
                const accessToken = parsed.queryParams?.accessToken as string | undefined;
                const refreshToken = parsed.queryParams?.refreshToken as string | undefined;
                const error = parsed.queryParams?.error as string | undefined;

                if (error) {
                    Alert.alert(t('auth.errorTitle', currentLang), 'Google ile giriş başarısız: ' + error);
                    return;
                }

                if (accessToken) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    await loginWithTokens(accessToken, refreshToken);
                }
            }
        };

        const subscription = Linking.addEventListener('url', (event) => {
            handleDeepLink(event.url);
        });

        Linking.getInitialURL().then((initialUrl) => {
            if (initialUrl) handleDeepLink(initialUrl);
        });

        return () => subscription.remove();
    }, [loginWithTokens, currentLang]);

    const handleGoogleLogin = async () => {
        try {
            setGoogleLoading(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            WebBrowser.maybeCompleteAuthSession();

            const redirectUri = Linking.createURL('auth/callback');
            const webBaseUrl = API_BASE_URL.replace(/\/api\/?$/, '');
            const authUrl = `${webBaseUrl}/auth/mobile-google?redirect_uri=${encodeURIComponent(redirectUri)}`;

            const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

            if (result.type === 'success' && result.url) {
                const parsed = Linking.parse(result.url);
                const accessToken = parsed.queryParams?.accessToken as string | undefined;
                const refreshToken = parsed.queryParams?.refreshToken as string | undefined;
                const error = parsed.queryParams?.error as string | undefined;

                if (error) {
                    Alert.alert(t('auth.errorTitle', currentLang), 'Google ile giriş başarısız: ' + error);
                    return;
                }

                if (accessToken) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    await loginWithTokens(accessToken, refreshToken);
                }
            }
        } catch (err) {
            Alert.alert(t('auth.errorTitle', currentLang), extractApiErrorMessage(err, 'Google ile giriş sırasında bir hata oluştu.'));
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleSubmit = async () => {
        const trimmedEmail = email.trim();
        const trimmedName = name.trim();
        const trimmedHandle = handle.trim();

        if (isLogin) {
            const parsed = LoginSchema.safeParse({ email: trimmedEmail, password });
            if (!parsed.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert(t('auth.errorTitle', currentLang), parsed.error.issues[0].message);
                return;
            }
        } else {
            const parsed = RegisterSchema.safeParse({
                name: trimmedName || undefined,
                handle: trimmedHandle,
                email: trimmedEmail,
                password,
            });
            if (!parsed.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert(t('auth.errorTitle', currentLang), parsed.error.issues[0].message);
                return;
            }
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);
        try {
            if (isLogin) {
                await login(trimmedEmail, password);
            } else {
                await register(trimmedName || undefined, trimmedEmail, password, trimmedHandle);
            }
        } catch (error) {
            const fallback = isLogin
                ? t('auth.loginErrorMessage', currentLang)
                : t('auth.registerErrorMessage', currentLang);
            Alert.alert(t('auth.errorTitle', currentLang), extractApiErrorMessage(error, fallback));
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        Alert.alert(
            t('auth.forgotPasswordTitle', currentLang),
            t('auth.forgotPasswordPrompt', currentLang),
            [
                { text: t('auth.cancel', currentLang), style: 'cancel' },
                {
                    text: t('auth.send', currentLang),
                    onPress: async () => {
                        if (!email.trim()) {
                            Alert.alert(t('auth.errorTitle', currentLang), t('auth.enterEmailFirst', currentLang));
                            return;
                        }
                        setLoading(true);
                        try {
                            await api.post('/mobile/forgot-password', { email: email.trim() });
                            Alert.alert(
                                t('auth.passwordResetSent', currentLang),
                                `${email.trim()} adresine şifre sıfırlama bağlantısı gönderildi.`
                            );
                        } catch (err) {
                            Alert.alert(
                                t('auth.errorTitle', currentLang),
                                extractApiErrorMessage(err, t('auth.passwordResetError', currentLang))
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
            <StatusBar barStyle="light-content" backgroundColor="#09090B" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
                        <Text style={styles.brandText}>LEARNAXIA</Text>
                        <Text style={styles.title}>
                            {isLogin ? t('auth.loginTitle', currentLang) : t('auth.registerTitle', currentLang)}
                        </Text>
                        <Text style={styles.subtitle}>
                            {isLogin ? t('auth.loginSubtitle', currentLang) : t('auth.registerSubtitle', currentLang)}
                        </Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.formContainer}>
                        {!isLogin && (
                            <>
                                <View style={[styles.inputGroup, focusedInput === 'handle' && styles.inputGroupFocused]}>
                                    <Text style={styles.label}>
                                        {currentLang === 'tr' ? 'Kullanıcı Adı (@handle) *' : 'Username (@handle) *'}
                                    </Text>
                                    <View style={styles.handleInputRow}>
                                        <Text style={styles.atPrefix}>@</Text>
                                        <TextInput
                                            style={[styles.input, { flex: 1 }]}
                                            placeholder="emre_dev"
                                            placeholderTextColor="#52525B"
                                            value={handle}
                                            onChangeText={(text) => setHandle(text.replace(/[^a-zA-Z0-9_]/g, ''))}
                                            editable={!loading}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            onFocus={() => setFocusedInput('handle')}
                                            onBlur={() => setFocusedInput(null)}
                                        />
                                    </View>
                                </View>

                                <View style={[styles.inputGroup, focusedInput === 'name' && styles.inputGroupFocused]}>
                                    <Text style={styles.label}>
                                        {currentLang === 'tr' ? 'Ad / Görünen Ad (İsteğe Bağlı)' : 'Display Name (Optional)'}
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Emre Yılmaz"
                                        placeholderTextColor="#52525B"
                                        value={name}
                                        onChangeText={setName}
                                        editable={!loading}
                                        autoCapitalize="words"
                                        onFocus={() => setFocusedInput('name')}
                                        onBlur={() => setFocusedInput(null)}
                                    />
                                </View>
                            </>
                        )}

                        <View style={[styles.inputGroup, focusedInput === 'email' && styles.inputGroupFocused]}>
                            <Text style={styles.label}>{t('auth.emailPlaceholder', currentLang)}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="ornek@posta.com"
                                placeholderTextColor="#52525B"
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
                                <Text style={styles.label}>
                                    {t('auth.passwordPlaceholder', currentLang)}
                                    {!isLogin ? (currentLang === 'tr' ? ' (en az 8 karakter)' : ' (min 8 chars)') : ''}
                                </Text>
                                {isLogin && (
                                    <TouchableOpacity onPress={handleForgotPassword} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                        <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword', currentLang)}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor="#52525B"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                editable={!loading}
                                onFocus={() => setFocusedInput('password')}
                                onBlur={() => setFocusedInput(null)}
                            />
                        </View>

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

                        <View style={styles.socialContainer}>
                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>
                                    {t('auth.emailOr', currentLang) || 'veya'}
                                </Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={handleGoogleLogin}
                                disabled={loading || googleLoading}
                                style={[styles.socialButton, (loading || googleLoading) && styles.socialButtonDisabled]}
                            >
                                {googleLoading ? (
                                    <BrandLoader size={20} showBlur={false} />
                                ) : (
                                    <View style={styles.socialButtonContent}>
                                        <GoogleIcon size={19} />
                                        <Text style={styles.socialButtonText}>
                                            {t('auth.googleLogin', currentLang) || 'Google ile Devam Et'}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.footer}>
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
        backgroundColor: '#09090B',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 28,
        paddingTop: 56,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 40,
        marginTop: 12,
    },
    brandText: {
        color: '#38BDF8',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1.5,
        marginBottom: 14,
    },
    title: {
        color: '#F4F4F5',
        fontSize: 30,
        fontWeight: '700',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        color: '#A1A1AA',
        fontSize: 15,
        fontWeight: '400',
    },
    formContainer: {
        gap: 20,
    },
    inputGroup: {
        backgroundColor: '#121215',
        borderWidth: 1,
        borderColor: '#27272A',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    inputGroupFocused: {
        borderColor: '#38BDF8',
    },
    handleInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    atPrefix: {
        color: '#38BDF8',
        fontSize: 16,
        fontWeight: '700',
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    label: {
        color: '#A1A1AA',
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 6,
    },
    forgotPasswordText: {
        color: '#38BDF8',
        fontSize: 12,
        fontWeight: '600',
    },
    input: {
        color: '#F4F4F5',
        fontSize: 15,
        minHeight: 28,
        padding: 0,
    },
    submitButton: {
        backgroundColor: '#38BDF8',
        height: 54,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#09090B',
        fontSize: 15,
        fontWeight: '700',
    },
    socialContainer: {
        marginTop: 8,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#27272A',
    },
    dividerText: {
        color: '#71717A',
        fontSize: 12,
        paddingHorizontal: 14,
        fontWeight: '500',
    },
    socialButton: {
        backgroundColor: '#121215',
        borderWidth: 1,
        borderColor: '#27272A',
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    socialButtonDisabled: {
        opacity: 0.7,
    },
    socialButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    socialButtonText: {
        color: '#F4F4F5',
        fontSize: 15,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 28,
        gap: 6,
    },
    footerText: {
        color: '#71717A',
        fontSize: 14,
    },
    footerAction: {
        paddingVertical: 4,
        paddingHorizontal: 6,
    },
    footerActionText: {
        color: '#38BDF8',
        fontSize: 14,
        fontWeight: '700',
    },
});
