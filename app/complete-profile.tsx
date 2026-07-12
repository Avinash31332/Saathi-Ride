import { Ionicons } from "@expo/vector-icons";
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

import { colors, radius, spacing, typography } from "../constants/theme";

import { supabase } from "../services/supabase";

const TOTAL_STEPS = 3;

type Gender = "male" | "female" | "other";

export default function CompleteProfileScreen() {
  const [step, setStep] = useState(1);

  const [fullName, setFullName] = useState("");

  const [phone, setPhone] = useState("");

  const [dateOfBirth, setDateOfBirth] = useState("");

  const [gender, setGender] = useState<Gender | null>(null);

  const [loading, setLoading] = useState(false);

  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");

        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          full_name,
          phone,
          date_of_birth,
          gender,
          profile_completed
        `,
        )
        .eq("id", user.id)
        .single();

      if (error) {
        console.log("PROFILE LOAD ERROR:", error);

        return;
      }

      if (data?.profile_completed) {
        router.replace("/(tabs)");

        return;
      }

      setFullName(data?.full_name || "");

      setPhone(data?.phone || "");

      setDateOfBirth(data?.date_of_birth || "");

      if (
        data?.gender === "male" ||
        data?.gender === "female" ||
        data?.gender === "other"
      ) {
        setGender(data.gender);
      }
    } finally {
      setCheckingProfile(false);
    }
  };

  const validateStepOne = () => {
    if (!fullName.trim()) {
      Alert.alert("Full name required", "Please enter your full name.");

      return false;
    }

    if (!phone.trim()) {
      Alert.alert("Phone number required", "Please enter your phone number.");

      return false;
    }

    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      Alert.alert(
        "Invalid phone number",
        "Enter a valid 10 digit phone number.",
      );

      return false;
    }

    if (!dateOfBirth.trim()) {
      Alert.alert("Date of birth required", "Please enter your date of birth.");

      return false;
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(dateOfBirth)) {
      Alert.alert("Invalid date", "Use YYYY-MM-DD format.");

      return false;
    }

    return true;
  };

  const goNext = () => {
    if (step === 1 && !validateStepOne()) {
      return;
    }

    if (step === 2 && !gender) {
      Alert.alert("Select gender", "Please select your gender.");

      return;
    }

    setStep((currentStep) => Math.min(currentStep + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setStep((currentStep) => Math.max(currentStep - 1, 1));
  };

  const completeProfile = async () => {
    if (!gender) {
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw userError || new Error("Not authenticated");
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),

          phone: phone.trim(),

          date_of_birth: dateOfBirth,

          gender,

          profile_completed: true,
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      router.replace("/(tabs)");
    } catch (error: any) {
      console.log("COMPLETE PROFILE ERROR:", error);

      Alert.alert(
        "Unable to complete profile",
        error?.message || "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStepOne = () => (
    <>
      <View style={styles.stepHeading}>
        <View style={styles.stepIcon}>
          <Ionicons name="person-outline" size={25} color={colors.primary} />
        </View>

        <Text style={styles.stepTitle}>Personal details</Text>

        <Text style={styles.stepSubtitle}>Tell us a little about yourself</Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Full name</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={19} color={colors.textMuted} />

          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Phone number</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={19} color={colors.textMuted} />

          <Text style={styles.phonePrefix}>+91</Text>

          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="10 digit mobile number"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.input}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
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
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </View>
      </View>
    </>
  );

  const renderStepTwo = () => {
    const genderOptions: {
      value: Gender;

      title: string;

      subtitle: string;

      icon: keyof typeof Ionicons.glyphMap;
    }[] = [
      {
        value: "male",

        title: "Male",

        subtitle: "Male profile",

        icon: "male-outline",
      },

      {
        value: "female",

        title: "Female",

        subtitle: "Safety Mode and Women Only rides available",

        icon: "female-outline",
      },

      {
        value: "other",

        title: "Other",

        subtitle: "Other gender identity",

        icon: "person-outline",
      },
    ];

    return (
      <>
        <View style={styles.stepHeading}>
          <View style={styles.stepIcon}>
            <Ionicons name="people-outline" size={25} color={colors.primary} />
          </View>

          <Text style={styles.stepTitle}>Select your gender</Text>

          <Text style={styles.stepSubtitle}>
            This helps us provide the right ride and safety experience
          </Text>
        </View>

        {genderOptions.map((option) => {
          const selected = gender === option.value;

          return (
            <Pressable
              key={option.value}
              style={[
                styles.selectionCard,

                selected && styles.selectionCardActive,
              ]}
              onPress={() => setGender(option.value)}
            >
              <View
                style={[
                  styles.selectionIcon,

                  selected && styles.selectionIconActive,
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={23}
                  color={selected ? colors.primary : colors.textSecondary}
                />
              </View>

              <View style={styles.selectionContent}>
                <Text style={styles.selectionTitle}>{option.title}</Text>

                <Text style={styles.selectionSubtitle}>{option.subtitle}</Text>
              </View>

              <Ionicons
                name={selected ? "checkmark-circle" : "ellipse-outline"}
                size={25}
                color={selected ? colors.primary : colors.textMuted}
              />
            </Pressable>
          );
        })}
      </>
    );
  };

  const renderStepThree = () => (
    <>
      <View style={styles.stepHeading}>
        <View style={styles.stepIcon}>
          <Ionicons
            name="checkmark-circle-outline"
            size={27}
            color={colors.primary}
          />
        </View>

        <Text style={styles.stepTitle}>Review your profile</Text>

        <Text style={styles.stepSubtitle}>
          Make sure your details are correct
        </Text>
      </View>

      <View style={styles.reviewCard}>
        <ReviewRow icon="person-outline" label="Full name" value={fullName} />

        <ReviewRow icon="call-outline" label="Phone" value={`+91 ${phone}`} />

        <ReviewRow
          icon="calendar-outline"
          label="Date of birth"
          value={dateOfBirth}
        />

        <ReviewRow
          icon="people-outline"
          label="Gender"
          value={gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : ""}
          last
        />
      </View>

      {gender === "female" && (
        <View style={styles.safetyCard}>
          <Ionicons name="shield-checkmark" size={25} color="#BE185D" />

          <View style={styles.safetyContent}>
            <Text style={styles.safetyTitle}>Safety Mode available</Text>

            <Text style={styles.safetySubtitle}>
              Enhanced journey tracking, trusted contacts and SOS will be
              available during your rides.
            </Text>
          </View>
        </View>
      )}
    </>
  );

  if (checkingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Complete your profile</Text>

          <Text style={styles.subtitle}>
            Step {step} of {TOTAL_STEPS}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,

              {
                width: `${(step / TOTAL_STEPS) * 100}%`,
              },
            ]}
          />
        </View>

        <View style={styles.formCard}>
          {step === 1 && renderStepOne()}

          {step === 2 && renderStepTwo()}

          {step === 3 && renderStepThree()}
        </View>

        <View style={styles.navigationRow}>
          {step > 1 && (
            <Pressable
              style={styles.backButton}
              onPress={goBack}
              disabled={loading}
            >
              <Ionicons
                name="arrow-back"
                size={18}
                color={colors.textPrimary}
              />

              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          )}

          <Pressable
            style={[
              styles.nextButton,

              step === 1 && styles.fullWidthButton,

              loading && styles.disabledButton,
            ]}
            onPress={step === TOTAL_STEPS ? completeProfile : goNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {step === TOTAL_STEPS ? "Complete Profile" : "Continue"}
                </Text>

                <Ionicons
                  name={step === TOTAL_STEPS ? "checkmark" : "arrow-forward"}
                  size={18}
                  color="#FFFFFF"
                />
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ReviewRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;

  label: string;

  value: string;

  last?: boolean;
}) {
  return (
    <View style={[styles.reviewRow, last && styles.reviewRowLast]}>
      <View style={styles.reviewIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>

      <View style={styles.reviewContent}>
        <Text style={styles.reviewLabel}>{label}</Text>

        <Text style={styles.reviewValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: colors.surfaceMuted,
  },

  content: {
    flexGrow: 1,

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

  header: {
    marginBottom: spacing.md,
  },

  title: {
    ...typography.title,
  },

  subtitle: {
    ...typography.subtitle,

    marginTop: 4,
  },

  progressTrack: {
    height: 7,

    backgroundColor: colors.border,

    borderRadius: radius.full,

    overflow: "hidden",

    marginBottom: spacing.lg,
  },

  progressFill: {
    height: "100%",

    backgroundColor: colors.primary,

    borderRadius: radius.full,
  },

  formCard: {
    backgroundColor: colors.surface,

    borderRadius: radius.lg,

    borderWidth: 1,

    borderColor: colors.border,

    padding: spacing.lg,
  },

  stepHeading: {
    alignItems: "center",

    marginBottom: spacing.xl,
  },

  stepIcon: {
    width: 54,

    height: 54,

    borderRadius: 27,

    backgroundColor: colors.primaryLight,

    alignItems: "center",

    justifyContent: "center",

    marginBottom: spacing.md,
  },

  stepTitle: {
    fontSize: 20,

    fontWeight: "800",

    color: colors.textPrimary,

    textAlign: "center",
  },

  stepSubtitle: {
    fontSize: 13,

    color: colors.textSecondary,

    textAlign: "center",

    lineHeight: 19,

    marginTop: 5,
  },

  fieldGroup: {
    marginBottom: spacing.md,
  },

  label: {
    fontSize: 13,

    fontWeight: "600",

    color: colors.textSecondary,

    marginBottom: 7,
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

  phonePrefix: {
    fontSize: 15,

    fontWeight: "600",

    color: colors.textPrimary,

    marginLeft: spacing.sm,
  },

  selectionCard: {
    flexDirection: "row",

    alignItems: "center",

    borderWidth: 1.5,

    borderColor: colors.border,

    borderRadius: radius.lg,

    padding: spacing.md,

    marginBottom: spacing.sm,
  },

  selectionCardActive: {
    borderColor: colors.primary,

    backgroundColor: colors.primaryLight,
  },

  selectionIcon: {
    width: 46,

    height: 46,

    borderRadius: 23,

    backgroundColor: colors.surfaceMuted,

    alignItems: "center",

    justifyContent: "center",
  },

  selectionIconActive: {
    backgroundColor: colors.surface,
  },

  selectionContent: {
    flex: 1,

    marginLeft: spacing.md,

    marginRight: spacing.sm,
  },

  selectionTitle: {
    fontSize: 15,

    fontWeight: "700",

    color: colors.textPrimary,
  },

  selectionSubtitle: {
    fontSize: 12,

    color: colors.textSecondary,

    lineHeight: 17,

    marginTop: 3,
  },

  reviewCard: {
    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: radius.lg,

    overflow: "hidden",
  },

  reviewRow: {
    flexDirection: "row",

    alignItems: "center",

    padding: spacing.md,

    borderBottomWidth: 1,

    borderBottomColor: colors.border,
  },

  reviewRowLast: {
    borderBottomWidth: 0,
  },

  reviewIcon: {
    width: 38,

    height: 38,

    borderRadius: 19,

    backgroundColor: colors.primaryLight,

    alignItems: "center",

    justifyContent: "center",
  },

  reviewContent: {
    marginLeft: spacing.md,

    flex: 1,
  },

  reviewLabel: {
    fontSize: 11,

    color: colors.textMuted,
  },

  reviewValue: {
    fontSize: 15,

    fontWeight: "700",

    color: colors.textPrimary,

    marginTop: 3,
  },

  safetyCard: {
    flexDirection: "row",

    backgroundColor: "#FDF2F8",

    borderRadius: radius.lg,

    padding: spacing.md,

    marginTop: spacing.md,
  },

  safetyContent: {
    flex: 1,

    marginLeft: spacing.md,
  },

  safetyTitle: {
    fontSize: 14,

    fontWeight: "700",

    color: "#BE185D",
  },

  safetySubtitle: {
    fontSize: 12,

    color: colors.textSecondary,

    lineHeight: 18,

    marginTop: 4,
  },

  navigationRow: {
    flexDirection: "row",

    gap: spacing.sm,

    marginTop: spacing.lg,
  },

  backButton: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 6,

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: radius.md,

    paddingHorizontal: spacing.lg,

    paddingVertical: 14,

    backgroundColor: colors.surface,
  },

  backButtonText: {
    fontSize: 14,

    fontWeight: "700",

    color: colors.textPrimary,
  },

  nextButton: {
    flex: 1,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 7,

    backgroundColor: colors.primary,

    borderRadius: radius.md,

    paddingVertical: 14,
  },

  fullWidthButton: {
    flex: 1,
  },

  nextButtonText: {
    color: "#FFFFFF",

    fontSize: 14,

    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.6,
  },
});
