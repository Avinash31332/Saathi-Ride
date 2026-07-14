import BoardedPassengersDropCard from "@/components/journey/BoardedPassengersDropCard";
import BoardingPinCard from "@/components/journey/BoardingPinCard";
import JourneyDriverCard from "@/components/journey/JourneyDriverCard";
import JourneyHeader from "@/components/journey/JourneyHeader";
import JourneyHeroCard from "@/components/journey/JourneyHeroCard";
import JourneyPassengerList from "@/components/journey/JourneyPassengerList";
import JourneySafetyCard from "@/components/journey/JourneySafetyCard";
import JourneySOSButton from "@/components/journey/JourneySOSButton";
import JourneyStartCard from "@/components/journey/JourneyStartCard";
import JourneyStatusCard from "@/components/journey/JourneyStatusCard";
import NextPassengerCard from "@/components/journey/NextPassengerCard";
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

import useDriverJourneyTracking from "@/hooks/useDriverJourneyTracking";

import { colors, spacing } from "@/constants/theme";

import { getJourneyMilestones } from "@/services/journey-progress.service";

import {
  canStartJourney,
  startJourney,
} from "@/services/journey-state.service";

import {
  getJourneyData,
  getTrustedContactCount,
  removeJourneySubscription,
  subscribeToJourney,
} from "@/services/journey.service";

import {
  activateSafetyMode,
  getSafetySession,
  removeSafetySubscription,
  SafetySession,
  subscribeToSafetySession,
} from "@/services/safety.service";

import PassengerDropRequestBottomSheet from "@/components/bottomSheets/PassengerDropRequestSheet";
import JourneyDropRequestCard from "@/components/journey/JourneyDropRequestCard";
import { useEventService } from "@/services/event.service";
import * as SafetyService from "@/services/safety.service";

console.log("Safety exports:", Object.keys(SafetyService));

