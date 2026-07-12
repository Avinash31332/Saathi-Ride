import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getRideSafetyEvents,
  getRideTracking,
  JourneyTrackingState,
  removeJourneyChannel,
  subscribeToRideSafetyEvents,
  subscribeToRideTracking,
} from "../../../services/journey-tracking.service";

import { supabase } from "../../../services/supabase";

import { colors, radius, spacing, typography } from "../../../constants/theme";

type SafetyEvent = {
  id: string;

  ride_id: string;

  passenger_id: string | null;

  event_type: string;

  progress_percentage: number | null;

  lat: number | null;

  lng: number | null;

  created_at: string;
};

export default function JourneyProgressScreen() {
  const { rideId } = useLocalSearchParams<{
    rideId: string;
  }>();

  const [tracking, setTracking] = useState<JourneyTrackingState | null>(null);

  const [events, setEvents] = useState<SafetyEvent[]>([]);

  const [ride, setRide] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!rideId) {
      return;
    }

    loadJourney();

    const trackingChannel = subscribeToRideTracking(rideId, (newTracking) => {
      setTracking(newTracking);
    });

    const eventChannel = subscribeToRideSafetyEvents(rideId, (newEvent) => {
      setEvents((currentEvents) => {
        const alreadyExists = currentEvents.some(
          (event) => event.id === newEvent.id,
        );

        if (alreadyExists) {
          return currentEvents;
        }

        return [...currentEvents, newEvent];
      });
    });

    return () => {
      removeJourneyChannel(trackingChannel);

      removeJourneyChannel(eventChannel);
    };
  }, [rideId]);

  const loadJourney = async () => {
    if (!rideId) {
      return;
    }

    try {
      const [trackingResponse, eventsResponse, rideResponse] =
        await Promise.all([
          getRideTracking(rideId),

          getRideSafetyEvents(rideId),

          supabase
            .from("rides")
            .select(
              `
            id,
            source,
            destination,
            ride_status,
            ride_date,
            ride_time,
            started_at,
            driver_id,
            women_only
          `,
            )
            .eq("id", rideId)
            .single(),
        ]);

      if (trackingResponse.error) {
        console.log("TRACKING LOAD ERROR:", trackingResponse.error);
      }

      if (eventsResponse.error) {
        console.log("EVENT LOAD ERROR:", eventsResponse.error);
      }

      if (rideResponse.error) {
        console.log("RIDE LOAD ERROR:", rideResponse.error);
      }

      setTracking(trackingResponse.data || null);

      setEvents((eventsResponse.data || []) as SafetyEvent[]);

      setRide(rideResponse.data || null);
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  };

  const refreshJourney = async () => {
    setRefreshing(true);

    await loadJourney();
  };

  const progress = useMemo(() => {
    const value = Number(tracking?.progress_percentage || 0);

    return Math.min(Math.max(value, 0), 100);
  }, [tracking?.progress_percentage]);

  const getTrackingModeDetails = () => {
    if (tracking?.tracking_mode === "emergency") {
      return {
        title: "Emergency Tracking",

        subtitle: "High-frequency emergency tracking is active.",

        icon: "warning" as const,

        backgroundColor: "#FEF2F2",

        iconColor: "#DC2626",
      };
    }

    if (tracking?.tracking_mode === "safety") {
      return {
        title: "Safety Mode Active",

        subtitle: "Enhanced journey tracking is active for this ride.",

        icon: "shield-checkmark" as const,

        backgroundColor: "#FDF2F8",

        iconColor: "#BE185D",
      };
    }

    return {
      title: "Journey Tracking Active",

      subtitle: "Adaptive journey progress tracking is active.",

      icon: "navigate" as const,

      backgroundColor: "#EFF6FF",

      iconColor: colors.primary,
    };
  };

  const getEventDetails = (eventType: string) => {
    switch (eventType) {
      case "ride_started":
        return {
          title: "Journey started",

          icon: "car-sport" as const,
        };

      case "checkpoint_25":
        return {
          title: "25% journey completed",

          icon: "flag" as const,
        };

      case "checkpoint_50":
        return {
          title: "Halfway checkpoint reached",

          icon: "flag" as const,
        };

      case "checkpoint_75":
        return {
          title: "75% journey completed",

          icon: "flag" as const,
        };

      case "near_destination":
        return {
          title: "Approaching destination",

          icon: "location" as const,
        };

      case "destination_reached":
        return {
          title: "Destination reached",

          icon: "checkmark-circle" as const,
        };

      case "route_deviation":
        return {
          title: "Route deviation detected",

          icon: "warning" as const,
        };

      case "tracking_lost":
        return {
          title: "Journey tracking interrupted",

          icon: "cloud-offline" as const,
        };

      case "sos":
        return {
          title: "Emergency SOS triggered",

          icon: "alert-circle" as const,
        };

      default:
        return {
          title: eventType.replaceAll("_", " "),

          icon: "ellipse" as const,
        };
    }
  };

  const formatLastUpdate = (value?: string) => {
    if (!value) {
      return "Waiting for location";
    }

    const difference = Date.now() - new Date(value).getTime();

    const seconds = Math.floor(difference / 1000);

    if (seconds < 60) {
      return "Updated just now";
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return `Updated ${minutes} min ago`;
    }

    const hours = Math.floor(minutes / 60);

    return `Updated ${hours} hr ago`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />

        <Text style={styles.loadingText}>Loading journey...</Text>
      </View>
    );
  }

  const modeDetails = getTrackingModeDetails();

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      data={events}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refreshJourney} />
      }
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Journey Progress</Text>

          <Text style={styles.subtitle}>Live adaptive journey updates</Text>

          <View style={styles.routeCard}>
            <View style={styles.routePoint}>
              <View style={styles.sourceDot} />

              <View style={styles.routeTextContainer}>
                <Text style={styles.routeLabel}>FROM</Text>

                <Text style={styles.routeText}>{ride?.source || "Source"}</Text>
              </View>
            </View>

            <View style={styles.routeConnector} />

            <View style={styles.routePoint}>
              <Ionicons name="location" size={19} color={colors.danger} />

              <View style={styles.routeTextContainer}>
                <Text style={styles.routeLabel}>TO</Text>

                <Text style={styles.routeText}>
                  {ride?.destination || "Destination"}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.modeCard,

              {
                backgroundColor: modeDetails.backgroundColor,
              },
            ]}
          >
            <View
              style={[
                styles.modeIcon,

                {
                  backgroundColor: modeDetails.iconColor,
                },
              ]}
            >
              <Ionicons name={modeDetails.icon} size={22} color="#FFFFFF" />
            </View>

            <View style={styles.modeContent}>
              <Text style={styles.modeTitle}>{modeDetails.title}</Text>

              <Text style={styles.modeSubtitle}>{modeDetails.subtitle}</Text>
            </View>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Journey progress</Text>

              <Text style={styles.progressValue}>{Math.round(progress)}%</Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,

                  {
                    width: `${progress}%`,
                  },
                ]}
              />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons
                  name="navigate-outline"
                  size={18}
                  color={colors.primary}
                />

                <Text style={styles.statValue}>
                  {tracking?.distance_to_destination_km != null
                    ? `${Number(tracking.distance_to_destination_km).toFixed(
                        1,
                      )} km`
                    : "--"}
                </Text>

                <Text style={styles.statLabel}>Remaining</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={colors.primary}
                />

                <Text style={styles.statValue}>
                  {formatLastUpdate(tracking?.last_location_at)}
                </Text>

                <Text style={styles.statLabel}>Last sync</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Journey timeline</Text>
        </>
      }
      renderItem={({ item, index }) => {
        const eventDetails = getEventDetails(item.event_type);

        const isLast = index === events.length - 1;

        return (
          <View style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <View style={styles.timelineIcon}>
                <Ionicons
                  name={eventDetails.icon}
                  size={17}
                  color={colors.primary}
                />
              </View>

              {!isLast && <View style={styles.timelineLine} />}
            </View>

            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>{eventDetails.title}</Text>

              <Text style={styles.timelineTime}>
                {new Date(item.created_at).toLocaleString()}
              </Text>
            </View>
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptyTimeline}>
          <Text style={styles.emptyTimelineText}>
            Waiting for journey events...
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: colors.surfaceMuted,
  },

  contentContainer: {
    paddingHorizontal: spacing.md,

    paddingTop: spacing.xl,

    paddingBottom: spacing.xl,
  },

  loadingContainer: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: colors.surfaceMuted,
  },

  loadingText: {
    marginTop: spacing.sm,

    color: colors.textSecondary,
  },

  title: {
    ...typography.title,
  },

  subtitle: {
    ...typography.subtitle,

    marginTop: 4,

    marginBottom: spacing.lg,
  },

  routeCard: {
    backgroundColor: colors.surface,

    borderRadius: radius.lg,

    borderWidth: 1,

    borderColor: colors.border,

    padding: spacing.md,
  },

  routePoint: {
    flexDirection: "row",

    alignItems: "center",
  },

  sourceDot: {
    width: 14,

    height: 14,

    borderRadius: 7,

    borderWidth: 3,

    borderColor: colors.primary,
  },

  routeTextContainer: {
    marginLeft: spacing.md,

    flex: 1,
  },

  routeLabel: {
    fontSize: 10,

    fontWeight: "700",

    color: colors.textMuted,

    letterSpacing: 1,
  },

  routeText: {
    fontSize: 16,

    fontWeight: "700",

    color: colors.textPrimary,

    marginTop: 2,
  },

  routeConnector: {
    width: 2,

    height: 28,

    backgroundColor: colors.border,

    marginLeft: 6,

    marginVertical: 3,
  },

  modeCard: {
    flexDirection: "row",

    alignItems: "center",

    borderRadius: radius.lg,

    padding: spacing.md,

    marginTop: spacing.md,
  },

  modeIcon: {
    width: 46,

    height: 46,

    borderRadius: 23,

    alignItems: "center",

    justifyContent: "center",
  },

  modeContent: {
    flex: 1,

    marginLeft: spacing.md,
  },

  modeTitle: {
    fontSize: 16,

    fontWeight: "700",

    color: colors.textPrimary,
  },

  modeSubtitle: {
    fontSize: 12,

    color: colors.textSecondary,

    lineHeight: 18,

    marginTop: 3,
  },

  progressCard: {
    backgroundColor: colors.surface,

    borderRadius: radius.lg,

    borderWidth: 1,

    borderColor: colors.border,

    padding: spacing.md,

    marginTop: spacing.md,
  },

  progressHeader: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  progressTitle: {
    fontSize: 14,

    fontWeight: "600",

    color: colors.textSecondary,
  },

  progressValue: {
    fontSize: 22,

    fontWeight: "800",

    color: colors.primary,
  },

  progressTrack: {
    height: 10,

    backgroundColor: colors.surfaceMuted,

    borderRadius: radius.full,

    overflow: "hidden",

    marginTop: spacing.md,
  },

  progressFill: {
    height: "100%",

    backgroundColor: colors.primary,

    borderRadius: radius.full,
  },

  statsRow: {
    flexDirection: "row",

    marginTop: spacing.lg,
  },

  statItem: {
    flex: 1,

    alignItems: "center",
  },

  statDivider: {
    width: 1,

    backgroundColor: colors.border,
  },

  statValue: {
    fontSize: 13,

    fontWeight: "700",

    color: colors.textPrimary,

    marginTop: 6,

    textAlign: "center",
  },

  statLabel: {
    fontSize: 11,

    color: colors.textMuted,

    marginTop: 3,
  },

  sectionTitle: {
    fontSize: 17,

    fontWeight: "700",

    color: colors.textPrimary,

    marginTop: spacing.xl,

    marginBottom: spacing.md,
  },

  timelineItem: {
    flexDirection: "row",

    minHeight: 72,
  },

  timelineLeft: {
    width: 42,

    alignItems: "center",
  },

  timelineIcon: {
    width: 34,

    height: 34,

    borderRadius: 17,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    alignItems: "center",

    justifyContent: "center",

    zIndex: 2,
  },

  timelineLine: {
    width: 2,

    flex: 1,

    backgroundColor: colors.border,
  },

  timelineContent: {
    flex: 1,

    paddingLeft: spacing.sm,

    paddingBottom: spacing.lg,
  },

  timelineTitle: {
    fontSize: 14,

    fontWeight: "700",

    color: colors.textPrimary,

    marginTop: 6,
  },

  timelineTime: {
    fontSize: 12,

    color: colors.textMuted,

    marginTop: 5,
  },

  emptyTimeline: {
    alignItems: "center",

    paddingVertical: spacing.lg,
  },

  emptyTimelineText: {
    color: colors.textMuted,

    fontSize: 13,
  },
});
