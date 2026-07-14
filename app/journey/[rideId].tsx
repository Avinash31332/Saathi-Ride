import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import BoardingPinCard from "@/components/journey/BoardingPinCard";
import JourneyDriverCard from "@/components/journey/JourneyDriverCard";
import JourneyHeader from "@/components/journey/JourneyHeader";
import JourneyHeroCard from "@/components/journey/JourneyHeroCard";
import JourneyPassengerList from "@/components/journey/JourneyPassengerList";
import JourneySafetyCard from "@/components/journey/JourneySafetyCard";
import JourneyStatusCard from "@/components/journey/JourneyStatusCard";
import NextPassengerCard from "@/components/journey/NextPassengerCard";
import useDriverJourneyTracking from "@/hooks/useDriverJourneyTracking";

import { colors, radius, shadow, spacing } from "@/constants/theme";

import JourneySOSButton from "@/components/journey/JourneySOSButton";
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

function formatStatus(status?: string) {
  if (!status) {
    return "Unknown";
  }

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function DriverTrackingController({
  rideId,
  isDriver,
  rideStatus,
  trackingMode,
}: {
  rideId: string;
  isDriver: boolean;
  rideStatus?: string | null;
  trackingMode?: "normal" | "safety" | null;
}) {
  useDriverJourneyTracking({
    rideId,
    isDriver,
    rideStatus,
    trackingMode,
  });

  return null;
}

export default function JourneyScreen() {
  const params = useLocalSearchParams();

  const rideId = String(params.rideId);

  const [journey, setJourney] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [trustedContactCount, setTrustedContactCount] = useState(0);

  const fade = useRef(new Animated.Value(0)).current;

  const slide = useRef(new Animated.Value(18)).current;

  const loadJourney = useCallback(
    async (showLoader = false) => {
      if (showLoader) {
        setLoading(true);
      }

      try {
        const { data, error } = await getJourneyData(rideId);

        if (error) {
          console.log("LOAD JOURNEY ERROR:", error);

          Alert.alert(
            "Unable to load journey",
            error?.message || "Journey could not be loaded",
          );

          return;
        }

        setJourney(data);

        if (data?.role === "passenger") {
          const { count, error: trustedContactError } =
            await getTrustedContactCount();

          if (trustedContactError) {
            console.log("TRUSTED CONTACT COUNT ERROR:", trustedContactError);
          }

          setTrustedContactCount(count || 0);
        }
      } catch (error: any) {
        console.log("LOAD JOURNEY EXCEPTION:", error);

        Alert.alert(
          "Unable to load journey",
          error?.message || "Something went wrong",
        );
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
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

    const channel = subscribeToJourney(rideId, () => {
      loadJourney(false);
    });

    return () => {
      removeJourneySubscription(channel);
    };
  }, [rideId, loadJourney, fade, slide]);

  const onRefresh = () => {
    setRefreshing(true);

    loadJourney(false);
  };

  const openPassengerProfile = (passengerId: string) => {
    router.push({
      pathname: "/journey/passenger/[passengerId]" as any,

      params: {
        passengerId,
      },
    });
  };

  const openDriverProfile = () => {
    if (!journey?.ride?.driver_id) {
      return;
    }

    router.push({
      pathname: "/journey/profile/[id]" as any,

      params: {
        id: journey.ride.driver_id,
        viewAs: "driver",
      },
    });
  };

  const openBoardingVerification = (bookingId: string) => {
    router.push({
      pathname: "/journey/boarding/[bookingId]" as any,

      params: {
        bookingId,
      },
    });
  };

  const openSafetyMode = () => {
    if (!journey?.booking) {
      return;
    }

    router.push({
      pathname: "/safety/[bookingId]" as any,

      params: {
        bookingId: journey.booking.id,
      },
    });
  };

  const triggerSOS = () => {
    if (!journey?.booking) {
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

          onPress: () => {
            router.push({
              pathname: "/safety/[bookingId]" as any,

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
    passengers = [],
    driver,
    vehicle,
    tracking,
  } = journey;

  const isDriver = role === "driver";

  const progress = clampProgress(tracking?.progress_percentage);

  const rideDistance = Number(ride?.route_distance_km || 0);

  const remainingDistance = Math.max(
    0,
    Number(tracking?.distance_to_destination_km ?? rideDistance),
  );

  const travelledDistance = Math.max(0, rideDistance - remainingDistance);

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

  const nextPassenger = passengers.find(
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
      <DriverTrackingController
        rideId={rideId}
        isDriver={isDriver}
        rideStatus={ride?.ride_status}
        trackingMode={tracking?.tracking_mode}
      />
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
        <JourneyHeader isDriver={isDriver} />

        <JourneyHeroCard
          source={routeSource}
          destination={routeDestination}
          progress={displayProgress}
          travelledDistance={travelledDistance}
          remainingDistance={remainingDistance}
          isDriver={isDriver}
        />

        {!isDriver &&
          booking &&
          !booking.boarding_verified &&
          booking.boarding_pin && (
            <BoardingPinCard pin={booking.boarding_pin} />
          )}

        {isDriver && nextPassenger && (
          <NextPassengerCard
            passenger={nextPassenger}
            onPress={() => {
              if (!nextPassenger.boarding_verified) {
                openBoardingVerification(nextPassenger.id);
                return;
              }

              openPassengerProfile(nextPassenger.passenger_id);
            }}
          />
        )}

        {!isDriver && (
          <JourneySafetyCard
            safetyActive={safetyActive}
            trustedContactCount={trustedContactCount}
            routeDeviation={Boolean(tracking?.route_deviation)}
            onPress={openSafetyMode}
          />
        )}

        {!isDriver && (
          <JourneyDriverCard
            driver={driver}
            vehicle={vehicle}
            onPress={openDriverProfile}
          />
        )}

        {isDriver && (
          <JourneyPassengerList
            passengers={passengers}
            progress={progress}
            rideSource={ride.source}
            rideDestination={ride.destination}
            onVerifyBoarding={openBoardingVerification}
            onPassengerPress={openPassengerProfile}
          />
        )}

        <JourneyStatusCard
          rideStatus={ride.ride_status}
          lastLocationAt={tracking?.last_location_at}
          trackingMode={tracking?.tracking_mode}
          lastCheckpoint={tracking?.last_checkpoint}
          progress={progress}
        />

        {!isDriver && <JourneySOSButton onPress={triggerSOS} />}

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

  flex: {
    flex: 1,
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

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
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
    borderRadius: radius.full,
  },

  safetyMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: spacing.md,
  },

  safetyMetaText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: colors.success,
  },

  safetyButton: {
    minHeight: 45,
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

  footerText: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 10,
    marginTop: spacing.sm,
  },
});
