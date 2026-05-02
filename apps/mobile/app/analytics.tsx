import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import api from '@/lib/api';
import { BrandLoader } from '@/components/ui/brand-loader';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/mobile/analytics');
                setData(res.data);
            } catch (error) {
                console.error('[Analytics] Error fetching:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <Screen className="bg-ocean-bg justify-center items-center">
                <BrandLoader size="lg" label="Analiz ediliyor..." />
            </Screen>
        );
    }

    const activity = data?.dailyActivity || [];
    const maxDuration = Math.max(...activity.map((a: any) => a.duration), 1);
    
    // Last 7 days chart
    const chartData = activity.slice(-7);

    return (
        <Screen className="bg-ocean-bg">
            <ScrollView className="flex-1">
                {/* Header */}
                <View className="px-6 pt-10 pb-6 flex-row items-center">
                    <TouchableOpacity 
                        onPress={() => router.back()}
                        className="w-11 h-11 rounded-xl bg-ocean-panel items-center justify-center border border-ocean-border mr-4"
                    >
                        <MaterialIcons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-3xl font-black text-white tracking-tighter">İstatistikler</Text>
                </View>

                {/* Activity Chart */}
                <View className="px-6 mb-8">
                    <View className="bg-ocean-panel rounded-[32px] p-6 border border-ocean-border">
                        <Text className="text-white/40 text-[10px] font-black uppercase tracking-[4px] mb-6">SON 7 GÜN (DAKİKA)</Text>
                        
                        <View className="flex-row items-end justify-between h-40 px-2">
                            {chartData.map((day: any, i: number) => {
                                const height = (day.duration / maxDuration) * 100;
                                const date = new Date(day.date);
                                const dayName = date.toLocaleDateString('tr-TR', { weekday: 'short' }).charAt(0).toUpperCase();
                                
                                return (
                                    <View key={i} className="items-center flex-1">
                                        <View className="relative w-full items-center h-full justify-end">
                                            <View 
                                                className="w-4 rounded-full bg-blue-600/20 absolute bottom-0"
                                                style={{ height: '100%' }}
                                            />
                                            <LinearGradient
                                                colors={['#00D2FF', '#3B82F6']}
                                                className="w-4 rounded-full"
                                                style={{ height: `${Math.max(height, 5)}%` }}
                                            />
                                        </View>
                                        <Text className="text-[10px] font-bold text-white/30 mt-3">{dayName}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* Performance Cards */}
                <View className="px-6 mb-8">
                    <Text className="text-white/40 text-[10px] font-black uppercase tracking-[4px] ml-1 mb-4">PERFORMANS ÖZETİ</Text>
                    
                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1 bg-ocean-panel rounded-[28px] p-5 border border-ocean-border">
                            <View className="w-10 h-10 rounded-xl bg-emerald-500/10 items-center justify-center mb-4">
                                <MaterialIcons name="psychology" size={20} color="#10B981" />
                            </View>
                            <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">DOGRU ORANI</Text>
                            <Text className="text-2xl font-black text-white">%{data?.stats?.averageAccuracy || 0}</Text>
                        </View>

                        <View className="flex-1 bg-ocean-panel rounded-[28px] p-5 border border-ocean-border">
                            <View className="w-10 h-10 rounded-xl bg-blue-500/10 items-center justify-center mb-4">
                                <MaterialIcons name="local-fire-department" size={20} color="#3B82F6" />
                            </View>
                            <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">TOPLAM ÇÖZÜLEN</Text>
                            <Text className="text-2xl font-black text-white">{data?.stats?.totalSolved || 0}</Text>
                        </View>
                    </View>

                    <View className="bg-ocean-panel rounded-[28px] p-6 border border-ocean-border flex-row items-center">
                        <View className="w-14 h-14 rounded-2xl bg-purple-500/10 items-center justify-center mr-5">
                            <MaterialIcons name="trending-up" size={28} color="#A855F7" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">HAFTALIK İLERLEME</Text>
                            <Text className="text-lg font-bold text-white tracking-tight">Geçen haftaya göre %12 daha fazla çalıştınız.</Text>
                        </View>
                    </View>
                </View>

                {/* Module Mastery */}
                <View className="px-6 mb-12">
                   <Text className="text-white/40 text-[10px] font-black uppercase tracking-[4px] ml-1 mb-4">MODÜL USTALIGI</Text>
                   
                   {data?.moduleStats?.slice(0, 3).map((mod: any, i: number) => (
                       <View key={i} className="mb-4">
                           <View className="flex-row justify-between mb-2">
                               <Text className="text-white font-bold" numberOfLines={1}>{mod.title}</Text>
                               <Text className="text-blue-400 font-bold">%{mod.accuracy}</Text>
                           </View>
                           <View className="h-2 w-full bg-ocean-border rounded-full overflow-hidden">
                               <View 
                                   className="h-full bg-blue-500" 
                                   style={{ width: `${mod.accuracy}%` }} 
                               />
                           </View>
                       </View>
                   ))}
                </View>

            </ScrollView>
        </Screen>
    );
}
