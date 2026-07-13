import Ionicons from "@expo/vector-icons/Ionicons";
import { Picker } from "@react-native-picker/picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  colors,
  radius,
  shadow,
  spacing,
  typography,
} from "../../constants/theme";

import { supabase } from "../../services/supabase";

export default function RideDetailsScreen() {
  const params = useLocalSearchParams();

  const rideId = String(params.id);

  const pickupName = params.pickupName ? String(params.pickupName) : null;

  const dropName = params.dropName ? String(params.dropName) : null;

  const pickupLat = Number(params.pickupLat);

  const pickupLng = Number(params.pickupLng);

  const dropLat = Number(params.dropLat);

  const dropLng = Number(params.dropLng);

  const pickupProgress = Number(params.pickupProgress);

  const dropProgress = Number(params.dropProgress);

  const pickupRouteDistanceKm = Number(params.pickupRouteDistanceKm);

  const dropRouteDistanceKm = Number(params.dropRouteDistanceKm);

  const segmentDistanceKm = Number(params.segmentDistanceKm);

  const segmentPrice = Number(params.segmentPrice);

  const isSegmentBooking =
    !!pickupName &&
    !!dropName &&
    Number.isFinite(pickupProgress) &&
    Number.isFinite(dropProgress) &&
    pickupProgress < dropProgress;

  const [ride, setRide] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [booking, setBooking] = useState(false);

  const [availableSeats, setAvailableSeats] = useState(0);

  const [seatCount, setSeatCount] = useState("1");

  const [showSuccess, setShowSuccess] = useState(false);

  const [bookingId, setBookingId] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const slideAnim = useRef(new Animated.Value(18)).current;

  const bookScale = useRef(new Animated.Value(1)).current;

  const circleScale = useRef(new Animated.Value(0)).current;

  const circleOpacity = useRef(new Animated.Value(0)).current;

  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadRide();

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

  const loadRide = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("rides")
        .select(
          `
          *,
          profiles (
            full_name,
            phone,
            profile_image,
            driver_rating,
            driver_total_reviews
          )
        `,
        )
        .eq("id", rideId)
        .single();

      if (error) {
        console.log("LOAD RIDE ERROR:", error);

        Alert.alert("Unable to load ride", error.message);

        return;
      }

      setRide(data);

      if (isSegmentBooking) {
        const { data: seats, error: seatsError } = await supabase.rpc(
          "get_segment_available_seats",
          {
            p_ride_id: rideId,

            p_pickup_progress: pickupProgress,

            p_drop_progress: dropProgress,
          },
        );

        if (seatsError) {
          console.log("SEGMENT SEATS ERROR:", seatsError);

          setAvailableSeats(0);
        } else {
          setAvailableSeats(Number(seats) || 0);
        }
      } else {
        setAvailableSeats(Number(data.max_seats) || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  const playSuccessAnimation = () => {
    circleScale.setValue(0);

    circleOpacity.setValue(0);

    checkScale.setValue(0);

    setShowSuccess(true);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(circleOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),

        Animated.spring(circleScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),

      Animated.spring(checkScale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleBookRide = async () => {
    if (!ride || booking) {
      return;
    }

    if (!isSegmentBooking) {
      Alert.alert(
        "Select your journey",
        "Please search and select your pickup and destination before booking this ride.",
      );

      return;
    }

    const requestedSeats = Number(seatCount);

    if (!Number.isFinite(requestedSeats) || requestedSeats <= 0) {
      Alert.alert("Invalid seat count");

      return;
    }

    if (requestedSeats > availableSeats) {
      Alert.alert(
        "Not enough seats",
        `Only ${availableSeats} seat${
          availableSeats === 1 ? "" : "s"
        } available for this route segment.`,
      );

      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert("Please login");

      return;
    }

    try {
      setBooking(true);

      console.log("========== SEGMENT BOOKING ==========");

      console.log({
        rideId,

        passengerId: user.id,

        pickupName,

        dropName,

        pickupProgress,

        dropProgress,

        requestedSeats,
      });

      const { data, error } = await supabase.rpc("book_ride_segment", {
        p_ride_id: rideId,

        p_passenger_id: user.id,

        p_seats_booked: requestedSeats,

        p_pickup_name: pickupName,

        p_drop_name: dropName,

        p_pickup_lat: pickupLat,

        p_pickup_lng: pickupLng,

        p_drop_lat: dropLat,

        p_drop_lng: dropLng,

        p_pickup_progress: pickupProgress,

        p_drop_progress: dropProgress,

        p_pickup_route_distance_km: pickupRouteDistanceKm,

        p_drop_route_distance_km: dropRouteDistanceKm,
      });

      if (error) {
        console.log("SEGMENT BOOKING ERROR:", error);

        Alert.alert("Unable to book ride", error.message);

        return;
      }

      console.log("BOOKING CREATED:", data);

      setBookingId(String(data));

      playSuccessAnimation();

      await loadSegmentSeats();
    } finally {
      setBooking(false);
    }
  };

  const loadSegmentSeats = async () => {
    if (!isSegmentBooking) {
      return;
    }

    const { data, error } = await supabase.rpc("get_segment_available_seats", {
      p_ride_id: rideId,

      p_pickup_progress: pickupProgress,

      p_drop_progress: dropProgress,
    });

    if (!error) {
      setAvailableSeats(Number(data) || 0);
    }
  };

  const animateBookPressIn = () => {
    Animated.spring(bookScale, {
      toValue: 0.97,
      speed: 40,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  const animateBookPressOut = () => {
    Animated.spring(bookScale, {
      toValue: 1,
      speed: 40,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="car-outline" size={42} color={colors.textMuted} />

        <Text style={styles.notFoundText}>Ride not found</Text>
      </View>
    );
  }

  const displayedPrice =
    isSegmentBooking && Number.isFinite(segmentPrice)
      ? segmentPrice
      : Number(ride.price);

  return (
    <View style={styles.flex}>
      <Animated.View
        style={[
          styles.flex,

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
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerContent}>
              <Text style={styles.routeHeading}>{ride.source}</Text>

              <View style={styles.routeDirection}>
                <View style={styles.routeLine} />

                <Ionicons name="arrow-down" size={15} color={colors.primary} />
              </View>

              <Text style={styles.routeHeading}>{ride.destination}</Text>
            </View>

            {ride.women_only && (
              <View style={styles.womenBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#BE185D" />

                <Text style={styles.womenBadgeText}>Women Only</Text>
              </View>
            )}
          </View>

          {isSegmentBooking && (
            <View style={styles.segmentCard}>
              <View style={styles.segmentHeader}>
                <View style={styles.segmentIcon}>
                  <Ionicons
                    name="git-branch-outline"
                    size={20}
                    color={colors.primary}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.segmentLabel}>YOUR JOURNEY SEGMENT</Text>

                  <Text style={styles.segmentHint}>
                    This driver passes through your route
                  </Text>
                </View>
              </View>

              <View style={styles.stopRow}>
                <View style={[styles.stopDot, styles.pickupDot]} />

                <Text style={styles.stopText} numberOfLines={2}>
                  {pickupName}
                </Text>
              </View>

              <View style={styles.stopConnector} />

              <View style={styles.stopRow}>
                <View style={[styles.stopDot, styles.dropDot]} />

                <Text style={styles.stopText} numberOfLines={2}>
                  {dropName}
                </Text>
              </View>

              <View style={styles.segmentMetaRow}>
                <View style={styles.segmentMeta}>
                  <Ionicons
                    name="navigate-outline"
                    size={16}
                    color={colors.textSecondary}
                  />

                  <Text style={styles.segmentMetaText}>
                    {Number(segmentDistanceKm).toFixed(1)} km
                  </Text>
                </View>

                <View style={styles.segmentMeta}>
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color={colors.textSecondary}
                  />

                  <Text style={styles.segmentMetaText}>
                    {availableSeats} seats
                  </Text>
                </View>

                <Text style={styles.segmentPrice}>₹{displayedPrice}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailsCard}>
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.detailLabel}>Date</Text>

              <Text style={styles.detailValue}>{ride.ride_date}</Text>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.detailLabel}>Time</Text>

              <Text style={styles.detailValue}>{ride.ride_time}</Text>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name="people-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.detailLabel}>Seats</Text>

              <Text style={styles.detailValue}>{availableSeats}</Text>
            </View>
          </View>

          {!!ride.notes && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Notes</Text>

              <View style={styles.notesCard}>
                <Text style={styles.notesText}>{ride.notes}</Text>
              </View>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Driver</Text>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/profile/[id]",

                  params: {
                    id: ride.driver_id,
                  },
                })
              }
              style={({ pressed }) => [
                styles.driverCard,

                pressed && {
                  transform: [
                    {
                      scale: 0.98,
                    },
                  ],
                },
              ]}
            >
              <View style={styles.driverAvatar}>
                <Text style={styles.driverAvatarText}>
                  {(ride?.profiles?.full_name || "?").charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>
                  {ride?.profiles?.full_name || "Unknown"}
                </Text>

                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />

                  <Text style={styles.ratingText}>
                    {Number(ride?.profiles?.driver_rating || 0).toFixed(1)}
                  </Text>

                  <Text style={styles.reviewCount}>
                    ({ride?.profiles?.driver_total_reviews || 0} reviews)
                  </Text>
                </View>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Seats Required</Text>

            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={seatCount}
                onValueChange={(value) => setSeatCount(String(value))}
                style={styles.picker}
              >
                {Array.from(
                  {
                    length: Math.max(1, availableSeats),
                  },
                  (_, index) => index + 1,
                ).map((count) => (
                  <Picker.Item
                    key={count}
                    label={`${count} Seat${count > 1 ? "s" : ""}`}
                    value={String(count)}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </ScrollView>

        {ride?.ride_status === "in_progress" && (
          <TouchableOpacity
            style={styles.journeyButton}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/rides/journey/[rideId]" as any,

                params: {
                  rideId: ride.id,
                },
              })
            }
          >
            <Ionicons name="navigate" size={18} color="#FFFFFF" />

            <Text style={styles.journeyButtonText}>View Journey Progress</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <View style={styles.footerPrice}>
            <Text style={styles.footerPriceLabel}>Your fare</Text>

            <Text style={styles.footerPriceValue}>
              ₹{displayedPrice * Number(seatCount)}
            </Text>
          </View>

          <Animated.View
            style={{
              flex: 1,

              transform: [
                {
                  scale: bookScale,
                },
              ],
            }}
          >
            <Pressable
              style={[
                styles.bookButton,

                (booking || availableSeats <= 0) && styles.bookButtonDisabled,
              ]}
              onPressIn={animateBookPressIn}
              onPressOut={animateBookPressOut}
              onPress={handleBookRide}
              disabled={booking || availableSeats <= 0}
            >
              {booking ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.bookButtonText}>
                    {availableSeats <= 0 ? "Sold Out" : "Book Segment"}
                  </Text>

                  {availableSeats > 0 && (
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  )}
                </>
              )}
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Animated.View
              style={[
                styles.successCircle,

                {
                  opacity: circleOpacity,

                  transform: [
                    {
                      scale: circleScale,
                    },
                  ],
                },
              ]}
            >
              <Animated.View
                style={{
                  transform: [
                    {
                      scale: checkScale,
                    },
                  ],
                }}
              >
                <Ionicons name="checkmark" size={46} color={colors.success} />
              </Animated.View>
            </Animated.View>

            <Text style={styles.successTitle}>Segment Booked!</Text>

            <Text style={styles.successSubtitle}>
              Your journey from {pickupName} to {dropName} is confirmed.
            </Text>

            <View style={styles.successRouteCard}>
              <Ionicons
                name="navigate-outline"
                size={20}
                color={colors.primary}
              />

              <Text style={styles.successRouteText} numberOfLines={2}>
                {pickupName} → {dropName}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.doneButton}
              activeOpacity={0.85}
              onPress={() => {
                setShowSuccess(false);

                if (bookingId) {
                  router.replace("/(tabs)/bookings" as any);
                } else {
                  router.back();
                }
              }}
            >
              <Text style={styles.doneButtonText}>View My Bookings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },

  notFoundText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 15,
  },

  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },

  headerContent: {
    flex: 1,
  },

  routeHeading: {
    ...typography.title,
    fontSize: 21,
  },

  routeDirection: {
    flexDirection: "row",
    alignItems: "center",
    height: 25,
    marginLeft: 6,
  },

  routeLine: {
    width: 2,
    height: 18,
    backgroundColor: colors.primary,
  },

  womenBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FCE7F3",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginLeft: spacing.sm,
  },

  womenBadgeText: {
    color: "#BE185D",
    fontSize: 11,
    fontWeight: "700",
  },

  segmentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },

  segmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  segmentIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },

  segmentLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.8,
  },

  segmentHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  stopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  stopDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },

  pickupDot: {
    backgroundColor: colors.primary,
  },

  dropDot: {
    backgroundColor: colors.danger,
  },

  stopConnector: {
    width: 2,
    height: 20,
    backgroundColor: colors.border,
    marginLeft: 5,
  },

  stopText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  segmentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },

  segmentMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  segmentMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  segmentPrice: {
    marginLeft: "auto",
    fontSize: 21,
    fontWeight: "800",
    color: colors.primary,
  },

  detailsCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.card,
  },

  detailItem: {
    flex: 1,
    alignItems: "center",
  },

  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },

  detailLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },

  detailValue: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 3,
  },

  fieldGroup: {
    marginBottom: spacing.lg,
  },

  label: {
    ...typography.label,
    marginBottom: spacing.sm,
  },

  notesCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },

  notesText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },

  driverCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },

  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },

  driverAvatarText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "700",
  },

  driverInfo: {
    flex: 1,
  },

  driverName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  ratingText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    marginLeft: 4,
  },

  reviewCount: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 3,
  },

  pickerWrapper: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: "hidden",
  },

  picker: {
    width: "100%",
    color: colors.textPrimary,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },

  footerPrice: {
    minWidth: 85,
  },

  footerPriceLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },

  footerPriceValue: {
    fontSize: 21,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 2,
  },

  bookButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
  },

  bookButtonDisabled: {
    opacity: 0.5,
  },

  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(26,43,50,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  modalCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
  },

  successCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#E7F6EF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },

  successTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  successSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.md,
  },

  successRouteCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },

  successRouteText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  doneButton: {
    width: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  journeyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },

  journeyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
