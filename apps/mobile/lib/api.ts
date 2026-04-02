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

export const API_BASE_URL = isDev ? getDevBaseUrl() : 'https://learnaxia.com/api';

const TOKEN_KEY = 'learnaxia_access_token';
const REFRESH_TOKEN_KEY = 'learnaxia_refresh_token';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
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
    return config;
});

// Manage refreshing state to prevent multiple refresh calls simultaneously
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
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

        // If 401 Unauthorized and we haven't already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            
            if (isRefreshing) {
                // If currently refreshing, wait for it by adding request to queue
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
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

                const response = await axios.post(`${API_BASE_URL}/mobile/refresh`, {
                    refreshToken
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data;
                await setAuthToken(accessToken, newRefreshToken);

                // Process the queued requests with the new token
                processQueue(null, accessToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiClient(originalRequest);
            } catch (refreshError) {
                // If refresh fails, clear everything and fail the queue
                processQueue(refreshError, null);
                await clearAuthToken();
                
                // You can add a broadcast event here if need be (native DeviceEventEmitter)
                
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
