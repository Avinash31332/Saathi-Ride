import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, radius, shadow, spacing, typography } from "@/constants/theme";

import {
  isDriverTrackingRide,
  startDriverLocationTracking,
  stopDriverLocationTracking,
} from "@/services/driver-location.service";

import {
  getJourneyData,
  getTrustedContactCount,
  removeJourneySubscription,
  subscribeToJourney,
} from "@/services/journey.service";

function clampProgress(value: any) {
  const progress = Number(value || 0);

  return Math.min(100, Math.max(0, progress));
}

function formatStatus(status: string) {
  return status
    ?.replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function PressScale({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      speed: 45,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 45,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

function SectionTitle({ icon, title }: { icon: any; title: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Ionicons name={icon} size={17} color={colors.primary} />

      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function JourneyScreen() {
  const params = useLocalSearchParams();

  const rideId = String(params.rideId);

  const [journey, setJourney] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [driverTrackingActive, setDriverTrackingActive] = useState(false);

  const [trustedContactCount, setTrustedContactCount] = useState(0);

  const fade = useRef(new Animated.Value(0)).current;

  const slide = useRef(new Animated.Value(18)).current;

  const startAutomaticDriverTracking = async () => {
    if (!journey || journey.role !== "driver") {
      return;
    }

    const result = await startDriverLocationTracking({
      rideId,

      trackingMode: "normal",
    });

    if (result.error) {
      console.log("AUTO DRIVER TRACKING ERROR:", result.error);

      Alert.alert(
        "Tracking Error",

        result.error instanceof Error
          ? result.error.message
          : "Unable to start journey tracking",
      );

      return;
    }

    setDriverTrackingActive(true);

    Alert.alert(
      "Journey Tracking Active",

      "Your route progress is now being tracked automatically.",
    );
  };

  const stopAutomaticDriverTracking = async () => {
    await stopDriverLocationTracking();

    setDriverTrackingActive(false);
  };

  const loadJourney = useCallback(
    async (showLoader = false) => {
      if (showLoader) {
        setLoading(true);
      }

      const { data, error } = await getJourneyData(rideId);

      if (error) {
        console.log("LOAD JOURNEY ERROR:", error);

        Alert.alert("Unable to load journey", error.message);

        setLoading(false);

        setRefreshing(false);

        return;
      }

      setJourney(data);

      if (data?.role === "driver") {
        setDriverTrackingActive(isDriverTrackingRide(rideId));
      }

      if (data?.role === "passenger") {
        const { count } = await getTrustedContactCount();

        setTrustedContactCount(count);
      }

      setLoading(false);

      setRefreshing(false);
    },

    [rideId],
  );

  useEffect(() => {
    loadJourney(true);

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,

        duration: 420,

        useNativeDriver: true,
      }),

      Animated.timing(slide, {
        toValue: 0,

        duration: 420,

        useNativeDriver: true,
      }),
    ]).start();

    const channel = subscribeToJourney(
      rideId,

      () => {
        loadJourney(false);
      },
    );

    return () => {
      removeJourneySubscription(channel);
    };
  }, [rideId]);

  const onRefresh = () => {
    setRefreshing(true);

    loadJourney(false);
  };

  const openPassengerProfile = (passengerId: string) => {
    router.push({
      pathname: "/profile/[id]" as any,

      params: {
        id: passengerId,

        viewAs: "passenger",
      },
    });
  };

  const openDriverProfile = () => {
    router.push({
      pathname: "/profile/[id]" as any,

      params: {
        id: journey.ride.driver_id,

        viewAs: "driver",
      },
    });
  };

  const openSafetyMode = () => {
    if (!journey.booking) {
      return;
    }

    router.push({
      pathname: "/safety/[bookingId]",

      params: {
        bookingId: journey.booking.id,
      },
    });
  };

  const triggerSOS = () => {
    if (!journey.booking) {
      return;
    }

    Alert.alert(
      "Emergency SOS",

      "Trigger SOS and notify your trusted contacts?",

      [
        {
          text: "Cancel",

          style: "cancel",
        },

        {
          text: "Trigger SOS",

          style: "destructive",

          onPress: async () => {
            router.push({
              pathname: "/safety/[bookingId]",

              params: {
                bookingId: journey.booking.id,

                openSOS: "true",
              },
            });
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />

        <Text style={styles.loadingText}>Loading journey...</Text>
      </View>
    );
  }

  if (!journey) {
    return (
      <View style={styles.centered}>
        <Ionicons
          name="navigate-circle-outline"
          size={54}
          color={colors.textMuted}
        />

        <Text style={styles.emptyTitle}>Journey unavailable</Text>
      </View>
    );
  }

  const {
    role,

    ride,

    booking,

    passengers,

    driver,

    vehicle,

    tracking,
  } = journey;

  const isDriver = role === "driver";

  const progress = clampProgress(tracking?.progress_percentage);

  const rideDistance = Number(ride.route_distance_km || 0);

  const remainingDistance = Number(
    tracking?.distance_to_destination_km ?? rideDistance,
  );

  const travelledDistance = Math.max(
    0,

    rideDistance - remainingDistance,
  );

  const passengerPickupProgress = Number(booking?.pickup_route_progress || 0);

  const passengerDropProgress = Number(booking?.drop_route_progress || 100);

  const passengerProgressRange =
    passengerDropProgress - passengerPickupProgress;

  const passengerJourneyProgress =
    passengerProgressRange > 0
      ? clampProgress(
          ((progress - passengerPickupProgress) / passengerProgressRange) * 100,
        )
      : progress;

  const displayProgress = isDriver ? progress : passengerJourneyProgress;

  const passengerPickup = booking?.pickup_name || ride.source;

  const passengerDrop = booking?.drop_name || ride.destination;

  const routeSource = isDriver ? ride.source : passengerPickup;

  const routeDestination = isDriver ? ride.destination : passengerDrop;

  const nextPassenger = passengers?.find(
    (passenger: any) =>
      !passenger.boarding_verified &&
      Number(passenger.pickup_route_progress || 0) >= progress,
  );

  const safetyActive = tracking?.tracking_mode === "safety";

  return (
    <Animated.View
      style={[
        styles.screen,

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              {isDriver ? "DRIVER JOURNEY" : "MY JOURNEY"}
            </Text>

            <Text style={styles.title}>Journey in progress</Text>
          </View>

          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />

            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.routeRow}>
            <View style={styles.routeVisual}>
              <View style={[styles.routeDot, styles.pickupDot]} />

              <View style={styles.routeLine} />

              <View style={[styles.routeDot, styles.dropDot]} />
            </View>

            <View style={styles.routeContent}>
              <View>
                <Text style={styles.routeLabel}>
                  {isDriver ? "START" : "YOUR PICKUP"}
                </Text>

                <Text style={styles.routeName} numberOfLines={2}>
                  {routeSource}
                </Text>
              </View>

              <View style={styles.routeGap} />

              <View>
                <Text style={styles.routeLabel}>
                  {isDriver ? "DESTINATION" : "YOUR DROP"}
                </Text>

                <Text style={styles.routeName} numberOfLines={2}>
                  {routeDestination}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Journey progress</Text>

            <Text style={styles.progressValue}>
              {Math.round(displayProgress)}%
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,

                {
                  width: `${displayProgress}%` as any,
                },
              ]}
            />
          </View>

          <View style={styles.distanceRow}>
            <View style={styles.distanceItem}>
              <Text style={styles.distanceValue}>
                {travelledDistance.toFixed(1)}
              </Text>

              <Text style={styles.distanceLabel}>km travelled</Text>
            </View>

            <View style={styles.distanceDivider} />

            <View style={styles.distanceItem}>
              <Text style={styles.distanceValue}>
                {remainingDistance.toFixed(1)}
              </Text>

              <Text style={styles.distanceLabel}>km remaining</Text>
            </View>
          </View>
        </View>

        {!isDriver &&
          booking &&
          !booking.boarding_verified &&
          booking.boarding_pin && (
            <View style={styles.boardingPinCard}>
              <View style={styles.boardingPinIcon}>
                <Ionicons
                  name="keypad-outline"
                  size={23}
                  color={colors.primary}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.boardingPinLabel}>YOUR BOARDING PIN</Text>

                <Text style={styles.boardingPinValue}>
                  {booking.boarding_pin}
                </Text>

                <Text style={styles.boardingPinHint}>
                  Share this PIN with the driver only after entering the vehicle
                </Text>
              </View>
            </View>
          )}

        {isDriver && nextPassenger && (
          <View style={styles.card}>
            <SectionTitle icon="location-outline" title="Next passenger stop" />

            <View style={styles.nextStopRow}>
              <View style={styles.nextStopIcon}>
                <Ionicons
                  name="person-add-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.nextStopLabel}>PICKUP</Text>

                <Text style={styles.nextStopName} numberOfLines={2}>
                  {nextPassenger.pickup_name || ride.source}
                </Text>

                <Text style={styles.nextStopPassenger}>
                  {nextPassenger.profiles?.full_name || "Passenger"} •{" "}
                  {nextPassenger.seats_booked} seat
                  {Number(nextPassenger.seats_booked) > 1 ? "s" : ""}
                </Text>
              </View>

              <View style={styles.progressPill}>
                <Text style={styles.progressPillText}>
                  {Math.round(Number(nextPassenger.pickup_route_progress || 0))}
                  %
                </Text>
              </View>
            </View>
          </View>
        )}

        {!isDriver && (
          <View style={styles.card}>
            <SectionTitle icon="shield-checkmark-outline" title="Ride safety" />

            <View
              style={[
                styles.safetyStatus,

                safetyActive && styles.safetyStatusActive,
              ]}
            >
              <View style={styles.safetyIcon}>
                <Ionicons
                  name={safetyActive ? "shield-checkmark" : "shield-outline"}
                  size={24}
                  color={safetyActive ? colors.success : colors.textMuted}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.safetyTitle}>
                  {safetyActive
                    ? "Safety tracking active"
                    : "Journey monitoring active"}
                </Text>

                <Text style={styles.safetySubtitle}>
                  {trustedContactCount} trusted contact
                  {trustedContactCount !== 1 ? "s" : ""} connected
                </Text>
              </View>

              <View
                style={[
                  styles.statusDot,

                  {
                    backgroundColor: tracking?.route_deviation
                      ? colors.danger
                      : colors.success,
                  },
                ]}
              />
            </View>

            <View style={styles.safetyMetaRow}>
              <Ionicons
                name={
                  tracking?.route_deviation
                    ? "warning-outline"
                    : "checkmark-circle-outline"
                }
                size={17}
                color={
                  tracking?.route_deviation ? colors.danger : colors.success
                }
              />

              <Text
                style={[
                  styles.safetyMetaText,

                  tracking?.route_deviation && {
                    color: colors.danger,
                  },
                ]}
              >
                {tracking?.route_deviation
                  ? "Possible route deviation detected"
                  : "No route deviation detected"}
              </Text>
            </View>

            <PressScale onPress={openSafetyMode} style={styles.safetyButton}>
              <Ionicons
                name="shield-checkmark"
                size={18}
                color={colors.primary}
              />

              <Text style={styles.safetyButtonText}>Open Safety Mode</Text>

              <Ionicons
                name="chevron-forward"
                size={17}
                color={colors.primary}
              />
            </PressScale>
          </View>
        )}

        {!isDriver && (
          <PressScale onPress={openDriverProfile} style={styles.card}>
            <SectionTitle icon="person-outline" title="Driver" />

            <View style={styles.personRow}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color={colors.primary} />
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.personName}>
                    {driver?.full_name || "Driver"}
                  </Text>

                  {driver?.driver_verification_status === "approved" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={17}
                      color={colors.success}
                    />
                  )}
                </View>

                <Text style={styles.personMeta}>Verified driver</Text>

                {vehicle && (
                  <Text style={styles.vehicleText}>
                    {vehicle.vehicle_name} • {vehicle.vehicle_number}
                  </Text>
                )}
              </View>

              <Ionicons
                name="chevron-forward"
                size={19}
                color={colors.textMuted}
              />
            </View>
          </PressScale>
        )}

        {isDriver && (
          <View style={styles.card}>
            <SectionTitle
              icon="people-outline"
              title={`Passengers · ${passengers?.length || 0}`}
            />

            {passengers?.length === 0 ? (
              <View style={styles.noPassengers}>
                <Ionicons
                  name="people-outline"
                  size={28}
                  color={colors.textMuted}
                />

                <Text style={styles.noPassengersText}>
                  No passengers on this journey
                </Text>
              </View>
            ) : (
              passengers.map((passenger: any, index: number) => {
                const boarded = passenger.boarding_verified;

                const pickupProgress = Number(
                  passenger.pickup_route_progress || 0,
                );

                const dropProgress = Number(
                  passenger.drop_route_progress || 100,
                );

                const dropped = progress >= dropProgress;

                const upcoming = progress < pickupProgress;

                let status = "Travelling";

                if (dropped) {
                  status = "Drop reached";
                } else if (upcoming) {
                  status = "Waiting for pickup";
                } else if (!boarded) {
                  status = "Boarding pending";
                }

                return (
                  <PressScale
                    key={passenger.id}
                    onPress={() => {
                      if (!passenger.boarding_verified) {
                        router.push({
                          pathname: "/journey/boarding/[bookingId]" as any,

                          params: {
                            bookingId: passenger.id,
                          },
                        });

                        return;
                      }

                      openPassengerProfile(passenger.passenger_id);
                    }}
                    style={[
                      styles.passengerCard,

                      index > 0 && {
                        marginTop: spacing.sm,
                      },
                    ]}
                  >
                    <View style={styles.passengerTop}>
                      <View style={styles.passengerAvatar}>
                        <Ionicons
                          name="person"
                          size={20}
                          color={colors.primary}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.passengerName}>
                          {passenger.profiles?.full_name || "Passenger"}
                        </Text>

                        <Text style={styles.passengerSeats}>
                          {passenger.seats_booked} seat
                          {Number(passenger.seats_booked) > 1 ? "s" : ""}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.passengerStatus,

                          boarded && styles.passengerStatusActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.passengerStatusText,

                            boarded && {
                              color: colors.success,
                            },
                          ]}
                        >
                          {status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.passengerRoute}>
                      <View style={styles.smallRouteDot} />

                      <Text style={styles.passengerRouteText} numberOfLines={1}>
                        {passenger.pickup_name || ride.source}
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={13}
                        color={colors.textMuted}
                      />

                      <Text style={styles.passengerRouteText} numberOfLines={1}>
                        {passenger.drop_name || ride.destination}
                      </Text>
                    </View>

                    <View style={styles.segmentProgressRow}>
                      <Text style={styles.segmentProgressText}>
                        {Math.round(pickupProgress)}%
                      </Text>

                      <View style={styles.segmentLine} />

                      <Text style={styles.segmentProgressText}>
                        {Math.round(dropProgress)}%
                      </Text>
                    </View>
                    {!passenger.boarding_verified && (
                      <View style={styles.verifyPassengerRow}>
                        <Ionicons
                          name="keypad-outline"
                          size={16}
                          color={colors.primary}
                        />

                        <Text style={styles.verifyPassengerText}>
                          Tap to verify boarding PIN
                        </Text>

                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={colors.primary}
                        />
                      </View>
                    )}

                    {passenger.boarding_verified && (
                      <View style={styles.boardedPassengerRow}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={colors.success}
                        />

                        <Text style={styles.boardedPassengerText}>
                          Passenger boarded
                        </Text>
                      </View>
                    )}
                  </PressScale>
                );
              })
            )}
          </View>
        )}

        <View style={styles.card}>
          <SectionTitle icon="pulse-outline" title="Ride status" />

          <View style={styles.statusRow}>
            <View style={styles.statusIcon}>
              <Ionicons name="radio" size={18} color={colors.success} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>
                {formatStatus(ride.ride_status)}
              </Text>

              <Text style={styles.statusSubtitle}>
                Last location update{" "}
                {tracking?.last_location_at
                  ? new Date(tracking.last_location_at).toLocaleTimeString()
                  : "unavailable"}
              </Text>
            </View>
          </View>

          <View style={styles.trackingInfo}>
            <View style={styles.trackingItem}>
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={18}
                color={colors.primary}
              />

              <Text style={styles.trackingValue}>
                {tracking?.tracking_mode || "normal"}
              </Text>

              <Text style={styles.trackingLabel}>Tracking</Text>
            </View>

            <View style={styles.trackingItem}>
              <Ionicons name="flag-outline" size={18} color={colors.primary} />

              <Text style={styles.trackingValue}>
                {tracking?.last_checkpoint ?? 0}
              </Text>

              <Text style={styles.trackingLabel}>Checkpoint</Text>
            </View>

            <View style={styles.trackingItem}>
              <Feather name="navigation" size={17} color={colors.primary} />

              <Text style={styles.trackingValue}>{Math.round(progress)}%</Text>

              <Text style={styles.trackingLabel}>Route</Text>
            </View>
          </View>
        </View>

        {!isDriver && (
          <PressScale onPress={triggerSOS} style={styles.sosButton}>
            <View style={styles.sosIcon}>
              <MaterialCommunityIcons
                name="alarm-light"
                size={24}
                color="#FFFFFF"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.sosTitle}>SOS Emergency</Text>

              <Text style={styles.sosSubtitle}>
                Alert trusted contacts and share journey status
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </PressScale>
        )}

        <Text style={styles.footerText}>
          Journey updates are synced automatically
        </Text>
      </ScrollView>
    </Animated.View>
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

    paddingBottom: spacing.xl * 2,
  },

  centered: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: colors.surfaceMuted,

    padding: spacing.xl,
  },

  loadingText: {
    marginTop: spacing.sm,

    color: colors.textMuted,

    fontSize: 13,
  },

  emptyTitle: {
    marginTop: spacing.md,

    fontSize: 18,

    fontWeight: "800",

    color: colors.textPrimary,
  },

  header: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: spacing.lg,
  },

  eyebrow: {
    fontSize: 10,

    fontWeight: "800",

    color: colors.primary,

    letterSpacing: 1.2,
  },

  title: {
    ...typography.title,

    fontSize: 25,

    marginTop: 3,
  },

  liveBadge: {
    flexDirection: "row",

    alignItems: "center",

    gap: 6,

    backgroundColor: colors.successLight,

    paddingHorizontal: 10,

    paddingVertical: 7,

    borderRadius: radius.full,
  },

  liveDot: {
    width: 7,

    height: 7,

    borderRadius: 4,

    backgroundColor: colors.success,
  },

  liveText: {
    fontSize: 10,

    fontWeight: "900",

    color: colors.success,

    letterSpacing: 0.7,
  },

  heroCard: {
    backgroundColor: colors.surface,

    borderRadius: radius.lg,

    borderWidth: 1,

    borderColor: colors.border,

    padding: spacing.lg,

    marginBottom: spacing.md,

    ...shadow.card,
  },

  routeRow: {
    flexDirection: "row",
  },

  routeVisual: {
    width: 18,

    alignItems: "center",

    marginRight: spacing.sm,
  },

  routeDot: {
    width: 11,

    height: 11,

    borderRadius: 6,
  },

  pickupDot: {
    backgroundColor: colors.primary,
  },

  dropDot: {
    backgroundColor: colors.danger,
  },

  routeLine: {
    width: 2,

    flex: 1,

    minHeight: 43,

    backgroundColor: colors.border,

    marginVertical: 4,
  },

  routeContent: {
    flex: 1,
  },

  routeGap: {
    height: 17,
  },

  routeLabel: {
    fontSize: 9,

    fontWeight: "800",

    color: colors.textMuted,

    letterSpacing: 0.8,
  },

  routeName: {
    fontSize: 16,

    fontWeight: "800",

    color: colors.textPrimary,

    marginTop: 2,
  },

  progressHeader: {
    flexDirection: "row",

    justifyContent: "space-between",

    marginTop: spacing.lg,
  },

  progressLabel: {
    fontSize: 12,

    fontWeight: "700",

    color: colors.textSecondary,
  },

  progressValue: {
    fontSize: 14,

    fontWeight: "900",

    color: colors.primary,
  },

  progressTrack: {
    height: 9,

    backgroundColor: colors.surfaceMuted,

    borderRadius: radius.full,

    overflow: "hidden",

    marginTop: spacing.sm,
  },

  progressFill: {
    height: "100%",

    backgroundColor: colors.primary,

    borderRadius: radius.full,
  },

  distanceRow: {
    flexDirection: "row",

    marginTop: spacing.lg,
  },

  distanceItem: {
    flex: 1,

    alignItems: "center",
  },

  distanceValue: {
    fontSize: 20,

    fontWeight: "900",

    color: colors.textPrimary,
  },

  distanceLabel: {
    fontSize: 10,

    color: colors.textMuted,

    marginTop: 2,
  },

  distanceDivider: {
    width: 1,

    backgroundColor: colors.border,
  },

  trackingButton: {
    minHeight: 68,

    borderRadius: radius.lg,

    backgroundColor: colors.primary,

    flexDirection: "row",

    alignItems: "center",

    gap: spacing.sm,

    paddingHorizontal: spacing.md,

    paddingVertical: spacing.md,

    marginBottom: spacing.md,

    ...shadow.card,
  },

  trackingButtonActive: {
    backgroundColor: colors.success,
  },

  trackingButtonText: {
    color: colors.surface,

    fontSize: 14,

    fontWeight: "800",
  },

  trackingButtonSubtitle: {
    color: "rgba(255,255,255,0.78)",

    fontSize: 10,

    marginTop: 3,
  },

  card: {
    backgroundColor: colors.surface,

    borderRadius: radius.lg,

    borderWidth: 1,

    borderColor: colors.border,

    padding: spacing.md,

    marginBottom: spacing.md,

    ...shadow.card,
  },

  sectionTitleRow: {
    flexDirection: "row",

    alignItems: "center",

    gap: 7,

    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontSize: 13,

    fontWeight: "800",

    color: colors.textPrimary,
  },

  nextStopRow: {
    flexDirection: "row",

    alignItems: "center",
  },

  nextStopIcon: {
    width: 46,

    height: 46,

    borderRadius: radius.md,

    backgroundColor: colors.primaryLight,

    alignItems: "center",

    justifyContent: "center",

    marginRight: spacing.sm,
  },

  nextStopLabel: {
    fontSize: 9,

    fontWeight: "800",

    color: colors.primary,

    letterSpacing: 0.8,
  },

  nextStopName: {
    fontSize: 15,

    fontWeight: "800",

    color: colors.textPrimary,

    marginTop: 2,
  },

  nextStopPassenger: {
    fontSize: 11,

    color: colors.textSecondary,

    marginTop: 3,
  },

  progressPill: {
    backgroundColor: colors.primaryLight,

    borderRadius: radius.full,

    paddingHorizontal: 9,

    paddingVertical: 6,
  },

  progressPillText: {
    color: colors.primary,

    fontSize: 11,

    fontWeight: "800",
  },

  safetyStatus: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: colors.surfaceMuted,

    borderRadius: radius.md,

    padding: spacing.md,
  },

  safetyStatusActive: {
    backgroundColor: colors.successLight,
  },

  safetyIcon: {
    width: 42,

    height: 42,

    borderRadius: radius.md,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",

    marginRight: spacing.sm,
  },

  safetyTitle: {
    fontSize: 13,

    fontWeight: "800",

    color: colors.textPrimary,
  },

  safetySubtitle: {
    fontSize: 11,

    color: colors.textSecondary,

    marginTop: 3,
  },

  statusDot: {
    width: 9,

    height: 9,

    borderRadius: 5,
  },

  safetyMetaRow: {
    flexDirection: "row",

    alignItems: "center",

    gap: 7,

    marginTop: spacing.md,
  },

  safetyMetaText: {
    fontSize: 12,

    fontWeight: "600",

    color: colors.success,
  },

  safetyButton: {
    height: 45,

    borderRadius: radius.md,

    backgroundColor: colors.primaryLight,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: spacing.md,

    gap: spacing.sm,

    marginTop: spacing.md,
  },

  safetyButtonText: {
    flex: 1,

    color: colors.primary,

    fontSize: 13,

    fontWeight: "800",
  },

  personRow: {
    flexDirection: "row",

    alignItems: "center",
  },

  avatar: {
    width: 48,

    height: 48,

    borderRadius: radius.full,

    backgroundColor: colors.primaryLight,

    alignItems: "center",

    justifyContent: "center",

    marginRight: spacing.sm,
  },

  nameRow: {
    flexDirection: "row",

    alignItems: "center",

    gap: 5,
  },

  personName: {
    fontSize: 15,

    fontWeight: "800",

    color: colors.textPrimary,
  },

  personMeta: {
    fontSize: 11,

    color: colors.textSecondary,

    marginTop: 2,
  },

  vehicleText: {
    fontSize: 11,

    color: colors.textMuted,

    marginTop: 3,
  },

  noPassengers: {
    alignItems: "center",

    paddingVertical: spacing.lg,
  },

  noPassengersText: {
    color: colors.textMuted,

    fontSize: 12,

    marginTop: spacing.sm,
  },

  passengerCard: {
    backgroundColor: colors.surfaceMuted,

    borderRadius: radius.md,

    padding: spacing.md,
  },

  passengerTop: {
    flexDirection: "row",

    alignItems: "center",
  },

  passengerAvatar: {
    width: 39,

    height: 39,

    borderRadius: radius.full,

    backgroundColor: colors.primaryLight,

    alignItems: "center",

    justifyContent: "center",

    marginRight: spacing.sm,
  },

  passengerName: {
    fontSize: 13,

    fontWeight: "800",

    color: colors.textPrimary,
  },

  passengerSeats: {
    fontSize: 10,

    color: colors.textMuted,

    marginTop: 2,
  },

  passengerStatus: {
    backgroundColor: colors.surface,

    borderRadius: radius.full,

    paddingHorizontal: 8,

    paddingVertical: 5,
  },

  passengerStatusActive: {
    backgroundColor: colors.successLight,
  },

  passengerStatusText: {
    fontSize: 9,

    fontWeight: "800",

    color: colors.textSecondary,
  },

  passengerRoute: {
    flexDirection: "row",

    alignItems: "center",

    gap: 6,

    marginTop: spacing.md,
  },

  smallRouteDot: {
    width: 7,

    height: 7,

    borderRadius: 4,

    backgroundColor: colors.primary,
  },

  passengerRouteText: {
    flex: 1,

    fontSize: 10,

    color: colors.textSecondary,
  },

  segmentProgressRow: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: spacing.sm,
  },

  segmentProgressText: {
    fontSize: 9,

    fontWeight: "800",

    color: colors.textMuted,
  },

  segmentLine: {
    height: 2,

    flex: 1,

    backgroundColor: colors.border,

    marginHorizontal: spacing.sm,
  },

  statusRow: {
    flexDirection: "row",

    alignItems: "center",
  },

  statusIcon: {
    width: 42,

    height: 42,

    borderRadius: radius.md,

    backgroundColor: colors.successLight,

    alignItems: "center",

    justifyContent: "center",

    marginRight: spacing.sm,
  },

  statusTitle: {
    fontSize: 14,

    fontWeight: "800",

    color: colors.textPrimary,
  },

  statusSubtitle: {
    fontSize: 10,

    color: colors.textMuted,

    marginTop: 3,
  },

  trackingInfo: {
    flexDirection: "row",

    marginTop: spacing.lg,

    borderTopWidth: 1,

    borderTopColor: colors.border,

    paddingTop: spacing.md,
  },

  trackingItem: {
    flex: 1,

    alignItems: "center",
  },

  trackingValue: {
    fontSize: 13,

    fontWeight: "800",

    color: colors.textPrimary,

    marginTop: 5,

    textTransform: "capitalize",
  },

  trackingLabel: {
    fontSize: 9,

    color: colors.textMuted,

    marginTop: 2,
  },

  sosButton: {
    minHeight: 76,

    borderRadius: radius.lg,

    backgroundColor: colors.danger,

    flexDirection: "row",

    alignItems: "center",

    padding: spacing.md,

    marginBottom: spacing.md,

    ...shadow.card,
  },

  sosIcon: {
    width: 46,

    height: 46,

    borderRadius: radius.md,

    backgroundColor: "rgba(255,255,255,0.16)",

    alignItems: "center",

    justifyContent: "center",

    marginRight: spacing.md,
  },

  sosTitle: {
    color: "#FFFFFF",

    fontSize: 15,

    fontWeight: "900",
  },

  sosSubtitle: {
    color: "rgba(255,255,255,0.78)",

    fontSize: 10,

    marginTop: 3,
  },

  footerText: {
    textAlign: "center",

    color: colors.textMuted,

    fontSize: 10,

    marginTop: spacing.sm,
  },
  verifyPassengerRow: {
    flexDirection: "row",

    alignItems: "center",

    gap: spacing.sm,

    backgroundColor: colors.primaryLight,

    borderRadius: radius.md,

    paddingHorizontal: spacing.md,

    paddingVertical: spacing.sm,

    marginTop: spacing.md,
  },

  verifyPassengerText: {
    flex: 1,

    fontSize: 11,

    fontWeight: "800",

    color: colors.primary,
  },

  boardedPassengerRow: {
    flexDirection: "row",

    alignItems: "center",

    gap: spacing.sm,

    backgroundColor: colors.successLight,

    borderRadius: radius.md,

    paddingHorizontal: spacing.md,

    paddingVertical: spacing.sm,

    marginTop: spacing.md,
  },

  boardedPassengerText: {
    fontSize: 11,

    fontWeight: "800",

    color: colors.success,
  },
  boardingPinCard: {
    flexDirection: "row",

    backgroundColor: colors.surface,

    borderRadius: radius.lg,

    borderWidth: 1,

    borderColor: colors.primary,

    padding: spacing.md,

    marginBottom: spacing.md,

    ...shadow.card,
  },

  boardingPinIcon: {
    width: 48,

    height: 48,

    borderRadius: radius.md,

    backgroundColor: colors.primaryLight,

    alignItems: "center",

    justifyContent: "center",

    marginRight: spacing.md,
  },

  boardingPinLabel: {
    fontSize: 9,

    fontWeight: "900",

    color: colors.primary,

    letterSpacing: 1,
  },

  boardingPinValue: {
    fontSize: 28,

    fontWeight: "900",

    color: colors.textPrimary,

    letterSpacing: 8,

    marginTop: 3,
  },

  boardingPinHint: {
    fontSize: 10,

    color: colors.textMuted,

    lineHeight: 15,

    marginTop: 4,
  },
});
