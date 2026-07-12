import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import PlaceSearch from "../../components/maps/PlaceSearch";
import RouteMap from "../../components/maps/RouteMap";
import { colors, radius, spacing, typography } from "../../constants/theme";
import { getRoute } from "../../services/maps/route.service";
import { createRide } from "../../services/ride.service";
import { supabase } from "../../services/supabase";
import { getMyVehicles } from "../../services/vehicle.service";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const STEP_COUNT = 3;

export default function CreateRideScreen() {
  const router = useRouter();

  // ---- form state (unchanged data, just reorganized across steps) ----
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");

  const [pickup, setPickup] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);

  const [rideDate, setRideDate] = useState(new Date());
  const [rideTime, setRideTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [maxSeats, setMaxSeats] = useState(1);
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [luggageAllowed, setLuggageAllowed] = useState(false);
  const [womenOnly, setWomenOnly] = useState(false);
  const [driverProfile, setDriverProfile] = useState<any>(null);

  const [submitting, setSubmitting] = useState(false);

  // ---- step / animation state ----
  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.log("DRIVER PROFILE ERROR:", error);
      return;
    }

    setDriverProfile(profile);

    await loadVehicles();
  };

  const loadVehicles = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await getMyVehicles(user.id);
    setVehicles(data || []);

    if (data?.length) {
      setSelectedVehicle(data[0].id);
    }
  };

  const loadRoute = async (start: any, end: any) => {
    try {
      const result = await getRoute(start, end);
      setRoute(result);
    } catch (e) {
      console.log(e);
    }
  };

  const goToStep = (nextStep: number) => {
    if (nextStep < 0 || nextStep > STEP_COUNT - 1) return;

    Animated.spring(slideAnim, {
      toValue: -nextStep * SCREEN_WIDTH,
      useNativeDriver: true,
      friction: 9,
      tension: 65,
    }).start();

    setStep(nextStep);
  };

  const validateStep = (targetStep: number) => {
    if (targetStep === 1 && !selectedVehicle) {
      Alert.alert("Please select a vehicle");
      return false;
    }
    if (targetStep === 2) {
      if (!pickup) {
        Alert.alert("Select pickup location");
        return false;
      }
      if (!destination) {
        Alert.alert("Select destination");
        return false;
      }
      if (!route) {
        Alert.alert("Route not loaded");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step + 1)) return;
    goToStep(step + 1);
  };

  const handleBack = () => goToStep(step - 1);

  const handleCreateRide = async () => {
    if (!price || Number(price) <= 0) {
      Alert.alert("Enter a valid price");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert("Please login");
      return;
    }

    if (
      driverProfile?.driver_verification_status !== "approved" ||
      !driverProfile?.aadhaar_verified ||
      !driverProfile?.driving_license_verified
    ) {
      Alert.alert(
        "Driver verification required",
        "Your Aadhaar and driving license must be verified before you can publish a ride.",
      );

      return;
    }

    if (womenOnly && !driverProfile?.women_trusted_driver) {
      Alert.alert(
        "Women Only unavailable",
        "Enhanced driver verification is required to publish Women Only rides.",
      );

      return;
    }

    setSubmitting(true);

    console.log("========== CREATE RIDE ==========");
    console.log(
      JSON.stringify(
        {
          driver_id: user.id,
          vehicle_id: selectedVehicle,

          source: pickup.name,
          destination: destination.name,

          pickup_lat: pickup.latitude,
          pickup_lng: pickup.longitude,

          destination_lat: destination.latitude,
          destination_lng: destination.longitude,

          route_polyline: route?.polyline,

          route_distance_km: route?.distanceKm,

          route_duration_minutes: route?.durationMinutes,

          ride_date: rideDate.toISOString().split("T")[0],

          ride_time: rideTime.toTimeString().slice(0, 8),

          notes,

          luggage_allowed: luggageAllowed,

          max_seats: maxSeats,

          price: Number(price),
        },
        null,
        2,
      ),
    );

    const { error } = await createRide({
      driver_id: user.id,
      vehicle_id: selectedVehicle,

      source: pickup.name,
      destination: destination.name,

      pickup_lat: pickup.latitude,
      pickup_lng: pickup.longitude,
      destination_lat: destination.latitude,
      destination_lng: destination.longitude,

      route_polyline: route?.polyline,
      route_distance_km: route?.distanceKm,
      // route_duration_minutes: route?.durationMinutes,

      ride_date: rideDate.toISOString().split("T")[0],
      ride_time: rideTime.toTimeString().slice(0, 8),

      notes,
      luggage_allowed: luggageAllowed,
      women_only: womenOnly,
      max_seats: maxSeats,
      price: Number(price),
    });

    setSubmitting(false);

    if (error) {
      Alert.alert(error.message);
      return;
    }

    Alert.alert("Ride Created Successfully");
    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Progress header */}
      <View style={styles.progressHeader}>
        {["Vehicle", "Route", "Pricing"].map((label, i) => (
          <View key={label} style={styles.progressItem}>
            <View
              style={[
                styles.progressDot,
                i <= step && styles.progressDotActive,
              ]}
            >
              {i < step ? (
                <Ionicons name="checkmark" size={13} color="white" />
              ) : (
                <Text
                  style={[
                    styles.progressNum,
                    i === step && styles.progressNumActive,
                  ]}
                >
                  {i + 1}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.progressLabel,
                i === step && styles.progressLabelActive,
              ]}
            >
              {label}
            </Text>
            {i < 2 && (
              <View
                style={[
                  styles.progressLine,
                  i < step && styles.progressLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Sliding steps */}
      <View style={styles.stepsViewport}>
        <Animated.View
          style={[
            styles.stepsRow,
            {
              width: SCREEN_WIDTH * STEP_COUNT,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* ---------------- STEP 1: VEHICLE ---------------- */}
          <View style={styles.stepPage}>
            <ScrollView
              contentContainerStyle={styles.stepContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.heading}>Choose your Vehicle</Text>
              <Text style={styles.subheading}>
                Select which vehicle you will drive for this ride
              </Text>

              {vehicles.length === 0 ? (
                <View style={styles.emptyVehicles}>
                  <Ionicons
                    name="car-outline"
                    size={40}
                    color={colors.textMuted}
                  />
                  <Text style={styles.emptyVehiclesText}>
                    No vehicles found. Add one first.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={vehicles}
                  scrollEnabled={false}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => {
                    const active = selectedVehicle === item.id;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.vehicleCard,
                          active && styles.vehicleCardActive,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => setSelectedVehicle(item.id)}
                      >
                        <View
                          style={[
                            styles.vehicleIconWrap,
                            {
                              backgroundColor: item.vehicle_color
                                ? item.vehicle_color + "22"
                                : colors.primaryLight,
                            },
                          ]}
                        >
                          <Ionicons
                            name="car-sport"
                            size={26}
                            color={item.vehicle_color || colors.primary}
                          />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.vehicleName}>
                            {item.vehicle_name}
                          </Text>
                          <Text style={styles.vehicleNumber}>
                            {item.vehicle_number}
                          </Text>
                          {!!item.total_seats && (
                            <Text style={styles.vehicleSeats}>
                              {item.total_seats} seats
                            </Text>
                          )}
                        </View>

                        <Ionicons
                          name={active ? "radio-button-on" : "radio-button-off"}
                          size={22}
                          color={active ? colors.primary : colors.border}
                        />
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </ScrollView>
          </View>

          {/* ---------------- STEP 2: ROUTE ---------------- */}
          <View style={styles.stepPage}>
            <ScrollView
              contentContainerStyle={styles.stepContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.heading}>Set your Route</Text>
              <Text style={styles.subheading}>
                Where are you driving from and to?
              </Text>

              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Ionicons
                    name="radio-button-on-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.label}>Source</Text>
                </View>
                <PlaceSearch
                  placeholder="Pickup Location"
                  onPlaceSelected={(place) => {
                    setPickup(place);
                    if (destination) loadRoute(place, destination);
                  }}
                />
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.label}>Destination</Text>
                </View>
                <PlaceSearch
                  placeholder="Drop Location"
                  onPlaceSelected={(place) => {
                    setDestination(place);
                    if (pickup) loadRoute(pickup, place);
                  }}
                />
              </View>

              <RouteMap
                pickup={pickup}
                destination={destination}
                route={route}
              />

              {route && (
                <View style={styles.routeInfoCard}>
                  <View style={styles.routeInfoItem}>
                    <Ionicons
                      name="trail-sign-outline"
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={styles.routeInfoText}>
                      {route.distanceKm.toFixed(1)} km
                    </Text>
                  </View>
                  <View style={styles.routeInfoDivider} />
                  <View style={styles.routeInfoItem}>
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={styles.routeInfoText}>
                      {route.durationMinutes.toFixed(0)} mins
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.row}>
                <View style={[styles.fieldGroup, styles.halfField]}>
                  <View style={styles.labelRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.label}>Date</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    activeOpacity={0.7}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.pickerButtonText}>
                      {rideDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.fieldGroup, styles.halfField]}>
                  <View style={styles.labelRow}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.label}>Time</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    activeOpacity={0.7}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={styles.pickerButtonText}>
                      {rideTime.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={rideDate}
                  mode="date"
                  onChange={(e, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setRideDate(selectedDate);
                  }}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={rideTime}
                  mode="time"
                  onChange={(e, selectedTime) => {
                    setShowTimePicker(false);
                    if (selectedTime) setRideTime(selectedTime);
                  }}
                />
              )}
            </ScrollView>
          </View>

          {/* ---------------- STEP 3: PRICING ---------------- */}
          <View style={styles.stepPage}>
            <ScrollView
              contentContainerStyle={styles.stepContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.heading}>Pricing & Details</Text>
              <Text style={styles.subheading}>
                Set your price and any extra info for riders
              </Text>

              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.label}>Seats Available</Text>
                </View>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={[
                      styles.stepperButton,
                      maxSeats <= 1 && styles.stepperButtonDisabled,
                    ]}
                    activeOpacity={0.7}
                    disabled={maxSeats <= 1}
                    onPress={() => maxSeats > 1 && setMaxSeats(maxSeats - 1)}
                  >
                    <Ionicons name="remove" size={20} color="white" />
                  </TouchableOpacity>

                  <View style={styles.stepperValueWrapper}>
                    <Text style={styles.stepperValue}>{maxSeats}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.stepperButton}
                    activeOpacity={0.7}
                    onPress={() => setMaxSeats(maxSeats + 1)}
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Ionicons
                    name="pricetag-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.label}>Price per seat</Text>
                </View>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    style={styles.priceInput}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <TouchableOpacity
                  style={[
                    styles.womenRideCard,
                    womenOnly && styles.womenRideCardActive,
                    !driverProfile?.women_trusted_driver &&
                      styles.womenRideCardDisabled,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (!driverProfile?.women_trusted_driver) {
                      Alert.alert(
                        "Enhanced verification required",
                        "Women Only rides can only be published by Women Trusted Drivers.",
                      );

                      return;
                    }

                    setWomenOnly(!womenOnly);
                  }}
                >
                  <View style={styles.womenRideIcon}>
                    <Ionicons
                      name="shield-checkmark"
                      size={24}
                      color="#BE185D"
                    />
                  </View>

                  <View style={styles.womenRideContent}>
                    <Text style={styles.womenRideTitle}>Women Only Ride</Text>

                    <Text style={styles.womenRideSubtitle}>
                      {driverProfile?.women_trusted_driver
                        ? "Only women passengers can discover and book this ride"
                        : "Complete enhanced driver verification to unlock"}
                    </Text>
                  </View>

                  <Ionicons
                    name={womenOnly ? "checkmark-circle" : "ellipse-outline"}
                    size={25}
                    color={womenOnly ? "#BE185D" : colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.fieldGroup}>
                <TouchableOpacity
                  style={styles.luggageRow}
                  activeOpacity={0.8}
                  onPress={() => setLuggageAllowed(!luggageAllowed)}
                >
                  <View style={styles.luggageLeft}>
                    <Ionicons
                      name="briefcase-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.luggageText}>Allow luggage</Text>
                  </View>
                  <View
                    style={[
                      styles.toggle,
                      luggageAllowed && styles.toggleActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        luggageAllowed && styles.toggleThumbActive,
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Ionicons
                    name="document-text-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={styles.label}>Notes</Text>
                </View>
                <TextInput
                  placeholder="Any additional details for riders..."
                  placeholderTextColor={colors.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  textAlignVertical="top"
                  style={styles.textArea}
                />
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      </View>

      {/* Footer nav */}
      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        {step < STEP_COUNT - 1 ? (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleCreateRide}
            activeOpacity={0.85}
            disabled={submitting}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="white" />
            <Text style={styles.nextButtonText}>
              {submitting ? "Creating..." : "Create Ride"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  progressItem: { flexDirection: "row", alignItems: "center", flex: 1 },
  progressDot: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  progressNum: { fontSize: 12, fontWeight: "700", color: colors.textMuted },
  progressNumActive: { color: "white" },
  progressLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 6,
    fontWeight: "600",
  },
  progressLabelActive: { color: colors.primary },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  progressLineActive: { backgroundColor: colors.primary },

  stepsViewport: { flex: 1, overflow: "hidden" },
  stepsRow: { flex: 1, flexDirection: "row" },
  stepPage: { width: SCREEN_WIDTH },
  stepContent: { padding: spacing.lg, paddingBottom: 40 },

  heading: { ...typography.title, color: colors.primary, marginBottom: 4 },
  subheading: { ...typography.subtitle, marginBottom: spacing.lg },

  fieldGroup: { marginBottom: spacing.lg },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },

  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  halfField: { flex: 1 },

  pickerButton: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  pickerButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "500",
  },

  routeInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  routeInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.lg,
  },
  routeInfoText: { fontSize: 15, fontWeight: "600", color: colors.primaryDark },
  routeInfoDivider: { width: 1, height: 20, backgroundColor: colors.border },

  stepperRow: { flexDirection: "row", alignItems: "center" },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonDisabled: { backgroundColor: colors.primaryLight },
  stepperValueWrapper: {
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },

  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },

  luggageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  luggageLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  luggageText: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    padding: 3,
    justifyContent: "center",
  },
  toggleActive: { backgroundColor: colors.primary },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: "white",
  },
  toggleThumbActive: { transform: [{ translateX: 18 }] },

  textArea: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 100,
  },

  emptyVehicles: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyVehiclesText: { color: colors.textMuted, fontSize: 14 },

  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  vehicleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  vehicleIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleName: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
  vehicleNumber: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  vehicleSeats: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButton: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  nextButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
  womenRideCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#FBCFE8",
    borderRadius: radius.lg,
    padding: spacing.md,
  },

  womenRideCardActive: {
    backgroundColor: "#FDF2F8",
    borderColor: "#BE185D",
  },

  womenRideCardDisabled: {
    opacity: 0.6,
  },

  womenRideIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FCE7F3",
    alignItems: "center",
    justifyContent: "center",
  },

  womenRideContent: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },

  womenRideTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  womenRideSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginTop: 3,
  },
});
