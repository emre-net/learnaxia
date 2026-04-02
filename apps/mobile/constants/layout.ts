import { Platform } from 'react-native';

/** Matches `tabBarStyle.height` in `app/(tabs)/_layout.tsx` (floating tab bar). */
export const TAB_BAR_SURFACE_HEIGHT = Platform.OS === 'ios' ? 88 : 72;

/** Extra space so scroll/list content clears the tab bar (not the home-indicator inset; bar already sits above it). */
export const TAB_SCREEN_SCROLL_GAP = 12;

export const TAB_SCREEN_CONTENT_BOTTOM = TAB_BAR_SURFACE_HEIGHT + TAB_SCREEN_SCROLL_GAP;
