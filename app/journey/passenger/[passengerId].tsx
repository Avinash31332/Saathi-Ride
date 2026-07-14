import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import React, { useCallback, useEffect, useState } from "react";

import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

import PressScale from "@/components/ui/PressScale";

import { colors, radius, shadow, spacing, typography } from "@/constants/theme";

import { getJourneyPassenger } from "@/services/journey-passenger.service";

export default function JourneyPassengerScreen() {
  const params = useLocalSearchParams();

  const passengerId = String(params.passengerId);

  const [passenger, setPassenger] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const loadPassenger = useCallback(async () => {
    try {
      const { data, error } = await getJourneyPassenger(passengerId);

      if (error) {
        console.log("LOAD PASSENGER ERROR:", error);

        Alert.alert(
          "Unable to load passenger",
          error.message || "Passenger details could not be loaded",
        );

        return;
      }

      setPassenger(data);
    } catch (error: any) {
      console.log("LOAD PASSENGER EXCEPTION:", error);

      Alert.alert(
        "Unable to load passenger",
        error?.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }, [passengerId]);

  useEffect(() => {
    loadPassenger();
  }, [loadPassenger]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />

        <Text style={styles.loadingText}>Loading passenger...</Text>
      </View>
    );
  }

  if (!passenger) {
    return (
      <View style={styles.centered}>
        <Ionicons name="person-outline" size={52} color={colors.textMuted} />

        <Text style={styles.emptyTitle}>Passenger unavailable</Text>

        <PressScale onPress={() => router.back()} style={styles.backAction}>
          <Text style={styles.backActionText}>Go back</Text>
        </PressScale>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <PressScale onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </PressScale>

        <Text style={styles.headerTitle}>Passenger details</Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color={colors.primary} />
          </View>

          <Text style={styles.name}>{passenger.full_name || "Passenger"}</Text>

          <View style={styles.passengerBadge}>
            <Ionicons name="people-outline" size={14} color={colors.primary} />

            <Text style={styles.passengerBadgeText}>Journey passenger</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Contact information</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="call-outline" size={19} color={colors.primary} />
            </View>

            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>PHONE</Text>

              <Text style={styles.detailValue}>
                {passenger.phone || "Not available"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={colors.success}
          />

          <Text style={styles.noticeText}>
            Passenger information is available for active journey coordination.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },

  headerTitle: {
    ...typography.subheading,
    flex: 1,
    textAlign: "center",
  },

  headerSpacer: {
    width: 44,
  },

  content: {
    padding: spacing.md,
  },

  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    padding: spacing.xl,
    ...shadow.card,
  },

  avatar: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  name: {
    ...typography.heading,
    marginTop: spacing.md,
    textAlign: "center",
  },

  passengerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },

  passengerBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
  },

  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
    ...shadow.card,
  },

  sectionTitle: {
    ...typography.subheading,
    fontSize: 15,
    marginBottom: spacing.md,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  detailIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  detailContent: {
    flex: 1,
  },

  detailLabel: {
    ...typography.overline,
  },

  detailValue: {
    ...typography.bodyMedium,
    marginTop: 2,
  },

  notice: {
    flexDirection: "row",
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },

  noticeText: {
    flex: 1,
    ...typography.caption,
    color: colors.successDark,
    marginLeft: spacing.sm,
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
    padding: spacing.xl,
  },

  loadingText: {
    ...typography.caption,
    marginTop: spacing.sm,
  },

  emptyTitle: {
    ...typography.subheading,
    marginTop: spacing.md,
  },

  backAction: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },

  backActionText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
