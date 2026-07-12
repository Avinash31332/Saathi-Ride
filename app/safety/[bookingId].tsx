import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useCallback, useEffect, useState } from "react";

import AnimatedCard from "../../components/common/AnimatedCard";
import AnimatedScreen from "../../components/common/AnimatedScreen";

import {
  SafetySession,
  activateSafetyMode,
  getSafetyAlertDetails,
  getSafetySession,
  removeSafetySubscription,
  subscribeToSafetySession,
  triggerSafetySOS,
} from "../../services/safety.service";
import { getTrustedContacts } from "../../services/trusted-contact.service";

import {
  colors,
  radius,
  shadow,
  spacing,
  typography,
} from "../../constants/theme";

export default function SafetyModeScreen() {
  const { bookingId } = useLocalSearchParams<{
    bookingId: string;
  }>();

  const [session, setSession] = useState<SafetySession | null>(null);

  const [loading, setLoading] = useState(true);

  const [activating, setActivating] = useState(false);
  const [triggeringSOS, setTriggeringSOS] = useState(false);

  const loadSession = useCallback(async () => {
    if (!bookingId) return;

    const { data, error } = await getSafetySession(bookingId);

    if (error) {
      Alert.alert("Unable to load Safety Mode", error.message);
    }

    setSession(data);

    setLoading(false);
  }, [bookingId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!bookingId) return;

    let channel: any;

    const startRealtime = async () => {
      channel = await subscribeToSafetySession(
        bookingId,

        (updatedSession) => {
          setSession(updatedSession);
        },
      );
    };

    startRealtime();

    return () => {
      removeSafetySubscription(channel);
    };
  }, [bookingId]);

  const activate = async () => {
    if (!bookingId) return;

    setActivating(true);

    const { data, error } = await activateSafetyMode(bookingId);

    setActivating(false);

    if (error) {
      Alert.alert("Unable to activate Safety Mode", error.message);

      return;
    }

    setSession(data);

    Alert.alert(
      "Safety Mode active",
      "Your journey safety session has started.",
    );
  };

  const triggerSOS = async () => {
    if (!bookingId) return;

    Alert.alert(
      "Trigger Emergency SOS?",
      "Your current location will be recorded and an emergency alert can be shared with your trusted contacts.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Trigger SOS",
          style: "destructive",

          onPress: async () => {
            try {
              setTriggeringSOS(true);

              const { status } =
                await Location.requestForegroundPermissionsAsync();

              if (status !== "granted") {
                Alert.alert(
                  "Location required",
                  "Saathi needs your location to include your position in the SOS alert.",
                );

                setTriggeringSOS(false);

                return;
              }

              const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
              });

              const latitude = location.coords.latitude;

              const longitude = location.coords.longitude;

              const { data: sosSession, error: sosError } =
                await triggerSafetySOS(bookingId, latitude, longitude);

              if (sosError) {
                throw sosError;
              }

              setSession(sosSession);

              const [alertResult, contactsResult] = await Promise.all([
                getSafetyAlertDetails(bookingId),

                getTrustedContacts(),
              ]);

              if (alertResult.error) {
                throw alertResult.error;
              }

              const rideData: any = alertResult.data?.rides;

              const vehicle = rideData?.vehicles;

              const contacts = contactsResult.data || [];

              const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;

              const message = [
                "🚨 SAATHI EMERGENCY ALERT",
                "",
                "A passenger has triggered SOS during a protected Saathi journey.",
                "",
                `Route: ${rideData?.source || "Unknown"} → ${rideData?.destination || "Unknown"}`,
                vehicle?.vehicle_name
                  ? `Vehicle: ${vehicle.vehicle_name}`
                  : null,
                vehicle?.vehicle_number
                  ? `Vehicle Number: ${vehicle.vehicle_number}`
                  : null,
                vehicle?.vehicle_color
                  ? `Vehicle Color: ${vehicle.vehicle_color}`
                  : null,
                "",
                "Current location:",
                mapsLink,
                "",
                `SOS triggered at: ${new Date().toLocaleString()}`,
                "",
                "Please contact the passenger immediately.",
              ]
                .filter(Boolean)
                .join("\n");

              if (contacts.length === 0) {
                Alert.alert(
                  "SOS recorded",
                  "Your emergency event and location were recorded, but you have no trusted contacts configured.",
                );

                return;
              }

              const firstContact = contacts[0];

              const cleanPhone = firstContact.phone.replace(/[^0-9]/g, "");

              const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                message,
              )}`;

              const canOpen = await Linking.canOpenURL(whatsappUrl);

              if (!canOpen) {
                Alert.alert(
                  "SOS recorded",
                  "The emergency event was recorded, but WhatsApp could not be opened.",
                );

                return;
              }

              await Linking.openURL(whatsappUrl);
            } catch (error: any) {
              console.log("SOS ERROR:", error);

              Alert.alert(
                "Unable to trigger SOS",
                error?.message || "Something went wrong.",
              );
            } finally {
              setTriggeringSOS(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const active = session?.safety_status === "active";

  return (
    <AnimatedScreen>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,

              pressed && {
                transform: [
                  {
                    scale: 0.92,
                  },
                ],
              },
            ]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={21} color={colors.textPrimary} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.title}>Safety Mode</Text>

            <Text style={styles.subtitle}>Saathi journey protection</Text>
          </View>
        </View>

        <View style={[styles.hero, active && styles.heroActive]}>
          <View style={[styles.heroIcon, active && styles.heroIconActive]}>
            <MaterialCommunityIcons
              name={active ? "shield-check" : "shield-outline"}
              size={38}
              color={active ? "#BE185D" : colors.primary}
            />
          </View>

          <Text style={[styles.heroTitle, active && styles.heroTitleActive]}>
            {active ? "You're protected" : "Ready for your journey"}
          </Text>

          <Text style={styles.heroText}>
            {active
              ? "Safety Mode is monitoring your journey progress and safety events."
              : "Activate Safety Mode after entering the vehicle."}
          </Text>

          <View
            style={[styles.statusBadge, active && styles.statusBadgeActive]}
          >
            <View
              style={[styles.statusDot, active && styles.statusDotActive]}
            />

            <Text
              style={[styles.statusText, active && styles.statusTextActive]}
            >
              {active ? "ACTIVE" : "NOT STARTED"}
            </Text>
          </View>
        </View>

        {!active && (
          <Pressable
            style={({ pressed }) => [
              styles.activateButton,

              pressed && {
                transform: [
                  {
                    scale: 0.97,
                  },
                ],
              },

              activating && {
                opacity: 0.65,
              },
            ]}
            onPress={activate}
            disabled={activating}
          >
            {activating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="car-door"
                  size={21}
                  color="#FFFFFF"
                />

                <Text style={styles.activateButtonText}>
                  I am in the vehicle
                </Text>
              </>
            )}
          </Pressable>
        )}

        <Text style={styles.sectionTitle}>Journey protection</Text>

        <AnimatedCard style={styles.featureCard}>
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons
                name="navigate-outline"
                size={22}
                color={colors.primary}
              />
            </View>

            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Journey checkpoints</Text>

              <Text style={styles.featureText}>
                Important journey progress can be recorded and shared.
              </Text>
            </View>

            <Ionicons
              name={active ? "checkmark-circle" : "ellipse-outline"}
              size={21}
              color={active ? "#16A34A" : colors.textMuted}
            />
          </View>
        </AnimatedCard>

        <AnimatedCard style={styles.featureCard}>
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <MaterialCommunityIcons
                name="map-marker-path"
                size={22}
                color={colors.primary}
              />
            </View>

            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Route deviation</Text>

              <Text style={styles.featureText}>
                Significant route changes can trigger a safety event.
              </Text>
            </View>

            <Ionicons
              name={active ? "checkmark-circle" : "ellipse-outline"}
              size={21}
              color={active ? "#16A34A" : colors.textMuted}
            />
          </View>
        </AnimatedCard>

        <AnimatedCard style={styles.featureCard}>
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons
                name="people-outline"
                size={22}
                color={colors.primary}
              />
            </View>

            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Trusted contacts</Text>

              <Text style={styles.featureText}>
                Safety events can be shared with your safety circle.
              </Text>
            </View>

            <Ionicons
              name={active ? "checkmark-circle" : "ellipse-outline"}
              size={21}
              color={active ? "#16A34A" : colors.textMuted}
            />
          </View>
        </AnimatedCard>

        {active && (
          <Pressable
            style={({ pressed }) => [
              styles.sosButton,

              pressed && {
                transform: [
                  {
                    scale: 0.97,
                  },
                ],
              },
            ]}
            onPress={triggerSOS}
            disabled={triggeringSOS}
          >
            {triggeringSOS ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <View style={styles.sosIcon}>
                  <MaterialCommunityIcons
                    name="alarm-light"
                    size={27}
                    color="#FFFFFF"
                  />
                </View>

                <View style={styles.sosContent}>
                  <Text style={styles.sosTitle}>Emergency SOS</Text>

                  <Text style={styles.sosText}>
                    Send emergency location alert
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
              </>
            )}
          </Pressable>
        )}
      </ScrollView>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },

  content: {
    padding: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: 40,
  },

  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    marginLeft: spacing.md,
  },

  title: {
    ...typography.title,
    fontSize: 22,
  },

  subtitle: {
    ...typography.subtitle,
    fontSize: 13,
    marginTop: 2,
  },

  hero: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...shadow.card,
  },

  heroActive: {
    backgroundColor: "#FDF2F8",
    borderColor: "#FBCFE8",
  },

  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  heroIconActive: {
    backgroundColor: "#FCE7F3",
  },

  heroTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: spacing.md,
  },

  heroTitleActive: {
    color: "#BE185D",
  },

  heroText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginTop: spacing.sm,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginTop: spacing.md,
  },

  statusBadgeActive: {
    backgroundColor: "#FCE7F3",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },

  statusDotActive: {
    backgroundColor: "#BE185D",
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textSecondary,
  },

  statusTextActive: {
    color: "#BE185D",
  },

  activateButton: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  activateButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },

  featureCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  featureContent: {
    flex: 1,
    marginLeft: spacing.md,
  },

  featureTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  featureText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginTop: 3,
  },

  sosButton: {
    backgroundColor: colors.danger,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xl,
  },

  sosIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  sosContent: {
    flex: 1,
    marginLeft: spacing.md,
  },

  sosTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  sosText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    marginTop: 3,
  },
});
