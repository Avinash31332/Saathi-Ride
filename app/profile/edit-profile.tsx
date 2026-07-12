import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  Gender,
  getMyProfile,
  updateMyProfile,
} from "../../services/profile.service";

import {
  colors,
  radius,
  shadow,
  spacing,
  typography,
} from "../../constants/theme";

const GENDERS: {
  value: Gender;
  label: string;
  icon: any;
}[] = [
  {
    value: "male",
    label: "Male",
    icon: "male",
  },
  {
    value: "female",
    label: "Female",
    icon: "female",
  },
  {
    value: "other",
    label: "Other",
    icon: "person",
  },
  {
    value: "prefer_not_to_say",
    label: "Prefer not to say",
    icon: "remove-circle-outline",
  },
];

export default function EditProfileScreen() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data, error } = await getMyProfile();

    if (error) {
      Alert.alert("Error", error.message);
      setLoading(false);
      return;
    }

    setFullName(data?.full_name || "");
    setPhone(data?.phone || "");
    setGender(data?.gender || null);

    setLoading(false);
  };

  const saveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert("Name required", "Please enter your full name.");
      return;
    }

    if (!phone.trim()) {
      Alert.alert("Phone required", "Please enter your phone number.");
      return;
    }

    if (!gender) {
      Alert.alert("Gender required", "Please select your gender.");
      return;
    }

    setSaving(true);

    const { error } = await updateMyProfile({
      fullName,
      phone,
      gender,
    });

    setSaving(false);

    if (error) {
      Alert.alert("Unable to save profile", error.message);
      return;
    }

    Alert.alert("Profile updated", "Your profile has been saved.", [
      {
        text: "Done",
        onPress: () => router.back(),
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>

        <Text style={styles.title}>Edit profile</Text>

        <Text style={styles.subtitle}>
          Keep your personal information up to date
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Full name</Text>

          <View style={styles.inputWrapper}>
            <Feather name="user" size={18} color={colors.textMuted} />

            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full name"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <Text style={styles.label}>Phone number</Text>

          <View style={styles.inputWrapper}>
            <Feather name="phone" size={18} color={colors.textMuted} />

            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 98765 43210"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Gender</Text>

        <Text style={styles.sectionSubtitle}>
          Gender is used to determine access to women-only rides and safety
          features.
        </Text>

        <View style={styles.genderGrid}>
          {GENDERS.map((item) => {
            const selected = gender === item.value;

            return (
              <Pressable
                key={item.value}
                style={[
                  styles.genderCard,
                  selected && styles.genderCardSelected,
                ]}
                onPress={() => setGender(item.value)}
              >
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={selected ? colors.primary : colors.textSecondary}
                />

                <Text
                  style={[
                    styles.genderText,
                    selected && styles.genderTextSelected,
                  ]}
                >
                  {item.label}
                </Text>

                {selected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={19}
                    color={colors.primary}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={saveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Feather name="check" size={18} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save profile</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.subtitle,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    height: 50,
    marginLeft: spacing.sm,
    color: colors.textPrimary,
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  genderGrid: {
    gap: spacing.sm,
  },
  genderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  genderCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  genderText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  genderTextSelected: {
    color: colors.primary,
  },
  saveButton: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  disabledButton: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
