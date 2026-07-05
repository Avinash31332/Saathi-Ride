import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { confirmRideCompletion } from "../../services/booking.service";
import { colors, spacing, radius, typography } from "../../constants/theme";

export default function RideCompletionSheet({ payload, onClose }: any) {
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleConfirm = async () => {
    console.log("Confirm button pressed");
    console.log("Booking:", payload.bookingId);

    setLoading(true);
    const { error } = await confirmRideCompletion(payload.bookingId);
    setLoading(false);

    if (error) {
      Alert.alert(error.message);
      return;
    }

    onClose();
  };

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="checkmark-circle" size={40} color={colors.primary} />
      </View>

      <Text
        style={[
          typography.title,
          { textAlign: "center", marginTop: spacing.sm },
        ]}
      >
        Ride Completion
      </Text>

      <Text
        style={[
          typography.subtitle,
          { textAlign: "center", marginTop: spacing.xs },
        ]}
      >
        Driver marked this ride as completed.
      </Text>

      <View style={styles.routeCard}>
        <View style={styles.routeRow}>
          <Ionicons name="navigate" size={18} color={colors.primary} />
          <Text style={styles.routeText}>
            {payload.source} → {payload.destination}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons
            name="calendar-outline"
            size={15}
            color={colors.textSecondary}
          />
          <Text style={styles.metaText}>{payload.rideDate}</Text>

          <Ionicons
            name="time-outline"
            size={15}
            color={colors.textSecondary}
            style={{ marginLeft: spacing.md }}
          />
          <Text style={styles.metaText}>{payload.rideTime}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={handleConfirm}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="checkmark" size={18} color="white" />
            <Text style={styles.confirmText}>Confirm Ride</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.reportButton}
        activeOpacity={0.7}
        onPress={() => {
          Alert.alert("Dispute flow coming soon.");
          onClose();
        }}
      >
        <Ionicons name="flag-outline" size={16} color={colors.danger} />
        <Text style={styles.reportText}>Report Issue</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  routeCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  routeText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  confirmButton: {
    marginTop: spacing.lg,
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmText: { color: "white", fontWeight: "700", fontSize: 16 },
  reportButton: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  reportText: { color: colors.danger, fontWeight: "600", fontSize: 14 },
});
