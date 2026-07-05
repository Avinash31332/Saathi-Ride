import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { createRide } from "../../services/ride.service";
import { supabase } from "../../services/supabase";
import { Picker } from "@react-native-picker/picker";
import { getMyVehicles } from "../../services/vehicle.service";

export default function CreateRideScreen() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");

  const [rideDate, setRideDate] = useState(new Date());
  const [rideTime, setRideTime] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [maxSeats, setMaxSeats] = useState(1);

  const [vehicles, setVehicles] = useState<any[]>([]);

  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [price, setPrice] = useState("");

  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadVehicles();
  }, []);

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

  const handleCreateRide = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert("Please login");
      return;
    }

    const { error } = await createRide({
      driver_id: user.id,

      source,
      destination,

      ride_date: rideDate.toISOString().split("T")[0],

      ride_time: rideTime.toTimeString().slice(0, 8),
      notes,

      vehicle_id: selectedVehicle,

      max_seats: maxSeats,
      price: Number(price),
    });

    if (error) {
      Alert.alert(error.message);
      return;
    }

    Alert.alert("Ride Created Successfully");

    setSource("");
    setDestination("");
    setRideDate(new Date());
    setRideTime(new Date());
    setMaxSeats(1);
    setPrice("");
    setNotes("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Create Ride</Text>
        <Text style={styles.subheading}>
          Fill in the details to publish a new ride
        </Text>

        {/* Vehicle */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Select Vehicle</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedVehicle}
              onValueChange={setSelectedVehicle}
              style={styles.picker}
            >
              {vehicles.map((vehicle) => (
                <Picker.Item
                  key={vehicle.id}
                  label={`${vehicle.vehicle_name} (${vehicle.vehicle_number})`}
                  value={vehicle.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Source */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Source</Text>
          <TextInput
            placeholder="Enter pickup location"
            placeholderTextColor="#9aa5ab"
            value={source}
            onChangeText={setSource}
            style={styles.input}
          />
        </View>

        {/* Destination */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Destination</Text>
          <TextInput
            placeholder="Enter drop location"
            placeholderTextColor="#9aa5ab"
            value={destination}
            onChangeText={setDestination}
            style={styles.input}
          />
        </View>

        {/* Date & Time row */}
        <View style={styles.row}>
          <View style={[styles.fieldGroup, styles.halfField]}>
            <Text style={styles.label}>Date</Text>
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
            <Text style={styles.label}>Time</Text>
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
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);

              if (selectedDate) {
                setRideDate(selectedDate);
              }
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={rideTime}
            mode="time"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);

              if (selectedTime) {
                setRideTime(selectedTime);
              }
            }}
          />
        )}

        {/* Seats */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Seats Available</Text>
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
              <Text style={styles.stepperButtonText}>−</Text>
            </TouchableOpacity>

            <View style={styles.stepperValueWrapper}>
              <Text style={styles.stepperValue}>{maxSeats}</Text>
            </View>

            <TouchableOpacity
              style={styles.stepperButton}
              activeOpacity={0.7}
              onPress={() => setMaxSeats(maxSeats + 1)}
            >
              <Text style={styles.stepperButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Price */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Price</Text>
          <View style={styles.priceInputWrapper}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              placeholder="0"
              placeholderTextColor="#9aa5ab"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              style={styles.priceInput}
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            placeholder="Any additional details for riders..."
            placeholderTextColor="#9aa5ab"
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
            style={styles.textArea}
          />
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          activeOpacity={0.85}
          onPress={handleCreateRide}
        >
          <Text style={styles.submitButtonText}>Create Ride</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0e94dc",
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: "#6b7c84",
    marginBottom: 24,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#285b76",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#dde4e7",
    backgroundColor: "#f7f9fa",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1a2b32",
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
  pickerButton: {
    borderWidth: 1.5,
    borderColor: "#dde4e7",
    backgroundColor: "#f7f9fa",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  pickerButtonText: {
    fontSize: 16,
    color: "#1a2b32",
    fontWeight: "500",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0e94dc",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonDisabled: {
    backgroundColor: "#bcdcef",
  },
  stepperButtonText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 24,
  },
  stepperValueWrapper: {
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a2b32",
  },
  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#dde4e7",
    backgroundColor: "#f7f9fa",
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7c84",
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1a2b32",
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: "#dde4e7",
    backgroundColor: "#f7f9fa",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1a2b32",
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: "#0e94dc",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#0e94dc",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
});
