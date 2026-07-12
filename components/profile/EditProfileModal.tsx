import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors, radius, shadow, spacing } from "../../constants/theme";

import { Gender, updateMyFullProfile } from "../../services/profile.service";

interface Props {
  visible: boolean;
  profile: any;
  onClose: () => void;
  onUpdated: (profile: any) => void;
}

const genders: {
  value: Gender;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: "male",
    label: "Male",
    icon: "male-outline",
  },
  {
    value: "female",
    label: "Female",
    icon: "female-outline",
  },
  {
    value: "other",
    label: "Other",
    icon: "person-outline",
  },
  {
    value: "prefer_not_to_say",
    label: "Prefer not to say",
    icon: "remove-circle-outline",
  },
];

export default function EditProfileModal({
  visible,
  profile,
  onClose,
  onUpdated,
}: Props) {
  const translateY = useRef(new Animated.Value(700)).current;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender>("prefer_not_to_say");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setFullName(profile?.full_name || "");
    setPhone(profile?.phone || "");
    setDateOfBirth(profile?.date_of_birth || "");

    setGender(profile?.gender || "prefer_not_to_say");

    translateY.setValue(700);

    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 5,
    }).start();
  }, [visible, profile]);

  const close = () => {
    Animated.timing(translateY, {
      toValue: 700,
      duration: 220,
      useNativeDriver: true,
    }).start(onClose);
  };

  const save = async () => {
    if (!fullName.trim()) {
      Alert.alert("Name required", "Enter your full name.");
      return;
    }

    if (phone.replace(/\D/g, "").length !== 10) {
      Alert.alert("Invalid phone", "Enter a valid 10 digit phone number.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      Alert.alert("Invalid date", "Use YYYY-MM-DD format.");
      return;
    }

    setSaving(true);

    const { data, error } = await updateMyFullProfile({
      fullName,
      phone,
      gender,
      dateOfBirth,
    });

    setSaving(false);

    if (error) {
      Alert.alert("Unable to update profile", error.message);
      return;
    }

    onUpdated(data);

    close();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />

        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Edit profile</Text>

              <Text style={styles.subtitle}>
                Update your personal information
              </Text>
            </View>

            <Pressable style={styles.closeButton} onPress={close}>
              <Ionicons name="close" size={21} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>Full name</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={19}
                color={colors.textMuted}
              />

              <TextInput
                value={fullName}
                onChangeText={setFullName}
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <Text style={styles.label}>Phone</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="call-outline"
                size={19}
                color={colors.textMuted}
              />

              <Text style={styles.prefix}>+91</Text>

              <TextInput
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            <Text style={styles.label}>Date of birth</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="calendar-outline"
                size={19}
                color={colors.textMuted}
              />

              <TextInput
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <Text style={styles.label}>Gender</Text>

            <View style={styles.genderGrid}>
              {genders.map((item) => {
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
                      size={20}
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
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && {
                  transform: [{ scale: 0.97 }],
                },
                saving && {
                  opacity: 0.6,
                },
              ]}
              onPress={save}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.saveText}>Save changes</Text>

                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                </>
              )}
            </Pressable>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15,23,42,0.35)",
  },

  sheet: {
    maxHeight: "88%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    ...shadow.card,
  },

  handle: {
    width: 42,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 7,
    marginTop: spacing.md,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },

  input: {
    flex: 1,
    paddingVertical: 14,
    marginLeft: spacing.sm,
    fontSize: 15,
    color: colors.textPrimary,
  },

  prefix: {
    marginLeft: spacing.sm,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  genderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  genderCard: {
    width: "48%",
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    gap: spacing.sm,
  },

  genderCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  genderText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  genderTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },

  saveButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },

  saveText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
