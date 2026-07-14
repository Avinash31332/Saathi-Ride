import { Ionicons } from "@expo/vector-icons";
import React from "react";

import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, shadow, spacing } from "@/constants/theme";
import { requestPassengerDrop } from "@/services/booking.service";

interface Props {
  passengers: any[];
}

export default function BoardedPassengersDropCard({ passengers }: Props) {
  /*
   * ONLY PASSENGERS CURRENTLY INSIDE VEHICLE
   */

  const boardedPassengers = passengers.filter((passenger) => {
    return (
      passenger?.boarding_verified === true && !passenger?.passenger_dropped_at
    );
  });

  /*
   * NOTHING TO SHOW
   */

  if (boardedPassengers.length === 0) {
    return null;
  }

  /*
   * REQUEST PASSENGER DROP
   */

  const handleRequestDrop = (passenger: any) => {
    if (!passenger?.id) {
      Alert.alert(
        "Booking unavailable",
        "Unable to find this passenger booking.",
      );

      return;
    }

    const passengerName =
      passenger?.profiles?.full_name ||
      passenger?.passenger_name ||
      "this passenger";

    Alert.alert(
      "Request Drop",
      `Ask ${passengerName} if they want to get off here?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Ask Passenger",
          onPress: async () => {
            const result = await requestPassengerDrop(passenger.id);

            if (result.error) {
              Alert.alert("Unable to send request", result.error.message);
              return;
            }

            Alert.alert("Request Sent", `${passengerName} has been notified.`);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="people-outline" size={21} color={colors.primary} />
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.title}>Current Passengers</Text>

          <Text style={styles.subtitle}>
            {boardedPassengers.length} onboard
          </Text>
        </View>
      </View>

      <View style={styles.passengerList}>
        {boardedPassengers.map((passenger, index) => {
          const passengerName =
            passenger?.profiles?.full_name ||
            passenger?.passenger_name ||
            "Passenger";

          return (
            <View
              key={passenger.id}
              style={[
                styles.passengerRow,
                index !== boardedPassengers.length - 1 &&
                  styles.passengerBorder,
              ]}
            >
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color={colors.primary} />
              </View>

              <View style={styles.passengerContent}>
                <Text style={styles.passengerName} numberOfLines={1}>
                  {passengerName}
                </Text>

                <View style={styles.onboardRow}>
                  <View style={styles.statusDot} />

                  <Text style={styles.onboardText}>Onboard</Text>
                </View>
              </View>

              <Pressable
                onPress={() => handleRequestDrop(passenger)}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.exitButton,
                  pressed && styles.exitButtonPressed,
                ]}
              >
                <Ionicons name="exit-outline" size={23} color={colors.danger} />
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={colors.textMuted}
        />

        <Text style={styles.footerText}>
          Use the exit button to ask a passenger if they want to get off.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.card,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  headerContent: {
    flex: 1,
  },

  title: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  subtitle: {
    marginTop: 3,
    fontSize: 12,
    color: colors.textSecondary,
  },

  passengerList: {
    marginTop: spacing.lg,
  },

  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },

  passengerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  passengerContent: {
    flex: 1,
  },

  passengerName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  onboardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.success,
    marginRight: 6,
  },

  onboardText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.success,
  },

  exitButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  exitButtonPressed: {
    opacity: 0.65,
    transform: [{ scale: 0.96 }],
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  footerText: {
    flex: 1,
    marginLeft: 7,
    fontSize: 10,
    color: colors.textMuted,
  },
});
