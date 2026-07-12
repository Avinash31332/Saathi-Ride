import Ionicons from "@expo/vector-icons/Ionicons";
import { Picker } from "@react-native-picker/picker";
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
import { getAvailableSeats } from "../../services/seat.service";

import { router, useLocalSearchParams } from "expo-router";

import { bookRide } from "../../services/booking.service";
import { supabase } from "../../services/supabase";

import { colors, radius, spacing } from "@/constants/theme";

export default function RideDetailsScreen() {
  const { id } = useLocalSearchParams();

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [availableSeats, setAvailableSeats] = useState(0);

  const [seatCount, setSeatCount] = useState("1");

  const [showSuccess, setShowSuccess] = useState(false);

  const circleScale = useRef(new Animated.Value(0)).current;
  const circleOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadRide();
  }, []);

  const loadRide = async () => {
    const { data, error } = await supabase
      .from("rides")
      .select(`*,profiles (full_name,phone)`)
      .eq("id", id)
      .single();

    if (error) {
      console.log(error);
      return;
    }

    const seats = await getAvailableSeats(data.id);

    setAvailableSeats(seats);

    setRide(data);
    setLoading(false);
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert("Please login");
      return;
    }

    const { error } = await bookRide(ride.id, user.id, Number(seatCount));
    if (Number(seatCount) > availableSeats) {
      Alert.alert("Not enough seats available");
      return;
    }

    if (error) {
      Alert.alert(error.message);
      return;
    }

    playSuccessAnimation();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0e94dc" />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.routeHeading}>
          {ride.source} → {ride.destination}
        </Text>

        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>₹{ride.price}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{ride.ride_date}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{ride.ride_time}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Seats Left</Text>
              <Text style={styles.detailValue}>{availableSeats}</Text>
            </View>
          </View>
        </View>

        {!!ride.notes && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.notesText}>{ride.notes}</Text>
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
          >
            <View style={styles.driverCard}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverAvatarText}>
                  {(ride?.profiles?.full_name || "?").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>
                  {ride?.profiles?.full_name || "Unknown"}
                </Text>
                <Text style={styles.driverPhone}>
                  {ride?.profiles?.phone || "Not Available"}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Seats Required</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={seatCount}
              onValueChange={(value) => setSeatCount(value)}
              style={styles.picker}
            >
              <Picker.Item label="1 Seat" value="1" />
              <Picker.Item label="2 Seats" value="2" />
              <Picker.Item label="3 Seats" value="3" />
              <Picker.Item label="4 Seats" value="4" />
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
        <TouchableOpacity
          style={styles.bookButton}
          activeOpacity={0.85}
          onPress={handleBookRide}
        >
          <Text style={styles.bookButtonText}>Book Ride</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Animated.View
              style={[
                styles.successCircle,
                {
                  opacity: circleOpacity,
                  transform: [{ scale: circleScale }],
                },
              ]}
            >
              <Animated.Text
                style={[
                  styles.checkMark,
                  { transform: [{ scale: checkScale }] },
                ]}
              >
                ✓
              </Animated.Text>
            </Animated.View>

            <Text style={styles.successTitle}>Ride Booked!</Text>
            <Text style={styles.successSubtitle}>
              Your seat{Number(seatCount) > 1 ? "s are" : " is"} confirmed. Have
              a safe trip.
            </Text>

            <TouchableOpacity
              style={styles.doneButton}
              activeOpacity={0.85}
              onPress={() => {
                setShowSuccess(false);
                router.back();
              }}
            >
              <Text style={styles.doneButtonText}>Done</Text>
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
    backgroundColor: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  container: {
    padding: 20,
    paddingBottom: 24,
  },
  routeHeading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a2b32",
    marginBottom: 10,
  },
  priceBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e7f4fb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 18,
  },
  priceBadgeText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0e94dc",
  },
  card: {
    backgroundColor: "#f7f9fa",
    borderWidth: 1,
    borderColor: "#e3e9eb",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#9aa5ab",
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#285b76",
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#285b76",
    marginBottom: 8,
  },
  notesText: {
    fontSize: 15,
    color: "#4a5559",
    lineHeight: 21,
  },
  driverCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f9fa",
    borderWidth: 1,
    borderColor: "#e3e9eb",
    borderRadius: 14,
    padding: 14,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0e94dc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  driverAvatarText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a2b32",
    marginBottom: 2,
  },
  driverPhone: {
    fontSize: 13,
    color: "#6b7c84",
  },
  pickerWrapper: {
    borderWidth: 1.5,
    borderColor: "#39929e",
    backgroundColor: "#f3f3f3",
    borderRadius: 14,
    overflow: "hidden",
  },
  picker: {
    width: "100%",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#e3e9eb",
    backgroundColor: "#ffffff",
  },
  bookButton: {
    backgroundColor: "#0e94dc",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0e94dc",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  bookButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(26, 43, 50, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  successCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#e7f6ef",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  checkMark: {
    fontSize: 42,
    fontWeight: "700",
    color: "#2fa372",
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a2b32",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: "#6b7c84",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  doneButton: {
    backgroundColor: "#0e94dc",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    color: "#ffffff",
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
    marginTop: spacing.md,
  },

  journeyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
