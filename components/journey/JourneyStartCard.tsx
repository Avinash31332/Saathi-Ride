import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, radius, shadow, spacing } from "@/constants/theme";

export default function JourneyStartCard({
  loading,
  onStart,
}: {
  loading: boolean;
  onStart: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Ionicons name="play-circle" size={44} color={colors.primary} />

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Ready to begin?</Text>

          <Text style={styles.subtitle}>
            Start the journey when you leave the pickup point.
          </Text>
        </View>
      </View>

      <Pressable disabled={loading} style={styles.button} onPress={onStart}>
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="navigate" color="white" size={20} />

            <Text style={styles.buttonText}>Start Journey</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },

  row: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  subtitle: {
    marginTop: 4,
    color: colors.textSecondary,
  },

  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});
