import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import AnimatedCard from "./AnimatedCard";

import { colors, radius, shadow, spacing } from "../../constants/theme";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  onPress?: () => void;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = colors.primary,
  onPress,
}: Props) {
  return (
    <AnimatedCard style={styles.wrapper} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color={color} />
      </View>

      <Text style={styles.title}>{title}</Text>

      <Text style={styles.value}>{value}</Text>

      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: "center",
    ...shadow.card,
  },

  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },

  title: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
  },

  value: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 6,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
  },
});
