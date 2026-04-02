import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Edge = 'top' | 'bottom' | 'left' | 'right';

export type ScreenProps = ViewProps & {
  /**
   * Tab stack: only inset top/left/right so content can extend behind the floating tab bar;
   * use `TAB_SCREEN_CONTENT_BOTTOM` on scroll/list `contentContainerStyle.paddingBottom`.
   */
  tabScreen?: boolean;
  edges?: Edge[];
};

export function Screen({
  children,
  className,
  tabScreen,
  edges,
  style,
  ...rest
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const resolvedEdges: Edge[] = edges ?? (tabScreen ? ['top', 'left', 'right'] : ['top', 'bottom', 'left', 'right']);

  const paddingTop = resolvedEdges.includes('top') ? insets.top : 0;
  const paddingBottom = resolvedEdges.includes('bottom') ? insets.bottom : 0;
  const paddingLeft = resolvedEdges.includes('left') ? insets.left : 0;
  const paddingRight = resolvedEdges.includes('right') ? insets.right : 0;

  const mergedClass = ['flex-1', className].filter(Boolean).join(' ');

  return (
    <View
      className={mergedClass}
      style={[
        { paddingTop, paddingBottom, paddingLeft, paddingRight },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
