import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { confirmPassengerDrop } from "../../services/booking.service";
import { colors, spacing, radius, typography } from "../../constants/theme";

const reasons: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "Reached Destination", icon: "flag-outline" },
  { label: "Reached Home", icon: "home-outline" },
  { label: "Reached Hostel", icon: "business-outline" },
  { label: "Destination Changed", icon: "swap-horizontal-outline" },
  { label: "Personal Reason", icon: "person-outline" },
  { label: "Other", icon: "ellipsis-horizontal-outline" },
];

export default function PassengerDropReasonSheet({ payload, onClose }: any) {
  const [selected, setSelected] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);

    try {
      const reason = selected === "Other" ? otherReason : selected;

      console.log("======== SUBMIT ========");

      console.log(payload.bookingId);

      console.log(reason);

      const result = await confirmPassengerDrop(payload.bookingId, reason);

      console.log("RPC RESULT");

      console.log(result);

      console.log("RPC ERROR");

      console.log(result.error);

      if (result.error) {
        Alert.alert(result.error.message);

        setLoading(false);
        return;
      }

      console.log("Closing sheet");

      onClose();
    } catch (e) {
      console.log("SUBMIT ERROR");

      console.log(e);

      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={typography.title}>Why are you getting off?</Text>
      <Text style={[typography.subtitle, { marginTop: spacing.xs }]}>
        Select a reason so your driver knows what is happening.
      </Text>

      <View style={styles.reasonList}>
        {reasons.map(({ label, icon }) => {
          const isSelected = selected === label;
          return (
            <Pressable
              key={label}
              onPress={() => setSelected(label)}
              style={({ pressed }) => [
                styles.reasonRow,
                isSelected && styles.reasonRowSelected,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons
                name={icon}
                size={20}
                color={isSelected ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.reasonText,
                  isSelected && styles.reasonTextSelected,
                ]}
              >
                {label}
              </Text>

              <View style={styles.radioOuter}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      {selected === "Other" && (
        <TextInput
          placeholder="Enter reason..."
          placeholderTextColor={colors.textMuted}
          value={otherReason}
          onChangeText={setOtherReason}
          style={styles.input}
        />
      )}

      <Pressable
        style={({ pressed }) => [
          styles.submitButton,
          pressed && { opacity: 0.85 },
          loading && { opacity: 0.7 },
        ]}
        disabled={loading}
        onPress={submit}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={18} color="white" />
            <Text style={styles.submitButtonText}>Submit</Text>
          </>
        )}
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.cancelButton,
          pressed && { opacity: 0.85 },
        ]}
        disabled={loading}
        onPress={onClose}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md,
  },
  reasonList: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  reasonRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  reasonText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  reasonTextSelected: {
    fontWeight: "700",
    color: colors.primary,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    fontSize: 15,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    marginTop: spacing.xl,
  },
  submitButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    paddingVertical: 15,
    marginTop: spacing.sm,
  },
  cancelButtonText: {
    color: colors.danger,
    fontWeight: "700",
    fontSize: 15,
  },
});
