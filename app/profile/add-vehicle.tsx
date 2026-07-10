import { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { supabase } from "../../services/supabase";
import { addVehicle } from "../../services/vehicle.service";
import {
  colors,
  spacing,
  radius,
  typography,
  shadow,
} from "../../constants/theme";

export default function AddVehicleScreen() {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [color, setColor] = useState("");
  const [seats, setSeats] = useState("4");
  const [loading, setLoading] = useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  const pressOut = () =>
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();

  const handleSave = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { error } = await addVehicle({
      owner_id: user.id,

      vehicle_name: name,
      vehicle_number: number,
      vehicle_color: color,
      total_seats: Number(seats),
    });

    setLoading(false);

    if (error) {
      Alert.alert(error.message);
      return;
    }

    Alert.alert("Vehicle Added");
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconBadge}>
          <Feather name="truck" size={26} color={colors.primary} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Add a vehicle</Text>
          <Text style={styles.subtitle}>
            Add your vehicle details to start driving
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Vehicle Name</Text>
            <View style={styles.inputWrapper}>
              <Feather
                name="truck"
                size={18}
                color={colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="e.g. Honda City"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Vehicle Number</Text>
            <View style={styles.inputWrapper}>
              <Feather
                name="hash"
                size={18}
                color={colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="e.g. TN 01 AB 1234"
                placeholderTextColor={colors.textMuted}
                value={number}
                onChangeText={setNumber}
                autoCapitalize="characters"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Vehicle Color</Text>
            <View style={styles.inputWrapper}>
              <Feather
                name="droplet"
                size={18}
                color={colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="e.g. White"
                placeholderTextColor={colors.textMuted}
                value={color}
                onChangeText={setColor}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Seats</Text>
            <View style={styles.inputWrapper}>
              <Feather
                name="users"
                size={18}
                color={colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="4"
                placeholderTextColor={colors.textMuted}
                value={seats}
                onChangeText={setSeats}
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>
          </View>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              style={styles.saveButton}
              onPressIn={pressIn}
              onPressOut={pressOut}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <Feather name="check" size={18} color={colors.surface} />
                  <Text style={styles.saveButtonText}>Save Vehicle</Text>
                </>
              )}
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surfaceMuted },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  header: { marginBottom: spacing.xl },
  title: { ...typography.title, fontSize: 26, marginBottom: spacing.xs },
  subtitle: { ...typography.subtitle },
  form: { width: "100%" },
  fieldGroup: { marginBottom: spacing.md + spacing.xs },
  label: { ...typography.label, marginBottom: spacing.sm },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    ...shadow.card,
  },
  inputIcon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.textPrimary,
  },
  saveButton: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    ...shadow.card,
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
