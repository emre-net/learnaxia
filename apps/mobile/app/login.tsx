import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { t, Language } from '@learnaxia/shared';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    // Assuming we want a way to toggle to register UI if it is ever added, keeping `isLogin` state
    const [isLogin, setIsLogin] = useState(true);
    const { login } = useAuth();
    const currentLang = 'tr' as Language;

    const handleSubmit = async () => {
        if (!email) return;
        setLoading(true);
        try {
            if (isLogin) {
                await login(email.trim(), password.trim());
            } else {
                // Register logic would go here
                Alert.alert(t('auth.info', currentLang), t('auth.registerInfo', currentLang));
            }
        } catch (error) {
            let message = t('auth.loginErrorMessage', currentLang);
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { message?: string } } };
                message = axiosError.response?.data?.message || message;
            }
            Alert.alert(t('auth.loginErrorTitle', currentLang), message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-[#020813]">
            {/* Vibrant glow effects */}
            {/* RN Android does not support CSS `filter`; it can crash the renderer after splash. */}
            <View className="absolute top-[-15%] left-[-20%] w-[80%] h-[60%] bg-blue-600/25 rounded-full" />
            <View className="absolute top-[-10%] right-[-20%] w-[70%] h-[50%] bg-purple-600/25 rounded-full" />
            <View className="absolute bottom-[-10%] right-[10%] w-[60%] h-[50%] bg-cyan-500/20 rounded-full" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1 justify-center px-5"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>

                    {/* Header / Logo Segment */}
                    <Animated.View entering={FadeInUp.delay(200).duration(800)} className="items-center mb-8 mt-12">
                        <Text
                            className="text-5xl font-black text-[#00D2FF]"
                            style={{
                                letterSpacing: 8,
                                textShadowColor: 'rgba(0, 210, 255, 0.6)',
                                textShadowOffset: { width: 0, height: 0 },
                                textShadowRadius: 25
                            }}
                        >
                            LEARNAXIA
                        </Text>
                    </Animated.View>

                    {/* Central Auth Card */}
                    <Animated.View entering={FadeInDown.delay(400).duration(800)} className="bg-[#0A1128]/80 border border-blue-400/40 rounded-[28px] p-8 mx-1 backdrop-blur-md" style={{ shadowColor: '#00D2FF', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 40 }}>

                        {/* Social / Alternative Logins */}
                        <View className="space-y-4 mb-6">
                            <TouchableOpacity
                                disabled={loading}
                                className="w-full bg-white h-[52px] rounded-2xl flex-row items-center justify-center shadow-lg"
                                style={{ shadowColor: '#fff', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 }}
                            >
                                <Ionicons name="logo-google" size={20} color="#18181B" className="mr-3" />
                                <Text className="text-[#18181B] text-base font-bold ml-1">{t('auth.googleLogin', currentLang)}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Divider */}
                        <View className="flex-row items-center py-2 mb-6">
                            <View className="flex-1 h-[1px] bg-white/5" />
                            <Text className="px-4 text-xs font-medium text-[#64748B]">{t('auth.emailOr', currentLang)}</Text>
                            <View className="flex-1 h-[1px] bg-white/5" />
                        </View>

                        {/* Form Inputs */}
                        <View className="space-y-5">
                            {!isLogin && (
                                <View className="relative justify-center">
                                    <View className="absolute left-4 z-10 flex items-center justify-center">
                                        <Ionicons name="person-outline" size={18} color="#00D2FF" />
                                    </View>
                                    <TextInput
                                        className="h-[52px] bg-[#0A1128]/90 border border-indigo-500/40 text-white rounded-2xl pl-12 pr-4 text-[15px]"
                                        placeholder={t('auth.usernamePlaceholder', currentLang)}
                                        placeholderTextColor="#64748B"
                                        editable={!loading}
                                    />
                                </View>
                            )}

                            <View className="relative justify-center">
                                <View className="absolute left-4 z-10 flex items-center justify-center">
                                    <Text className="text-[#00D2FF] text-lg font-bold">@</Text>
                                </View>
                                <TextInput
                                    className="h-[52px] bg-[#0A1128]/90 border border-indigo-500/40 text-white rounded-2xl pl-12 pr-4 text-[15px]"
                                    placeholder={t('auth.emailPlaceholder', currentLang)}
                                    placeholderTextColor="#64748B"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    editable={!loading}
                                />
                            </View>

                            <View className="relative justify-center mt-5">
                                <View className="absolute left-4 z-10 flex items-center justify-center">
                                    <Ionicons name="lock-closed-outline" size={18} color="#00D2FF" />
                                </View>
                                <TextInput
                                    className="h-[52px] bg-[#0A1128]/90 border border-indigo-500/40 text-white rounded-2xl pl-12 pr-12 text-[15px]"
                                    placeholder={isLogin ? t('auth.passwordPlaceholder', currentLang) : t('auth.passwordMin', currentLang)}
                                    placeholderTextColor="#64748B"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                    editable={!loading}
                                />
                                <TouchableOpacity className="absolute right-4 z-10 flex items-center justify-center">
                                    <Ionicons name="eye-outline" size={18} color="#00D2FF" />
                                </TouchableOpacity>
                            </View>

                            {isLogin && (
                                <View className="items-end mt-2 mb-1">
                                    <TouchableOpacity>
                                        <Text className="text-xs font-medium text-[#64748B]">{t('auth.forgotPassword', currentLang)}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={handleSubmit}
                                disabled={loading}
                                className="overflow-hidden rounded-2xl mt-4"
                            >
                                <LinearGradient
                                    colors={['#00D2FF', '#3B82F6', '#9333EA']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    className="h-[52px] flex-row items-center justify-center"
                                >
                                    {loading ? (
                                        <BrandLoader size={24} showBlur={false} className="mr-2" />
                                    ) : null}
                                    <Text className="text-white font-bold text-base tracking-wide">
                                        {isLogin ? t('auth.loginButton', currentLang) : t('auth.createButton', currentLang)}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <View className="flex-row items-center justify-center mt-5">
                                <Text className="text-[13px] font-medium text-[#64748B]">
                                    {isLogin ? t('auth.noAccount', currentLang) : t('auth.alreadyHaveAccount', currentLang)}
                                </Text>
                                <TouchableOpacity onPress={() => setIsLogin(!isLogin)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <Text className="text-[13px] text-[#00D2FF] font-bold">
                                        {isLogin ? t('auth.signUp', currentLang) : t('auth.loginAction', currentLang)}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
