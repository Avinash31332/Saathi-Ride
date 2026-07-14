import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import React, { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import PressScale from "@/components/ui/PressScale";

import { colors, radius, shadow, spacing, typography } from "@/constants/theme";

import { verifyBoardingPin } from "@/services/boarding.service";

export default function BoardingVerificationScreen() {
  const params = useLocalSearchParams();

  const bookingId = String(params.bookingId);

  const [pin, setPin] = useState("");

  const [verifying, setVerifying] = useState(false);

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const handleVerify = async () => {
    if (verifying) {
      return;
    }

    const cleanPin = pin.trim();

    if (cleanPin.length !== 4) {
      Alert.alert("Invalid PIN", "Enter the passenger's 4-digit boarding PIN.");

      return;
    }

    setVerifying(true);

    try {
      const result = await verifyBoardingPin(bookingId, cleanPin);

      if (!result.success) {
        Alert.alert(
          "Verification failed",
          result.error?.message || "Unable to verify boarding PIN",
        );

        return;
      }

      Alert.alert("Passenger boarded", "Boarding verified successfully.", [
        {
          text: "Continue Journey",

          onPress: () => {
            router.replace({
              pathname: "/journey/[rideId]",

              params: {
                rideId: result.rideId!,
              },
            });
          },
        },
      ]);
    } catch (error: any) {
      console.log("BOARDING VERIFICATION ERROR:", error);

      Alert.alert(
        "Verification failed",
        error?.message || "Something went wrong",
      );
    } finally {
      setVerifying(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <PressScale onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </PressScale>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="keypad-outline" size={32} color={colors.primary} />
          </View>

          <Text style={styles.title}>Verify passenger</Text>

          <Text style={styles.subtitle}>
            Ask the passenger for their boarding PIN after they enter the
            vehicle.
          </Text>

          <TextInput
            ref={inputRef}
            value={pin}
            onChangeText={(value) => {
              const cleanValue = value.replace(/[^0-9]/g, "").slice(0, 4);

              setPin(cleanValue);
            }}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="••••"
            placeholderTextColor={colors.textMuted}
            style={styles.pinInput}
            textAlign="center"
            secureTextEntry
            editable={!verifying}
            onSubmitEditing={handleVerify}
          />

          <Text style={styles.pinHint}>4-digit boarding PIN</Text>

          <PressScale
            onPress={handleVerify}
            disabled={verifying || pin.length !== 4}
            style={[
              styles.verifyButton,

              (verifying || pin.length !== 4) && styles.verifyButtonDisabled,
            ]}
          >
            {verifying ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={21}
                  color={colors.textInverse}
                />

                <Text style={styles.verifyText}>Verify Boarding</Text>
              </>
            )}
          </PressScale>

          <View style={styles.safetyNotice}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={colors.success}
            />

            <Text style={styles.safetyText}>
              After verification, the passenger can access the active journey
              and live ride progress.
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },

  container: {
    flex: 1,
    padding: spacing.md,
    paddingTop: spacing.xl,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: spacing.xxl,
  },

  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },

  title: {
    ...typography.title,
    textAlign: "center",
  },

  subtitle: {
    ...typography.subtitle,
    textAlign: "center",
    maxWidth: 320,
    marginTop: spacing.sm,
  },

  pinInput: {
    width: "100%",
    maxWidth: 320,
    height: 76,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    marginTop: spacing.xl,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 14,
    color: colors.textPrimary,
    paddingLeft: 14,
    ...shadow.sm,
  },

  pinHint: {
    ...typography.caption,
    marginTop: spacing.sm,
  },

  verifyButton: {
    width: "100%",
    maxWidth: 320,
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
    ...shadow.card,
  },

  verifyButtonDisabled: {
    opacity: 0.5,
  },

  verifyText: {
    ...typography.button,
    color: colors.textInverse,
  },

  safetyNotice: {
    maxWidth: 320,
    flexDirection: "row",
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },

  safetyText: {
    flex: 1,
    ...typography.caption,
    color: colors.successDark,
    marginLeft: spacing.sm,
  },
});
