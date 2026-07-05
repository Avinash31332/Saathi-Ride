/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const colors = {
  primary: "#2563EB",
  primaryDark: "#1E40AF",
  primaryLight: "#EFF6FF",
  danger: "#DC2626",
  dangerLight: "#FEF2F2",
  success: "#059669",
  successLight: "#ECFDF5",
  warning: "#F59E0B",

  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",

  border: "#E5E7EB",
  surface: "#FFFFFF",
  surfaceMuted: "#F9FAFB",
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 };

export const typography = {
  title: { fontSize: 24, fontWeight: "700" as const, color: colors.textPrimary },
  subtitle: { fontSize: 15, color: colors.textSecondary },
  body: { fontSize: 15, color: colors.textPrimary },
  label: { fontSize: 13, fontWeight: "600" as const, color: colors.textSecondary },
};