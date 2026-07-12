import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../../constants/theme";

type Mode = "driver" | "passenger";

interface Props {
  value: Mode;
  onChange: (value: Mode) => void;
}

export default function SegmentedPill({ value, onChange }: Props) {
  const slide = useRef(new Animated.Value(value === "driver" ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: value === "driver" ? 0 : 1,
      useNativeDriver: false,
      speed: 18,
      bounciness: 8,
    }).start();
  }, [value]);

  const translate = slide.interpolate({
    inputRange: [0, 1],
    outputRange: ["2%", "51%"],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pill,
          {
            left: translate,
          },
        ]}
      />

      <Pressable style={styles.option} onPress={() => onChange("driver")}>
        <Ionicons
          name="car-sport"
          size={18}
          color={value === "driver" ? colors.primary : colors.textSecondary}
        />

        <Text style={[styles.text, value === "driver" && styles.activeText]}>
          Driver
        </Text>
      </Pressable>

      <Pressable style={styles.option} onPress={() => onChange("passenger")}>
        <Ionicons
          name="person"
          size={18}
          color={value === "passenger" ? colors.primary : colors.textSecondary}
        />

        <Text style={[styles.text, value === "passenger" && styles.activeText]}>
          Passenger
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 54,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    position: "relative",
    overflow: "hidden",
    marginVertical: spacing.md,
  },

  pill: {
    position: "absolute",
    width: "47%",
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    top: 4,
  },

  option: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    zIndex: 10,
  },

  text: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  activeText: {
    color: colors.primary,
    fontWeight: "700",
  },
});
