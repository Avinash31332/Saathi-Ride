import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import AppCard from "../ui/AppCard";
import PressableCard from "../ui/PressableCard";

import { colors, radius, shadow, spacing } from "../../constants/theme";

export default function CreateRideHero() {
  return (
    <Animated.View entering={FadeInDown.delay(250)}>
      <PressableCard onPress={() => router.push("/rides/create")}>
        <AppCard style={styles.card}>
          <View style={styles.left}>
            <View style={styles.icon}>
              <Ionicons name="car-sport" size={34} color={colors.surface} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Offer a Ride</Text>

              <Text style={styles.subtitle}>
                Share your journey and earn while travelling.
              </Text>
            </View>
          </View>

          <Ionicons
            name="arrow-forward-circle"
            size={36}
            color={colors.surface}
          />
        </AppCard>
      </PressableCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,

    backgroundColor: colors.primary,

    padding: spacing.lg,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    borderRadius: radius.xl,

    ...shadow.lg,
  },

  left: {
    flexDirection: "row",

    alignItems: "center",

    flex: 1,
  },

  icon: {
    width: 64,

    height: 64,

    borderRadius: 32,

    backgroundColor: "rgba(255,255,255,0.18)",

    justifyContent: "center",

    alignItems: "center",

    marginRight: spacing.md,
  },

  title: {
    color: colors.surface,

    fontSize: 20,

    fontWeight: "700",
  },

  subtitle: {
    color: "#DBEAFE",

    marginTop: 4,

    fontSize: 14,

    lineHeight: 20,
  },
});
