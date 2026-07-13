import { Feather, Ionicons } from "@expo/vector-icons";

import { router, useLocalSearchParams } from "expo-router";

import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors, radius, shadow, spacing, typography } from "@/constants/theme";

import { verifyPassengerBoarding } from "@/services/boarding.service";

export default function BoardingVerificationScreen() {
  const { bookingId } = useLocalSearchParams<{
    bookingId: string;
  }>();

  const [pin, setPin] = useState("");

  const [loading, setLoading] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;

  const slide = useRef(new Animated.Value(18)).current;

  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,

        duration: 380,

        useNativeDriver: true,
      }),

      Animated.timing(slide, {
        toValue: 0,

        duration: 380,

        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const pressIn = () => {
    Animated.spring(
      buttonScale,

      {
        toValue: 0.97,

        speed: 45,

        bounciness: 4,

        useNativeDriver: true,
      },
    ).start();
  };

  const pressOut = () => {
    Animated.spring(
      buttonScale,

      {
        toValue: 1,

        speed: 45,

        bounciness: 4,

        useNativeDriver: true,
      },
    ).start();
  };

  const handleVerify = async () => {
    if (!bookingId) {
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      Alert.alert(
        "Invalid PIN",

        "Enter the passenger's 4-digit boarding PIN.",
      );

      return;
    }

    setLoading(true);

    const { data, error } = await verifyPassengerBoarding({
      bookingId,

      pin,
    });

    setLoading(false);

    if (error) {
      Alert.alert(
        "Boarding failed",

        error.message,
      );

      return;
    }

    Alert.alert(
      data?.already_verified ? "Already Verified" : "Passenger Boarded",

      data?.already_verified
        ? "This passenger has already been verified."
        : "The passenger's journey is now active.",

      [
        {
          text: "Continue Journey",

          onPress: () => {
            router.back();
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Animated.View
        style={[
          styles.content,

          {
            opacity: fade,

            transform: [
              {
                translateY: slide,
              },
            ],
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={21} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.iconBadge}>
          <Ionicons name="keypad-outline" size={32} color={colors.primary} />
        </View>

        <Text style={styles.title}>Verify passenger</Text>

        <Text style={styles.subtitle}>
          Ask the passenger for their 4-digit boarding PIN before starting their
          journey.
        </Text>

        <View style={styles.pinCard}>
          <Text style={styles.pinLabel}>BOARDING PIN</Text>

          <TextInput
            value={pin}
            onChangeText={(value) =>
              setPin(value.replace(/\D/g, "").slice(0, 4))
            }
            keyboardType="number-pad"
            maxLength={4}
            placeholder="••••"
            placeholderTextColor={colors.textMuted}
            style={styles.pinInput}
            textAlign="center"
            autoFocus
          />

          <View style={styles.securityRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={colors.success}
            />

            <Text style={styles.securityText}>
              PIN is verified securely against the booking
            </Text>
          </View>
        </View>

        <Animated.View
          style={{
            transform: [
              {
                scale: buttonScale,
              },
            ],
          }}
        >
          <Pressable
            onPress={handleVerify}
            onPressIn={pressIn}
            onPressOut={pressOut}
            disabled={loading || pin.length !== 4}
            style={[
              styles.verifyButton,

              pin.length !== 4 && styles.verifyButtonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={21}
                  color={colors.surface}
                />

                <Text style={styles.verifyButtonText}>Confirm Boarding</Text>
              </>
            )}
          </Pressable>
        </Animated.View>

        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.primary}
          />

          <Text style={styles.noticeText}>
            Only verify the passenger after they physically enter the vehicle.
          </Text>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,

    backgroundColor: colors.surfaceMuted,
  },

  content: {
    flex: 1,

    paddingHorizontal: spacing.lg,

    paddingTop: spacing.xl,

    justifyContent: "center",
  },

  backButton: {
    position: "absolute",

    top: spacing.xl,

    left: spacing.lg,

    width: 42,

    height: 42,

    borderRadius: radius.full,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",

    ...shadow.card,
  },

  iconBadge: {
    width: 68,

    height: 68,

    borderRadius: radius.lg,

    backgroundColor: colors.primaryLight,

    alignItems: "center",

    justifyContent: "center",

    marginBottom: spacing.lg,
  },

  title: {
    ...typography.title,

    fontSize: 27,
  },

  subtitle: {
    ...typography.subtitle,

    lineHeight: 21,

    marginTop: spacing.sm,

    marginBottom: spacing.xl,
  },

  pinCard: {
    backgroundColor: colors.surface,

    borderRadius: radius.lg,

    borderWidth: 1,

    borderColor: colors.border,

    padding: spacing.lg,

    ...shadow.card,
  },

  pinLabel: {
    textAlign: "center",

    fontSize: 10,

    fontWeight: "800",

    color: colors.textMuted,

    letterSpacing: 1.3,
  },

  pinInput: {
    fontSize: 42,

    fontWeight: "900",

    color: colors.textPrimary,

    letterSpacing: 18,

    paddingVertical: spacing.lg,
  },

  securityRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 6,
  },

  securityText: {
    fontSize: 10,

    color: colors.textMuted,
  },

  verifyButton: {
    height: 56,

    borderRadius: radius.md,

    backgroundColor: colors.primary,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: spacing.sm,

    marginTop: spacing.lg,

    ...shadow.card,
  },

  verifyButtonDisabled: {
    opacity: 0.5,
  },

  verifyButtonText: {
    color: colors.surface,

    fontSize: 15,

    fontWeight: "800",
  },

  notice: {
    flexDirection: "row",

    alignItems: "flex-start",

    gap: spacing.sm,

    marginTop: spacing.lg,

    paddingHorizontal: spacing.sm,
  },

  noticeText: {
    flex: 1,

    fontSize: 11,

    color: colors.textSecondary,

    lineHeight: 17,
  },
});
