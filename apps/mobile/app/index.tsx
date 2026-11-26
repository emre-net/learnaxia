import React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { BrandLoader } from '@/components/ui/brand-loader';

export default function Index() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#09090B', alignItems: 'center', justifyContent: 'center' }}>
                <BrandLoader size="lg" />
            </View>
        );
    }

    return <Redirect href={user ? '/(tabs)' : '/login'} />;
}
