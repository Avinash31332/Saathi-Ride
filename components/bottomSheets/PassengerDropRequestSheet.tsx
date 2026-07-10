import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useEventService } from "../../services/event.service";
import { declinePassengerDrop } from "../../services/booking.service";
import { colors, spacing, radius, typography } from "../../constants/theme";

export default function PassengerDropRequestSheet({ payload, onClose }: any) {
  const { showPassengerDropReason } = useEventService();

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="exit-outline" size={32} color={colors.primary} />
      </View>

      <Text style={[typography.title, styles.title]}>Drop Request</Text>

      <Text style={[typography.subtitle, styles.line]}>
        Your driver wants to stop here.
      </Text>

      <Text style={[typography.body, styles.question]}>
        Are you getting off now?
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && { opacity: 0.85 },
        ]}
        onPress={() => {
          setTimeout(() => {
            showPassengerDropReason(payload);
          }, 50);

          onClose();
        }}
      >
        <Ionicons name="checkmark-circle-outline" size={18} color="white" />
        <Text style={styles.primaryButtonText}>Yes, Drop Me</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && { opacity: 0.85 },
        ]}
        onPress={async () => {
          await declinePassengerDrop(payload.bookingId);

          onClose();
        }}
      >
        <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
        <Text style={styles.secondaryButtonText}>No, Continue Ride</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingBottom: spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    textAlign: "center",
  },
  line: {
    textAlign: "center",
    marginTop: spacing.xs,
  },
  question: {
    textAlign: "center",
    marginTop: spacing.md,
    fontWeight: "600",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    marginTop: spacing.xl,
    width: "100%",
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: 15,
    marginTop: spacing.sm,
    width: "100%",
  },
  secondaryButtonText: {
    color: colors.danger,
    fontWeight: "700",
    fontSize: 15,
  },
});
