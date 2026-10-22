---
name: expo-native-expert
description: Expert guidelines for Expo SDK 52 and React Native development. Covers Expo Router navigation, native UI components, Reanimated animations, Gesture Handler, offline storage, and cross-platform mobile patterns.
triggers: [mobile-screen, expo-router, react-native, mobile-component, mobile-navigation]
outputs: [expo-screens, mobile-components, navigation-routes]
---

# Expo & React Native Expert Guidelines

This skill guides the design, development, and debugging of mobile screens and components inside `apps/mobile` using Expo SDK 52 and React Native.

## Core Rules for LearnAxia Mobile

1. **Expo Router File-based Routing:**
   - Routes reside in `apps/mobile/app/`.
   - File names must be `kebab-case` or `[id].tsx` for dynamic routes.
   - Use `useLocalSearchParams` and typed navigation via `router.push()` or `router.replace()`.
   - Always wrap screens in `SafeAreaView` or use the custom `Screen` container to respect safe area insets on iOS and Android.

2. **Native Performance & Animations:**
   - Use `react-native-reanimated` (v3) for 60fps animations.
   - Keep animations declarative with `FadeInDown`, `FadeInUp`, `FadeOut`, or shared transition tags.
   - Run layout calculations and touch tracking on the UI thread using Reanimated worklets when building gesture-heavy controls (e.g., card swipe, drawing canvas).

3. **Touch Targets & Ergonomics:**
   - Minimum interactive touch target is 44x44 dp.
   - Use `TouchableOpacity` or `Pressable` with subtle opacity or scale feedback on press (`activeOpacity={0.7}`).
   - Avoid nesting scroll views without proper configuration (`nestedScrollEnabled={true}`).

4. **Component Architecture:**
   - Keep components modular in `apps/mobile/components/`.
   - Study renderers (e.g., `MCCard`, `TrueFalseCard`, `GapCard`, `Flashcard`) must follow a uniform interface:
     - Clear question prompt display
     - Distinct option selectors
     - Answer confirmation feedback (emerald green for correct, rose for incorrect)
     - Explanation / reveal section
   - Manage local UI state cleanly without leaking to global contexts unless persisting.

5. **Theme & Colors:**
   - Dark theme by default with consistent palette:
     - Background: `#0B0F19` or `#0F172A` (deep night slate)
     - Card Surface: `#1E293B` with border `#334155`
     - Text Primary: `#F8FAFC`
     - Text Secondary: `#94A3B8`
     - Brand / Accent: `#6366F1` (Indigo) / `#8B5CF6` (Violet)

6. **Native Module & Dependency Compatibility:**
   - Verify compatibility with Expo SDK 52 before installing new libraries (`npx expo install <package>`).
   - Avoid legacy packages requiring manual native linking or unsupported React 18/19 peer dependency overrides.
