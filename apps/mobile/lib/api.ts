import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// For Android emulator, localhost is 10.0.2.2.
// For iOS Simulator, localhost is localhost.
// Replace with your production URL when deploying.
export const API_BASE_URL = __DEV__
    ? Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api'
    : 'https://learnaxia.com/api';

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

// Refresh token logic
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 Unauthorized and we haven't already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/mobile/refresh`, {
                        refreshToken
                    });

                    const newAccessToken = response.data.accessToken;
                    const newRefreshToken = response.data.refreshToken;

                    await setAuthToken(newAccessToken, newRefreshToken);
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                    // Retry the original request
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, user needs to login again
                await clearAuthToken();
                // Here you could dispatch an event to force logout in the UI
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
