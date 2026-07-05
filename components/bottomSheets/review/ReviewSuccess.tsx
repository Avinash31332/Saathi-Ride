import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, typography } from "../../../constants/theme";

interface Props {
  onClose: () => void;
}

export default function ReviewSuccess({ onClose }: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}
      >
        <Ionicons name="checkmark-circle" size={56} color={colors.success} />
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim }}>
        <Text
          style={[
            typography.title,
            { textAlign: "center", marginTop: spacing.lg },
          ]}
        >
          Review Submitted
        </Text>

        <Text style={[typography.subtitle, styles.subtitle]}>
          Thank you for helping improve the rideshare community.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={onClose}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.successLight,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  button: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    paddingHorizontal: 44,
    alignSelf: "center",
  },
  buttonText: { color: "white", fontWeight: "700", fontSize: 16 },
});
