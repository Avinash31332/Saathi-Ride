import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import PressScale from "@/components/ui/PressScale";

import { colors, radius, shadow, spacing, typography } from "@/constants/theme";

interface Props {
  onPress: () => void;
}

export default function JourneySOSButton({ onPress }: Props) {
  return (
    <PressScale onPress={onPress} style={styles.button}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name="alarm-light"
          size={25}
          color={colors.textInverse}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>SOS Emergency</Text>

        <Text style={styles.subtitle}>
          Alert trusted contacts and share journey status
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.textInverse} />
    </PressScale>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 78,
    borderRadius: radius.lg,
    backgroundColor: colors.danger,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.md,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  content: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    ...typography.bodyMedium,
    color: colors.textInverse,
    fontWeight: "900",
  },

  subtitle: {
    ...typography.caption,
    color: "rgba(255,255,255,0.78)",
    marginTop: 3,
    paddingRight: spacing.sm,
  },
});
