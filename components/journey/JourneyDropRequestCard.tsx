import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, shadow, spacing } from "@/constants/theme";

interface Props {
  onPress: () => void;
}

export default function JourneyDropRequestCard({ onPress }: Props) {
  return (
    <Pressable onPress={onPress}>
      <View style={styles.card}>
        <View style={styles.icon}>
          <Ionicons name="exit-outline" size={26} color={colors.warning} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Request Early Drop</Text>

          <Text style={styles.subtitle}>
            Need to get down before your destination?
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadow.card,
  },

  icon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.warningLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  subtitle: {
    marginTop: 3,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
