import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { colors, radius, shadow, spacing } from "../../constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SearchCard() {
  const scale = useSharedValue(1);

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(150)} style={{ marginTop: -12 }}>
      <AnimatedPressable
        style={animated}
        onPress={() => router.push("/rides/search")}
        onPressIn={() => {
          scale.value = withSpring(0.97);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
      >
        <View style={styles.card}>
          <View style={styles.searchIcon}>
            <Ionicons name="search" size={22} color={colors.primary} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Where are you going?</Text>

            <Text style={styles.subtitle}>Search rides across your city</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,

    borderRadius: radius.xl,

    padding: spacing.lg,

    flexDirection: "row",

    alignItems: "center",

    ...shadow.lg,
  },

  searchIcon: {
    width: 48,

    height: 48,

    borderRadius: 24,

    backgroundColor: colors.primaryLight,

    justifyContent: "center",

    alignItems: "center",

    marginRight: spacing.md,
  },

  title: {
    fontSize: 17,

    fontWeight: "700",

    color: colors.textPrimary,
  },

  subtitle: {
    color: colors.textSecondary,

    marginTop: 4,

    fontSize: 14,
  },
});
