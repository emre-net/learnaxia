import * as SecureStore from 'expo-secure-store';
import { getAuthToken, setAuthToken, clearAuthToken, API_BASE_URL } from '../api';

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

describe('Mobile API Client & Storage Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should have a valid API_BASE_URL pointing to learnaxia backend', () => {
        expect(API_BASE_URL).toBeDefined();
        expect(typeof API_BASE_URL).toBe('string');
        expect(API_BASE_URL).toContain('learnaxia.com/api');
    });

    it('should store access token and refresh token via SecureStore', async () => {
        const fakeAccessToken = 'header.payload.signature';
        const fakeRefreshToken = 'refresh-uuid-token';

        await setAuthToken(fakeAccessToken, fakeRefreshToken);

        expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
            'learnaxia_access_token',
            fakeAccessToken
        );
        expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
            'learnaxia_refresh_token',
            fakeRefreshToken
        );
    });

    it('should retrieve auth token from SecureStore', async () => {
        const fakeToken = 'mocked-jwt';
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(fakeToken);

        const token = await getAuthToken();
        expect(token).toBe(fakeToken);
        expect(SecureStore.getItemAsync).toHaveBeenCalledWith('learnaxia_access_token');
    });

    it('should clear both access and refresh tokens upon logout', async () => {
        await clearAuthToken();

        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('learnaxia_access_token');
        expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('learnaxia_refresh_token');
    });
});
