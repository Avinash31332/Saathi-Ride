import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import PlaceSearch from "../../components/maps/PlaceSearch";

import {
  colors,
  radius,
  shadow,
  spacing,
  typography,
} from "../../constants/theme";

import { searchSegmentRides } from "../../services/ride.service";

import { getMyProfile } from "../../services/profile.service";

export default function SearchRideScreen() {
  const [pickup, setPickup] = useState<any>(null);

  const [drop, setDrop] = useState<any>(null);

  const [rides, setRides] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  const [searched, setSearched] = useState(false);

  const [womenOnly, setWomenOnly] = useState(false);

  const [isFemale, setIsFemale] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    loadProfile();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),

      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (pickup && drop) {
      runSearch();
    }
  }, [pickup, drop, womenOnly]);

  const loadProfile = async () => {
    const { data } = await getMyProfile();

    setIsFemale(data?.gender === "female");
  };

  const runSearch = async () => {
    if (!pickup || !drop) {
      return;
    }

    setLoading(true);

    console.log("========== SEGMENT SEARCH ==========");

    console.log("PICKUP:", pickup.name, pickup.latitude, pickup.longitude);

    console.log("DROP:", drop.name, drop.latitude, drop.longitude);

    const { data, error } = await searchSegmentRides(
      {
        latitude: pickup.latitude,
        longitude: pickup.longitude,
      },

      {
        latitude: drop.latitude,
        longitude: drop.longitude,
      },

      womenOnly,
    );

    if (error) {
      console.log("SEGMENT SEARCH ERROR:", error);

      setRides([]);
      setSearched(true);
      setLoading(false);

      return;
    }

    console.log("MATCHED RIDES:", data?.length || 0);

    setRides(data || []);
    setSearched(true);
    setLoading(false);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,

          transform: [
            {
              translateY: slideAnim,
            },
          ],
        },
      ]}
    >
      <Text style={styles.title}>Search Ride</Text>

      <Text style={styles.subtitle}>
        Find rides travelling through your route
      </Text>

      <View style={styles.form}>
        <View style={styles.placeRow}>
          <View style={[styles.routeDot, styles.pickupDot]} />

          <View style={styles.placeContent}>
            <Text style={styles.placeLabel}>Pickup</Text>

            <PlaceSearch
              placeholder="Where will you board?"
              onPlaceSelected={(place) => {
                setPickup(place);
              }}
              onPlaceCleared={() => {
                setPickup(null);
                setRides([]);
                setSearched(false);
              }}
            />
          </View>
        </View>

        <View style={styles.routeConnector} />

        <View style={styles.placeRow}>
          <View style={[styles.routeDot, styles.dropDot]} />

          <View style={styles.placeContent}>
            <Text style={styles.placeLabel}>Drop</Text>

            <PlaceSearch
              placeholder="Where are you going?"
              onPlaceSelected={(place) => {
                setDrop(place);
              }}
              onPlaceCleared={() => {
                setDrop(null);
                setRides([]);
                setSearched(false);
              }}
            />
          </View>
        </View>
      </View>

      {isFemale && (
        <Pressable
          style={({ pressed }) => [
            styles.womenFilter,

            womenOnly && styles.womenFilterActive,

            pressed && {
              transform: [
                {
                  scale: 0.98,
                },
              ],
            },
          ]}
          onPress={() => setWomenOnly((value) => !value)}
        >
          <View style={styles.womenIcon}>
            <Ionicons name="shield-checkmark" size={20} color="#BE185D" />
          </View>

          <View style={styles.womenContent}>
            <Text style={styles.womenTitle}>Women Only</Text>

            <Text style={styles.womenSubtitle}>
              Show rides reserved for women passengers
            </Text>
          </View>

          <Ionicons
            name={womenOnly ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={womenOnly ? "#BE185D" : colors.textMuted}
          />
        </Pressable>
      )}

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />

          <Text style={styles.loadingText}>Matching routes...</Text>
        </View>
      )}

      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          searched && !loading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="trail-sign-outline"
                  size={30}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.emptyTitle}>No route matches</Text>

              <Text style={styles.emptyText}>
                No active driver is currently passing through both locations in
                this direction.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/rides/[id]",

                params: {
                  id: item.id,

                  pickupName: pickup?.name,

                  dropName: drop?.name,

                  pickupLat: pickup?.latitude,

                  pickupLng: pickup?.longitude,

                  dropLat: drop?.latitude,

                  dropLng: drop?.longitude,

                  pickupProgress: item.pickupProgress,

                  dropProgress: item.dropProgress,

                  pickupRouteDistanceKm: item.pickupRouteDistanceKm,

                  dropRouteDistanceKm: item.dropRouteDistanceKm,

                  segmentDistanceKm: item.segmentDistanceKm,

                  segmentPrice: item.segmentPrice,
                },
              })
            }
            style={({ pressed }) => [
              styles.card,

              pressed && {
                transform: [
                  {
                    scale: 0.98,
                  },
                ],
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.routeBadge}>
                <Ionicons
                  name="git-branch-outline"
                  size={15}
                  color={colors.primary}
                />

                <Text style={styles.routeBadgeText}>Route Match</Text>
              </View>

              {item.women_only && (
                <View style={styles.womenBadge}>
                  <Ionicons name="shield-checkmark" size={13} color="#BE185D" />

                  <Text style={styles.womenBadgeText}>Women Only</Text>
                </View>
              )}
            </View>

            <Text style={styles.rideRoute}>{item.source}</Text>

            <View style={styles.routeLineRow}>
              <View style={styles.smallRouteLine} />

              <Text style={styles.passingText}>passes through your route</Text>
            </View>

            <Text style={styles.rideRoute}>{item.destination}</Text>

            <View style={styles.divider} />

            <View style={styles.segmentRow}>
              <View>
                <Text style={styles.segmentLabel}>YOUR SEGMENT</Text>

                <Text style={styles.segmentRoute} numberOfLines={1}>
                  {pickup?.name} → {drop?.name}
                </Text>
              </View>

              <Text style={styles.price}>₹{item.segmentPrice}</Text>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="navigate-outline"
                  size={15}
                  color={colors.textSecondary}
                />

                <Text style={styles.metaText}>
                  {Number(item.segmentDistanceKm).toFixed(1)} km
                </Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons
                  name="people-outline"
                  size={15}
                  color={colors.textSecondary}
                />

                <Text style={styles.metaText}>
                  {item.availableSegmentSeats} seats
                </Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons
                  name="time-outline"
                  size={15}
                  color={colors.textSecondary}
                />

                <Text style={styles.metaText}>{item.ride_time}</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
  },

  title: {
    ...typography.title,
  },

  subtitle: {
    ...typography.subtitle,
    marginTop: 4,
    marginBottom: spacing.lg,
  },

  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.card,
  },

  placeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 34,
    marginRight: spacing.sm,
  },

  pickupDot: {
    backgroundColor: colors.primary,
  },

  dropDot: {
    backgroundColor: colors.danger,
  },

  routeConnector: {
    width: 2,
    height: 15,
    backgroundColor: colors.border,
    marginLeft: 5,
  },

  placeContent: {
    flex: 1,
  },

  placeLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },

  womenFilter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
  },

  womenFilterActive: {
    borderColor: "#F472B6",
    backgroundColor: "#FDF2F8",
  },

  womenIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: "#FCE7F3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },

  womenContent: {
    flex: 1,
  },

  womenTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  womenSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },

  loadingText: {
    color: colors.textSecondary,
  },

  listContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
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

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  routeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.full,
  },

  routeBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },

  womenBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FCE7F3",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.full,
  },

  womenBadgeText: {
    color: "#BE185D",
    fontSize: 11,
    fontWeight: "700",
  },

  rideRoute: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  routeLineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },

  smallRouteLine: {
    width: 2,
    height: 15,
    backgroundColor: colors.primary,
    marginLeft: 5,
    marginRight: spacing.sm,
  },

  passingText: {
    fontSize: 11,
    color: colors.textMuted,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },

  segmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  segmentLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
  },

  segmentRoute: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 3,
    maxWidth: 230,
  },

  price: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
  },

  metaRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    marginTop: spacing.xs,
  },
});
