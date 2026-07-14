import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import {
  colors,
  radius,
  shadow,
  spacing,
  typography,
} from "../../constants/theme";

interface Props {
  name?: string;
}

export default function GreetingCard({ name = "Explorer" }: Props) {
  const hour = new Date().getHours();

  let greeting = "Good Evening";

  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";

  return (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.container}>
      <View style={styles.row}>
        <View style={styles.logo}>
          <Ionicons name="navigate" color={colors.surface} size={28} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>SAATHI RIDE</Text>

          <Text style={styles.greeting}>{greeting} 👋</Text>

          <Text style={styles.name}>{name}</Text>

          <Text style={styles.subtitle}>Safe • Smart • Shared</Text>
        </View>

        <Ionicons
          name="notifications-outline"
          size={28}
          color={colors.surface}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,

    borderRadius: radius.xl,

    padding: spacing.lg,

    ...shadow.lg,
  },

  row: {
    flexDirection: "row",

    alignItems: "center",
  },

  logo: {
    width: 58,

    height: 58,

    borderRadius: 29,

    backgroundColor: "rgba(255,255,255,0.18)",

    justifyContent: "center",

    alignItems: "center",

    marginRight: spacing.md,
  },

  brand: {
    color: "#DBEAFE",

    fontSize: 13,

    letterSpacing: 2,

    fontWeight: "700",
  },

  greeting: {
    color: colors.surface,

    fontSize: 18,

    fontWeight: "700",

    marginTop: 6,
  },

  name: {
    ...typography.h2,

    color: colors.surface,

    marginTop: 2,
  },

  subtitle: {
    color: "#DBEAFE",

    marginTop: spacing.xs,
  },
});
