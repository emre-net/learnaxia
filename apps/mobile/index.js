import 'react-native-reanimated';
/* eslint-disable import/first -- env must be set before expo-router/entry */
// Set Expo Router environment variables before importing
process.env.EXPO_ROUTER_APP_ROOT = process.env.EXPO_ROUTER_APP_ROOT || './app';
process.env.EXPO_ROUTER_IMPORT_MODE = process.env.EXPO_ROUTER_IMPORT_MODE || 'sync';

import 'expo-router/entry';
