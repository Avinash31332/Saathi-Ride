import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import AppCard from "../ui/AppCard";
import PressableCard from "../ui/PressableCard";

import {
  colors,
  radius,
  shadow,
  spacing,
  typography,
} from "../../constants/theme";

import { getMyActiveJourney } from "../../services/active-journey.service";
import { getJourneyData } from "../../services/journey.service";

export default function ContinueJourneyCard() {
  const [loading, setLoading] = useState(true);

  const [journey, setJourney] = useState<any>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: active } = await getMyActiveJourney();
    console.log("ACTIVE JOURNEY", active);

    if (!active) {
      setLoading(false);
      return;
    }

    const { data } = await getJourneyData(active.rideId);
    console.log("JOURNEY DATA", data);

    setJourney(data);

    setLoading(false);
  }

  if (loading) {
    return (
      <View
        style={{
          marginTop: spacing.xl,
          alignItems: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (!journey) return null;

  const progress = Math.round(journey.tracking?.progress_percentage ?? 0);

  return (
    <Animated.View entering={FadeInDown.delay(350)}>
      <PressableCard
        onPress={() =>
          router.push({
            pathname: "/journey/[rideId]",

            params: {
              rideId: journey.ride.id,
            },
          })
        }
      >
        <AppCard style={styles.card}>
          <View style={styles.top}>
            <View style={styles.badge}>
              <Ionicons name="navigate" color={colors.surface} size={18} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.heading}>Continue Journey</Text>

              <Text style={styles.role}>
                {journey.role === "driver" ? "Driving" : "Travelling"}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={22}
              color={colors.textMuted}
            />
          </View>

          <View style={styles.route}>
            <View style={styles.dotPrimary} />

            <View
              style={{
                flex: 1,
              }}
            >
              <Text numberOfLines={1} style={styles.location}>
                {journey.ride.source}
              </Text>
            </View>
          </View>

          <View style={styles.line} />

          <View style={styles.route}>
            <MaterialCommunityIcons
              name="map-marker"
              size={18}
              color={colors.danger}
            />

            <View
              style={{
                flex: 1,
              }}
            >
              <Text numberOfLines={1} style={styles.location}>
                {journey.ride.destination}
              </Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                  },
                ]}
              />
            </View>

            <Text style={styles.percent}>{progress}%</Text>
            <View style={styles.infoChip}>
              <Ionicons name="people" size={18} color={colors.primary} />

              <Text>{journey.passengers.length} Passengers</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerItem}>
              <Ionicons
                name="shield-checkmark"
                color={colors.success}
                size={18}
              />

              <Text style={styles.footerText}>Safety Active</Text>
            </View>

            <View style={styles.footerItem}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />

              <Text style={styles.footerText}>Live Tracking</Text>
            </View>
          </View>
        </AppCard>
      </PressableCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.xl,

    padding: spacing.lg,

    borderRadius: radius.xl,

    ...shadow.lg,
  },

  top: {
    flexDirection: "row",

    alignItems: "center",
  },

  badge: {
    width: 42,

    height: 42,

    borderRadius: 21,

    backgroundColor: colors.primary,

    justifyContent: "center",

    alignItems: "center",

    marginRight: spacing.md,
  },

  heading: {
    ...typography.h3,
  },

  role: {
    color: colors.textSecondary,

    marginTop: 2,
  },

  route: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: spacing.lg,
  },

  dotPrimary: {
    width: 12,

    height: 12,

    borderRadius: 6,

    backgroundColor: colors.primary,

    marginLeft: 3,

    marginRight: spacing.md,
  },

  line: {
    width: 2,

    height: 22,

    backgroundColor: colors.border,

    marginLeft: 8,

    marginVertical: 4,
  },

  location: {
    ...typography.body,
  },

  progressContainer: {
    marginTop: spacing.xl,
  },

  progressBar: {
    height: 10,

    borderRadius: 6,

    backgroundColor: colors.border,

    overflow: "hidden",
  },

  progress: {
    height: "100%",

    backgroundColor: colors.primary,
  },

  percent: {
    alignSelf: "flex-end",

    marginTop: 6,

    fontWeight: "700",

    color: colors.primary,
  },

  infoChip: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: spacing.md,
  },

  footer: {
    flexDirection: "row",

    justifyContent: "space-between",

    marginTop: spacing.xl,
  },

  footerItem: {
    flexDirection: "row",

    alignItems: "center",
  },

  footerText: {
    marginLeft: 6,

    color: colors.textSecondary,

    fontSize: 13,

    fontWeight: "600",
  },
  progressBackground: {
    height: 12,

    backgroundColor: colors.surfaceSecondary,

    borderRadius: radius.full,

    overflow: "hidden",

    marginTop: spacing.md,
  },

  progressFill: {
    height: "100%",

    backgroundColor: colors.success,

    borderRadius: radius.full,
  },
});
