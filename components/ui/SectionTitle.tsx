import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/constants/theme";

interface Props {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
}

export default function SectionTitle({ icon, title }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={17} color={colors.primary} />

      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  title: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
  },
});