console.log(
  "subscribeToSafetySession:",
  (SafetyService as any).subscribeToSafetySession,
);
function clampProgress(value: any) {
  const progress = Number(value || 0);

  return Math.min(100, Math.max(0, progress));
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

  const [safetySession, setSafetySession] = useState<SafetySession | null>(
    null,
  );

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [startingJourney, setStartingJourney] = useState(false);

  const [trustedContactCount, setTrustedContactCount] = useState(0);

  const safetyRecoveryRunning = useRef(false);

  const fade = useRef(new Animated.Value(0)).current;

  const slide = useRef(new Animated.Value(18)).current;
  const bottomSheetRef = useRef<any>(null);
  /*
   * LOAD SAFETY SESSION
   */

  const { showPassengerDropReason } = useEventService();

  const openDropRequest = () => {
    if (!booking) return;

    showPassengerDropReason({
      bookingId: booking.id,
      rideId: ride.id,
    });
  };

  const loadSafetySession = useCallback(async (bookingId: string) => {
    try {
      const { data, error } = await getSafetySession(bookingId);

      if (error) {
        console.log("LOAD SAFETY SESSION ERROR:", error);

        return null;
      }

      setSafetySession(data as SafetySession | null);

      return data as SafetySession | null;
    } catch (error) {
      console.log("LOAD SAFETY SESSION EXCEPTION:", error);

      return null;
    }
  }, []);

  /*
   * SAFETY RECOVERY
   *
   * Boarding can succeed while safety activation
   * fails because of network interruption.
   *
   * If passenger is already boarded and the safety
   * session does not exist/is inactive, retry the
   * activation RPC.
   */

  const recoverSafetyMode = useCallback(
    async (booking: any) => {
      if (!booking?.id) {
        return;
      }

      if (!booking.boarding_verified) {
        return;
      }

      if (booking.passenger_dropped_at) {
        return;
      }

      if (safetyRecoveryRunning.current) {
        return;
      }

      safetyRecoveryRunning.current = true;

      try {
        const currentSession = await loadSafetySession(booking.id);

        if (
          currentSession?.safety_mode_enabled &&
          currentSession?.safety_status === "active"
        ) {
          console.log("SAFETY RECOVERY: ALREADY ACTIVE");

          return;
        }

        console.log("SAFETY RECOVERY: ACTIVATING", booking.id);

        const { error } = await activateSafetyMode(booking.id);

        if (error) {
          console.log("SAFETY RECOVERY ACTIVATION ERROR:", error);

          return;
        }

        console.log("SAFETY RECOVERY: ACTIVATED", booking.id);

        await loadSafetySession(booking.id);
      } catch (error) {
        console.log("SAFETY RECOVERY EXCEPTION:", error);
      } finally {
        safetyRecoveryRunning.current = false;
      }
    },
    [loadSafetySession],
  );

  /*
   * LOAD JOURNEY
   */

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

        if (data?.role === "passenger" && data?.booking) {
          const { count, error: contactError } = await getTrustedContactCount();

          if (contactError) {
            console.log("TRUSTED CONTACT COUNT ERROR:", contactError);
          }

          setTrustedContactCount(count || 0);

          await recoverSafetyMode(data.booking);
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
    [rideId, recoverSafetyMode],
  );

  /*
   * JOURNEY REALTIME
   */

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

  /*
   * SAFETY REALTIME
   */

  useEffect(() => {
    const bookingId = journey?.booking?.id;

    if (!bookingId) {
      return;
    }

    loadSafetySession(bookingId);

    let channel: any = null;

    subscribeToSafetySession(bookingId, (session) => {
      console.log("SAFETY SESSION REALTIME UPDATE:", session.safety_status);

      setSafetySession(session);
    }).then((createdChannel) => {
      channel = createdChannel;
    });

    return () => {
      if (channel) {
        removeSafetySubscription(channel);
      }
    };
  }, [journey?.booking?.id, loadSafetySession]);

  /*
   * START JOURNEY
   */

  const onStartJourney = async () => {
    if (startingJourney) {
      return;
    }

    setStartingJourney(true);

    try {
      const validation = await canStartJourney(rideId);

      if (!validation.canStart) {
        Alert.alert(
          "Journey cannot start",
          "This ride is no longer in scheduled state.",
        );

        return;
      }

      const result = await startJourney(rideId);

      if (result.error) {
        throw result.error;
      }

      Alert.alert("Journey Started", "Passengers have been notified.");

      await loadJourney(false);
    } catch (error: any) {
      Alert.alert(
        "Unable to start journey",
        error?.message ?? "Something went wrong",
      );
    } finally {
      setStartingJourney(false);
    }
  };

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

  /*
   * LOADING
   */

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

  const milestones = getJourneyMilestones(displayProgress);

  const passengerPickup = booking?.pickup_name || ride.source;

  const passengerDrop = booking?.drop_name || ride.destination;

  const routeSource = isDriver ? ride.source : passengerPickup;

  const routeDestination = isDriver ? ride.destination : passengerDrop;

  const nextPassenger = passengers.find(
    (passenger: any) =>
      !passenger.boarding_verified &&
      Number(passenger.pickup_route_progress || 0) >= progress,
  );

  /*
   * SAFETY STATUS MUST COME FROM SAFETY SESSION.
   *
   * tracking_mode belongs to driver tracking and
   * must not be used as passenger Safety Mode state.
   */

  const safetyActive =
    safetySession?.safety_mode_enabled === true &&
    safetySession?.safety_status === "active";

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
      {ride?.ride_status === "active" && (
        <DriverTrackingController
          rideId={rideId}
          isDriver={isDriver}
          rideStatus={ride?.ride_status}
          trackingMode={tracking?.tracking_mode}
        />
      )}

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
          milestones={milestones}
          originalSource={ride.source}
          originalDestination={ride.destination}
          pickupProgress={booking?.pickup_route_progress}
          dropProgress={booking?.drop_route_progress}
          boarded={booking?.boarding_verified}
        />

        {isDriver && ride?.ride_status === "scheduled" && (
          <JourneyStartCard
            loading={startingJourney}
            onStart={onStartJourney}
          />
        )}

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
            routeDeviation={Boolean(
              safetySession?.route_deviation_detected ||
              tracking?.route_deviation,
            )}
            onPress={openSafetyMode}
          />
        )}
        {!isDriver && (
          <>
            <JourneyDriverCard
              driver={driver}
              vehicle={vehicle}
              onPress={openDriverProfile}
            />

            {booking?.boarding_verified &&
              !booking?.passenger_dropped_at &&
              ride?.ride_status === "active" && (
                <JourneyDropRequestCard onPress={openDropRequest} />
              )}
          </>
        )}
        {isDriver && (
          <>
            <JourneyPassengerList
              passengers={passengers}
              progress={progress}
              rideSource={ride.source}
              rideDestination={ride.destination}
              onVerifyBoarding={openBoardingVerification}
              onPassengerPress={openPassengerProfile}
            />

            <BoardedPassengersDropCard passengers={passengers} />
          </>
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
      <PassengerDropRequestBottomSheet
        ref={bottomSheetRef}
        booking={booking}
        ride={ride}
      />
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

  footerText: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 10,
    marginTop: spacing.sm,
  },
});
