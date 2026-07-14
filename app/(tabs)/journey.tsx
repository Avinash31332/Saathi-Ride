import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import React, { useCallback, useEffect, useState } from "react";

import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import PressScale from "@/components/ui/PressScale";

import { colors, radius, shadow, spacing, typography } from "@/constants/theme";

import {
  ActiveJourney,
  getMyActiveJourney,
} from "@/services/active-journey.service";

import { supabase } from "@/services/supabase";

export default function JourneyTabScreen() {
  const [journey, setJourney] = useState<ActiveJourney | null>(null);

  const [loading, setLoading] = useState(true);

  const loadJourney = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const { data, error } = await getMyActiveJourney();

      if (error) {
        console.log("JOURNEY TAB LOAD ERROR:", error);

        return;
      }

      console.log("JOURNEY TAB ACTIVE:", data);

      setJourney(data);
    } catch (error) {
      console.log("JOURNEY TAB EXCEPTION:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadJourney(true);
    }, [loadJourney]),
  );

  useEffect(() => {
    let channel: any = null;

    const subscribe = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      channel = supabase
        .channel(`journey-tab-${user.id}`)

        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookings",
            filter: `passenger_id=eq.${user.id}`,
          },
          () => {
            console.log("JOURNEY TAB BOOKING UPDATED");

            loadJourney(false);
          },
        )

        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rides",
          },
          () => {
            console.log("JOURNEY TAB RIDE UPDATED");

            loadJourney(false);
          },
        )

        .subscribe((status) => {
          console.log("JOURNEY TAB REALTIME:", status);
        });
    };

    subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [loadJourney]);

  const openJourney = () => {
    if (!journey) {
      return;
    }

    router.push({
      pathname: "/journey/[rideId]",

      params: {
        rideId: journey.rideId,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />

        <Text style={styles.loadingText}>Checking your journey...</Text>
      </View>
    );
  }

  if (!journey) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>My Journey</Text>

          <Text style={styles.subtitle}>Your active ride appears here</Text>
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="navigate-outline"
              size={34}
              color={colors.primary}
            />
          </View>

          <Text style={styles.emptyTitle}>No active journey</Text>

          <Text style={styles.emptySubtitle}>
            Once your boarding PIN is verified, your live journey and ride
            progress will appear here.
          </Text>
        </View>
      </View>
    );
  }

  const isDriver = journey.role === "driver";

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>My Journey</Text>

        <Text style={styles.subtitle}>Journey in progress</Text>
      </View>

      <View style={styles.content}>
        <PressScale onPress={openJourney} style={styles.journeyCard}>
          <View style={styles.cardTop}>
            <View style={styles.journeyIcon}>
              <Ionicons
                name={isDriver ? "car-sport-outline" : "navigate-outline"}
                size={27}
                color={colors.primary}
              />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.roleLabel}>
                {isDriver ? "DRIVER JOURNEY" : "PASSENGER JOURNEY"}
              </Text>

              <Text style={styles.cardTitle}>Journey in progress</Text>

              <Text style={styles.cardSubtitle}>
                {isDriver
                  ? "Track your ride and manage passengers"
                  : "View live ride progress and safety status"}
              </Text>
            </View>

            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />

              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Text style={styles.actionText}>Continue Journey</Text>

            <Ionicons name="arrow-forward" size={18} color={colors.primary} />
          </View>
        </PressScale>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },

  title: {
    ...typography.title,
  },

  subtitle: {
    ...typography.subtitle,
    marginTop: spacing.xs,
  },

  content: {
    padding: spacing.md,
  },

  journeyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.card,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  journeyIcon: {
    width: 54,
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  cardContent: {
    flex: 1,
    minWidth: 0,
  },

  roleLabel: {
    ...typography.overline,
    color: colors.primary,
  },

  cardTitle: {
    ...typography.subheading,
    marginTop: 2,
  },

  cardSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.successLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    marginLeft: spacing.sm,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },

  liveText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    color: colors.success,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },

  actionText: {
    ...typography.label,
    color: colors.primary,
    fontWeight: "800",
    marginRight: spacing.sm,
  },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },

  loadingText: {
    ...typography.caption,
    marginTop: spacing.sm,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    ...typography.heading,
    marginTop: spacing.lg,
  },

  emptySubtitle: {
    ...typography.subtitle,
    textAlign: "center",
    marginTop: spacing.sm,
    maxWidth: 300,
  },
});
