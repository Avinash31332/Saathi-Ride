export const colors = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primaryPressed: "#1E40AF",
  primaryLight: "#EFF6FF",
  primarySoft: "#DBEAFE",

  success: "#059669",
  successDark: "#047857",
  successLight: "#ECFDF5",

  danger: "#DC2626",
  dangerDark: "#B91C1C",
  dangerLight: "#FEF2F2",

  warning: "#D97706",
  warningDark: "#B45309",
  warningLight: "#FFFBEB",

  info: "#0284C7",
  infoLight: "#F0F9FF",

  textPrimary: "#111827",
  textSecondary: "#4B5563",
  textMuted: "#9CA3AF",
  textInverse: "#FFFFFF",

  surface: "#FFFFFF",
  surfaceMuted: "#F9FAFB",
  surfaceSecondary: "#F3F4F6",
  surfaceElevated: "#FFFFFF",

  border: "#E5E7EB",
  borderStrong: "#D1D5DB",

  overlay: "rgba(17, 24, 39, 0.48)",
  backdrop: "rgba(17, 24, 39, 0.32)",

  transparent: "transparent",
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 999,
};

export const typography = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "800" as const,
    color: colors.textPrimary,
  },

  title: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "800" as const,
    color: colors.textPrimary,
  },

  heading: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "800" as const,
    color: colors.textPrimary,
  },

  subheading: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "700" as const,
    color: colors.textPrimary,
  },

  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400" as const,
    color: colors.textPrimary,
  },

  bodyMedium: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600" as const,
    color: colors.textPrimary,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
    color: colors.textSecondary,
  },

  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },

  caption: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500" as const,
    color: colors.textMuted,
  },

  overline: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800" as const,
    color: colors.textMuted,
    letterSpacing: 1,
  },

  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700" as const,
  },
};

export const shadow = {
  none: {
    shadowOpacity: 0,
    elevation: 0,
  },

  sm: {
    shadowColor: "#111827",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  card: {
    shadowColor: "#111827",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  md: {
    shadowColor: "#111827",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },

  lg: {
    shadowColor: "#111827",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const sizes = {
  iconXs: 14,
  iconSm: 18,
  iconMd: 22,
  iconLg: 28,
  iconXl: 36,

  touchTarget: 44,

  inputHeight: 52,
  buttonHeight: 52,

  avatarSm: 36,
  avatarMd: 48,
  avatarLg: 64,

  tabBarHeight: 64,
};

export const layout = {
  screenPadding: spacing.md,
  sectionSpacing: spacing.lg,
  cardPadding: spacing.md,

  maxContentWidth: 720,
};

export const animation = {
  fast: 160,
  normal: 240,
  slow: 420,
};

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  shadow,
  sizes,
  layout,
  animation,
};

export default theme;
