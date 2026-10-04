import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// For Android emulator, localhost is 10.0.2.2.
// For physical Android devices, use the computer's LAN IP.
// For iOS Simulator, localhost is localhost.
const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

const getDevBaseUrl = () => {
    if (Platform.OS === 'ios') return 'http://localhost:3000/api';
    // Android: physical device usually works best with 127.0.0.1:3000 when using 'adb reverse' (USB)
    // or LAN IP when using Wi-Fi. Since we are using USB, 127.0.0.1 is often more reliable than 'localhost' on Android.
    return 'http://127.0.0.1:3000/api';
};

const DEFAULT_PROD_API_URL = 'https://learnaxia.com/api';

const resolveApiBaseUrl = () => {
    // 1. If explicit env variable is set
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    if (envUrl && envUrl.trim().length > 0) {
        return envUrl.trim().replace('https://www.learnaxia.com', 'https://learnaxia.com');
    }
    // 2. If app.json extra config has apiUrl
    const extraApiUrl = (Constants.expoConfig?.extra as Record<string, any> | undefined)?.apiUrl;
    if (extraApiUrl && typeof extraApiUrl === 'string' && extraApiUrl.trim().length > 0) {
        return extraApiUrl.trim().replace('https://www.learnaxia.com', 'https://learnaxia.com');
    }
    // 3. Only if explicitly opted into local dev mode via EXPO_PUBLIC_USE_LOCAL === 'true'
    if (process.env.EXPO_PUBLIC_USE_LOCAL === 'true') {
        return getDevBaseUrl();
    }
    // 4. Default: Live production API on Railway
    return DEFAULT_PROD_API_URL;
};

export const API_BASE_URL = resolveApiBaseUrl();

const TOKEN_KEY = 'learnaxia_access_token';
const REFRESH_TOKEN_KEY = 'learnaxia_refresh_token';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    // AI/PDF işlemleri uzun sürebilir, timeout 60 saniyeye yükseltildi.
    // Kısa işlemler (liste, profil) bu sürenin çok altında biter.
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getAuthToken = async () => {
    return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const setAuthToken = async (token: string, refreshToken?: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    if (refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    }
};

export const clearAuthToken = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
};

// Add token to requests
apiClient.interceptors.request.use(async (config) => {
    const token = await getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // React Native'de FormData ile yapılan yüklemelerde Content-Type'ı silerek
    // boundary parametresinin otomatik ve doğru eklenmesini sağla
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }
    return config;
});

// Manage refreshing state to prevent multiple refresh calls simultaneously
let isRefreshing = false;
let failedQueue: { resolve: (token: string | null) => void; reject: (err: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Response interceptor for refresh token logic
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Guard: config yoksa veya 401 değilse doğrudan reddet
        if (
            error.response?.status !== 401 ||
            !originalRequest ||
            originalRequest._retry
        ) {
            return Promise.reject(error);
        }

        // Guard: refresh endpoint'inin kendisine gelen 401'i tekrar refresh etme
        const isRefreshRequest =
            typeof originalRequest.url === 'string' &&
            originalRequest.url.includes('/mobile/refresh');

        if (isRefreshRequest) {
            await clearAuthToken();
            return Promise.reject(error);
        }

        if (isRefreshing) {
            // If currently refreshing, wait for it by adding request to queue
            return new Promise<string | null>((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    if (!token) {
                        return Promise.reject(new Error('Token refresh failed'));
                    }
                    originalRequest.headers = originalRequest.headers ?? {};
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return apiClient(originalRequest);
                })
                .catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
            if (!refreshToken) throw new Error('No refresh token available');

            // Refresh isteği apiClient dışında yapılır — interceptor döngüsünü önler
            const response = await axios.post(`${API_BASE_URL}/mobile/refresh`, {
                refreshToken
            }, {
                timeout: 15000,
                headers: { 'Content-Type': 'application/json' },
            });

            const { accessToken, refreshToken: newRefreshToken } = response.data;

            if (typeof accessToken !== 'string' || accessToken.length === 0) {
                throw new Error('Refresh response did not contain a valid access token');
            }

            await setAuthToken(
                accessToken,
                typeof newRefreshToken === 'string' ? newRefreshToken : refreshToken
            );

            // Process the queued requests with the new token
            processQueue(null, accessToken);

            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
        } catch (refreshError) {
            // If refresh fails, clear everything and fail the queue
            processQueue(refreshError, null);
            await clearAuthToken();

            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default apiClient;
