import { useEffect, useRef, useState } from "react";
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
import {
  colors,
  spacing,
  radius,
  typography,
  shadow,
} from "../../constants/theme";

export default function ProfileScreen() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setInitializing(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setFullName(data.full_name || "");
      setPhone(data.phone || "");
    }

    setInitializing(false);
  };

  const saveProfile = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      phone,
    });

    console.log("DATA:", data);
    console.log("ERROR:", error);

    setLoading(false);

    if (error) {
      Alert.alert(error.message);
      return;
    }

    Alert.alert("Profile Saved");
  };

  if (initializing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

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
          <Feather name="user" size={26} color={colors.primary} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.subtitle}>Keep your details up to date</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Feather
                name="user"
                size={18}
                color={colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Your full name"
                placeholderTextColor={colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone</Text>
            <View style={styles.inputWrapper}>
              <Feather
                name="phone"
                size={18}
                color={colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Your phone number"
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>
          </View>

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              style={styles.saveButton}
              onPressIn={pressIn}
              onPressOut={pressOut}
              onPress={saveProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <Feather name="check" size={18} color={colors.surface} />
                  <Text style={styles.saveButtonText}>Save</Text>
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
  },
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
