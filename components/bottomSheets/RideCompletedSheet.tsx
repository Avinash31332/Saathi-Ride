import { useEffect, useRef, useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  Animated,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import ReviewForm from "./review/ReviewForm";
import ReviewSuccess from "./review/ReviewSuccess";
import { colors, spacing, radius, typography } from "../../constants/theme";

export default function RideCompletedSheet({ payload, onClose }: any) {
  const [submitted, setSubmitted] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (payload.isDriver) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  //--------------------------------------------------

  if (payload.isDriver) {
    return (
      <View style={styles.driverContainer}>
        <Animated.View
          style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}
        >
          <Ionicons name="trophy" size={44} color={colors.primary} />
        </Animated.View>

        <Text
          style={[
            typography.title,
            { textAlign: "center", marginTop: spacing.lg },
          ]}
        >
          Ride Completed
        </Text>

        <Text
          style={[
            typography.subtitle,
            { textAlign: "center", marginTop: spacing.sm },
          ]}
        >
          All passengers have confirmed the ride.
        </Text>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.85}
        >
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  //--------------------------------------------------

  if (submitted) {
    return <ReviewSuccess onClose={onClose} />;
  }

  //--------------------------------------------------

  return (
    <ReviewForm
      payload={payload}
      onClose={onClose}
      onSuccess={() => setSubmitted(true)}
    />
  );
}

const styles = StyleSheet.create({
  driverContainer: { alignItems: "center", paddingVertical: spacing.lg },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    paddingHorizontal: 44,
  },
  closeText: { color: "white", fontWeight: "700", fontSize: 16 },
});
