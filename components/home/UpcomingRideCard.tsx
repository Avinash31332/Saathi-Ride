import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
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
import { getUpcomingRide } from "../../services/upcoming-ride.service";

export default function UpcomingRideCard() {
  const [ride, setRide] = useState<any>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: active } = await getMyActiveJourney();

    if (active) return;

    const { data } = await getUpcomingRide();

    setRide(data);
  }

  if (!ride) return null;

  return (
    <Animated.View entering={FadeInDown.delay(450)}>
      <PressableCard
        onPress={() =>
          router.push({
            pathname: "/journey/[rideId]",
            params: {
              rideId: ride.ride.id,
            },
          })
        }
      >
        <AppCard style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Upcoming Ride</Text>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {ride.role === "driver" ? "Driver" : "Passenger"}
              </Text>
            </View>
          </View>

          <View style={styles.route}>
            <Ionicons name="ellipse" size={10} color={colors.primary} />
            <Text numberOfLines={1} style={styles.location}>
              {ride.ride.source}
            </Text>
          </View>

          <View style={styles.line} />

          <View style={styles.route}>
            <Ionicons name="location" size={14} color={colors.danger} />
            <Text numberOfLines={1} style={styles.location}>
              {ride.ride.destination}
            </Text>
          </View>

          <View style={styles.bottom}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.primary}
            />

            <Text style={styles.date}>{ride.ride.ride_date}</Text>

            <Ionicons
              name="time-outline"
              size={18}
              color={colors.primary}
              style={{
                marginLeft: spacing.md,
              }}
            />

            <Text style={styles.date}>{ride.ride.ride_time}</Text>
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
    ...shadow.md,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    ...typography.h3,
  },

  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },

  badgeText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },

  route: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.lg,
  },

  line: {
    marginLeft: 4,
    width: 2,
    height: 20,
    backgroundColor: colors.border,
    marginVertical: 3,
  },

  location: {
    marginLeft: spacing.md,
    flex: 1,
    ...typography.body,
  },

  bottom: {
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
  },

  date: {
    marginLeft: 6,
    color: colors.textSecondary,
    fontWeight: "600",
  },
});
