import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView, StatusBar } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { BrandLoader } from '@/components/ui/brand-loader';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { t, Language, MobileLoginSchema, MobileRegisterSchema } from '@learnaxia/shared';

export default function LoginScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const { login, register } = useAuth();
    const currentLang = 'tr' as Language;

    const handleSubmit = async () => {
        const formData = isLogin 
            ? { email: email.trim(), password: password.trim() }
            : { name: name.trim(), email: email.trim(), password: password.trim() };

        const schema = isLogin ? MobileLoginSchema : MobileRegisterSchema;
        const result = schema.safeParse(formData);

        if (!result.success) {
            const firstError = result.error.issues[0].message;
            Alert.alert(t('auth.error', currentLang), firstError);
            return;
        }

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

    return (
        <Screen className="bg-[#050B18]">
            <StatusBar barStyle="light-content" />
            
            {/* Immersive Background Elements */}
            <View 
                className="absolute top-[-100px] right-[-50px] w-[300px] h-[300px] rounded-full" 
                style={{ opacity: 0.24, backgroundColor: '#1E293B' }} 
            />
            <View 
                className="absolute bottom-[-50px] left-[-100px] w-[400px] h-[400px] rounded-full" 
                style={{ backgroundColor: 'rgba(10, 17, 40, 0.8)' }}
            />
            
            {/* Dynamic Glows */}
            <View 
                className="absolute top-[10%] left-[-20%] w-[80%] h-[40%] rounded-full" 
                style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', transform: [{ scale: 1.5 }] }} 
            />
            <View 
                className="absolute bottom-[20%] right-[-20%] w-[60%] h-[30%] rounded-full" 
                style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView 
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }} 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Brand Identity */}
                    <Animated.View 
                        entering={FadeInUp.delay(200).duration(1000)} 
                        className="items-center mb-10"
                    >
                        <Animated.View entering={ZoomIn.delay(400).duration(800)} className="mb-4">
                            <LinearGradient
                                colors={['#00D2FF', '#3B82F6']}
                                className="w-16 h-16 rounded-2xl items-center justify-center transform rotate-12"
                            >
                                <Ionicons name="school" size={32} color="white" />
                            </LinearGradient>
                        </Animated.View>
                        
                        <Text
                            className="text-4xl font-black text-white"
                            style={{
                                letterSpacing: 6,
                                textShadowColor: 'rgba(0, 210, 255, 0.4)',
                                textShadowOffset: { width: 0, height: 4 },
                                textShadowRadius: 15
                            }}
                        >
                            LEARNAXIA
                        </Text>
                        <Text 
                            className="font-medium tracking-[2px] mt-1 text-[11px] uppercase"
                            style={{ color: 'rgba(96, 165, 250, 0.6)' }}
                        >
                            Advanced AI Learning
                        </Text>
                    </Animated.View>

                    {/* Authentication Card */}
                    <Animated.View 
                        entering={FadeInDown.delay(600).duration(800)} 
                        className="overflow-hidden rounded-[32px] border"
                        style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                    >
                        {/* Semi-transparent card background simulation */}
                        <LinearGradient
                            colors={['rgba(20, 30, 50, 0.85)', 'rgba(10, 15, 30, 0.95)']}
                            className="p-8"
                        >
                            {/* Inputs Segment */}
                            <View className="space-y-4">
                                {!isLogin && (
                                    <Animated.View entering={FadeInUp} className="mb-4">
                                        <Text style={{ color: 'rgba(255, 255, 255, 0.4)' }} className="text-[11px] font-bold uppercase tracking-widest ml-1 mb-2">
                                            {t('auth.namePlaceholder', currentLang)}
                                        </Text>
                                        <View 
                                            className="flex-row items-center border rounded-2xl px-4 h-14"
                                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', borderColor: 'rgba(255, 255, 255, 0.05)' }}
                                        >
                                            <Ionicons name="person-outline" size={18} color="#00D2FF" />
                                            <TextInput
                                                className="flex-1 ml-3 text-white text-base"
                                                placeholder="Adınız ve soyadınız"
                                                placeholderTextColor="rgba(255,255,255,0.2)"
                                                value={name}
                                                onChangeText={setName}
                                                editable={!loading}
                                            />
                                        </View>
                                    </Animated.View>
                                )}

                                <View className="mb-1">
                                    <Text style={{ color: 'rgba(255, 255, 255, 0.4)' }} className="text-[11px] font-bold uppercase tracking-widest ml-1 mb-2">
                                        {t('auth.emailPlaceholder', currentLang)}
                                    </Text>
                                    <View 
                                        className="flex-row items-center border rounded-2xl px-4 h-14"
                                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', borderColor: 'rgba(255, 255, 255, 0.05)' }}
                                    >
                                        <Ionicons name="mail-outline" size={18} color="#00D2FF" />
                                        <TextInput
                                            className="flex-1 ml-3 text-white text-base"
                                            placeholder="E-posta adresiniz"
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            value={email}
                                            onChangeText={setEmail}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                            editable={!loading}
                                        />
                                    </View>
                                </View>

                                <View className="mt-4">
                                    <Text style={{ color: 'rgba(255, 255, 255, 0.4)' }} className="text-[11px] font-bold uppercase tracking-widest ml-1 mb-2">
                                        {t('auth.passwordPlaceholder', currentLang)}
                                    </Text>
                                    <View 
                                        className="flex-row items-center border rounded-2xl px-4 h-14"
                                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', borderColor: 'rgba(255, 255, 255, 0.05)' }}
                                    >
                                        <Ionicons name="lock-closed-outline" size={18} color="#00D2FF" />
                                        <TextInput
                                            className="flex-1 ml-3 text-white text-base"
                                            placeholder="••••••••"
                                            placeholderTextColor="rgba(255,255,255,0.2)"
                                            secureTextEntry
                                            value={password}
                                            onChangeText={setPassword}
                                            editable={!loading}
                                        />
                                    </View>
                                </View>

                                {isLogin && (
                                    <TouchableOpacity className="self-end py-2">
                                        <Text style={{ color: 'rgba(255, 255, 255, 0.4)' }} className="text-xs font-medium">
                                            {t('auth.forgotPassword', currentLang)}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={handleSubmit}
                                    disabled={loading}
                                    className="overflow-hidden rounded-2xl mt-6"
                                >
                                    <LinearGradient
                                        colors={['#00D2FF', '#3B82F6']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        className="h-14 flex-row items-center justify-center"
                                        style={{ 
                                          elevation: 5,
                                          shadowColor: 'rgba(59, 130, 246, 0.2)',
                                          shadowOffset: { width: 0, height: 4 },
                                          shadowOpacity: 1,
                                          shadowRadius: 10
                                        }}
                                    >
                                        {loading ? (
                                            <BrandLoader size={20} showBlur={false} className="mr-3" />
                                        ) : (
                                            <Ionicons name={isLogin ? "log-in-outline" : "person-add-outline"} size={20} color="white" style={{marginRight: 8}} />
                                        )}
                                        <Text className="text-white font-bold text-base">
                                            {isLogin ? t('auth.loginButton', currentLang) : t('auth.createButton', currentLang)}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>

                            {/* Social Divider */}
                            <View className="flex-row items-center my-8">
                                <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }} className="flex-1 h-[1px]" />
                                <Text style={{ color: 'rgba(255, 255, 255, 0.2)' }} className="px-4 text-[10px] uppercase font-bold tracking-widest">{t('auth.emailOr', currentLang)}</Text>
                                <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }} className="flex-1 h-[1px]" />
                            </View>

                            {/* Google Sign In */}
                            <TouchableOpacity
                                activeOpacity={0.7}
                                className="h-14 rounded-2xl flex-row items-center justify-center border"
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }}
                            >
                                <Ionicons name="logo-google" size={18} color="white" />
                                <Text style={{ color: 'rgba(255, 255, 255, 0.9)' }} className="text-[15px] font-semibold ml-3">Google ile devam et</Text>
                            </TouchableOpacity>

                            {/* Footer Toggle */}
                            <View className="flex-row items-center justify-center mt-8">
                                <Text style={{ color: 'rgba(255, 255, 255, 0.4)' }} className="text-sm">
                                    {isLogin ? t('auth.noAccount', currentLang) : t('auth.alreadyHaveAccount', currentLang)}
                                </Text>
                                <TouchableOpacity onPress={() => setIsLogin(!isLogin)} className="ml-2">
                                    <Text className="text-[#00D2FF] text-sm font-bold">
                                        {isLogin ? t('auth.signUp', currentLang) : t('auth.loginAction', currentLang)}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </Animated.View>

                    <Text style={{ color: 'rgba(255, 255, 255, 0.2)' }} className="text-center text-[10px] mt-10 uppercase tracking-[4px]">
                        © 2026 Learnaxia
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    );
}

