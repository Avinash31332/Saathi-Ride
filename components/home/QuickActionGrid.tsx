import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";

import Animated, { FadeInDown } from "react-native-reanimated";

import AppCard from "../ui/AppCard";
import PressableCard from "../ui/PressableCard";

import { colors, radius, spacing, typography } from "../../constants/theme";

const actions = [
  {
    title: "My Rides",
    icon: <Ionicons name="car" size={28} color={colors.primary} />,
    onPress: () => router.push("/rides/driver-rides"),
  },
  {
    title: "Bookings",
    icon: <Ionicons name="ticket" size={28} color={colors.primary} />,
    onPress: () => router.push("/bookings/my-bookings"),
  },

  {
    title: "Vehicles",
    icon: (
      <MaterialCommunityIcons name="car" size={28} color={colors.primary} />
    ),
    onPress: () => router.push("/profile/my-cars"),
  },

  {
    title: "Women Only",
    icon: <Ionicons name="female" size={28} color={colors.primary} />,
    onPress: () => router.push("/profile/trusted-contacts"),
  },
];

const HORIZONTAL_PADDING = spacing.lg * 2;

const GAP = spacing.md;

const SCREEN_WIDTH = Dimensions.get("window").width;

const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
export default function QuickActionGrid() {
  return (
    <Animated.View
      entering={FadeInDown.delay(250)}
      style={{ marginTop: spacing.xl }}
    >
      <Text style={styles.heading}>Quick Actions</Text>

      <View style={styles.grid}>
        {actions.map((item) => (
          <PressableCard key={item.title} onPress={item.onPress}>
            <AppCard
              style={[
                styles.card,
                {
                  width: CARD_WIDTH,
                },
              ]}
            >
              {" "}
              <View style={styles.icon}>{item.icon}</View>
              <Text style={styles.title}>{item.title}</Text>
            </AppCard>
          </PressableCard>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...typography.heading,

    marginBottom: spacing.md,
  },

  grid: {
    flexDirection: "row",

    flexWrap: "wrap",

    justifyContent: "space-between",

    rowGap: spacing.md,
  },

  card: {
    paddingVertical: spacing.xl,

    alignItems: "center",

    paddingHorizontal: spacing.md,
  },
  icon: {
    width: 56,

    height: 56,

    borderRadius: radius.full,

    backgroundColor: colors.primaryLight,

    justifyContent: "center",

    alignItems: "center",

    marginBottom: spacing.md,
  },

  title: {
    ...typography.body,

    fontWeight: "600",
  },
});
