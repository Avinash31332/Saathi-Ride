import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import ReviewStars from "./ReviewStars";
import { submitReview } from "../../../services/review.service";
import { colors, spacing, radius, typography } from "../../../constants/theme";

interface Props {
  payload: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewForm({ payload, onClose, onSuccess }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Please select a rating.");
      return;
    }

    setLoading(true);

    const { error } = await submitReview({
      rideId: payload.rideId,
      reviewerId: payload.reviewerId,
      reviewedUserId: payload.driverId,
      rating,
      comment,
    });

    setLoading(false);

    if (error) {
      Alert.alert(error.message);
      return;
    }

    onSuccess();
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={styles.header}>
        <Text style={typography.title}>Rate your Driver</Text>

        <TouchableOpacity onPress={onClose} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Text style={[typography.subtitle, { marginTop: spacing.xs }]}>
        Your ride has been completed successfully.
      </Text>

      <View style={styles.routeCard}>
        <View style={styles.routeRow}>
          <Ionicons name="navigate" size={16} color={colors.primary} />
          <Text style={styles.route}>
            {payload.source} → {payload.destination}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={styles.date}>{payload.rideDate}</Text>
          <Ionicons
            name="time-outline"
            size={14}
            color={colors.textSecondary}
            style={{ marginLeft: spacing.md }}
          />
          <Text style={styles.date}>{payload.rideTime}</Text>
        </View>
      </View>

      <ReviewStars rating={rating} onChange={setRating} />

      <Text style={typography.label}>COMMENT (OPTIONAL)</Text>

      <TextInput
        multiline
        numberOfLines={4}
        maxLength={250}
        value={comment}
        onChangeText={setComment}
        placeholder="Tell us about your experience..."
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />

      <Text style={styles.counter}>{comment.length}/250</Text>

      <TouchableOpacity
        style={[styles.button, rating === 0 && styles.disabled]}
        disabled={rating === 0 || loading}
        onPress={handleSubmit}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="paper-plane-outline" size={17} color="white" />
            <Text style={styles.buttonText}>Submit Review</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  routeCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  routeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  route: {
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
  date: { color: colors.textSecondary, marginLeft: spacing.xs, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 110,
    textAlignVertical: "top",
    marginTop: spacing.xs,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  counter: {
    alignSelf: "flex-end",
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontSize: 12,
  },
  button: {
    marginTop: spacing.lg,
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  disabled: { opacity: 0.4 },
  buttonText: { color: "white", fontWeight: "700", fontSize: 16 },
});
