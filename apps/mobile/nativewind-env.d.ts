/// <reference types="nativewind/types" />

// ============================================================================
// NativeWind className type augmentations
// Required because NativeWind v5-preview's react-native-css types target
// RN 0.81+/React 19+, but this project uses RN 0.76.7/React 18.3.1.
// These augmentations add `className` to all RN and third-party components.
// ============================================================================

import type {
  ScrollViewPropsAndroid,
  ScrollViewPropsIOS,
  Touchable,
} from "react-native";

// --- React Native core module augmentation ---
declare module "react-native" {
  interface ViewProps {
    className?: string;
    cssInterop?: boolean;
  }
  interface TextProps {
    className?: string;
    cssInterop?: boolean;
  }
  interface TextInputProps {
    className?: string;
    cssInterop?: boolean;
    placeholderClassName?: string;
  }
  interface ImagePropsBase {
    className?: string;
    cssInterop?: boolean;
  }
  interface ScrollViewProps
    extends ViewProps,
      ScrollViewPropsIOS,
      ScrollViewPropsAndroid,
      Touchable {
    contentContainerClassName?: string;
    indicatorClassName?: string;
  }
  interface TouchableWithoutFeedbackProps {
    className?: string;
    cssInterop?: boolean;
  }
  interface KeyboardAvoidingViewProps extends ViewProps {
    contentContainerClassName?: string;
  }
  interface ButtonProps {
    className?: string;
  }
  interface SwitchProps {
    className?: string;
    cssInterop?: boolean;
  }
  interface StatusBarProps {
    className?: string;
    cssInterop?: boolean;
  }
  interface InputAccessoryViewProps {
    className?: string;
    cssInterop?: boolean;
  }
  interface ModalBaseProps {
    presentationClassName?: string;
  }
  interface FlatListProps<ItemT> {
    columnWrapperClassName?: string;
  }
  interface ImageBackgroundProps {
    imageClassName?: string;
  }
}

// --- react-native-safe-area-context augmentation ---
declare module "react-native-safe-area-context" {
  interface SafeAreaViewProps {
    className?: string;
  }
}

// --- expo-linear-gradient augmentation ---
declare module "expo-linear-gradient" {
  interface LinearGradientProps {
    className?: string;
  }
}

// --- react-native-reanimated augmentation ---
declare module "react-native-reanimated" {
  import type { ViewProps, TextProps, ImageProps, ScrollViewProps } from "react-native";
  import type { ReactNode } from "react";

  interface AnimateProps<P extends object> {
    className?: string;
    children?: ReactNode;
    style?: any;
    entering?: any;
    exiting?: any;
    layout?: any;
  }

  // Re-export useScrollViewOffset for compatibility
  export function useScrollViewOffset(ref: any): any;
}

// --- @react-native/virtualized-lists augmentation ---
declare module "@react-native/virtualized-lists" {
  export interface VirtualizedListWithoutRenderItemProps<ItemT> {
    ListFooterComponentClassName?: string;
    ListHeaderComponentClassName?: string;
  }
}
