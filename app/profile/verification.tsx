import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getMyProfile } from "../../services/profile.service";
import {
  submitDriverVerification,
  uploadVerificationDocument,
  VerificationDocumentType,
} from "../../services/verification.service";

import { colors, radius, spacing, typography } from "../../constants/theme";

export default function VerificationScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<VerificationDocumentType | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const loadProfile = async () => {
    const { data, error } = await getMyProfile();

    if (error) {
      Alert.alert("Error", error.message);
    }

    setProfile(data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, []),
  );

  const uploadDocument = async (type: VerificationDocumentType) => {
    try {
      setUploading(type);

      const path = await uploadVerificationDocument(type);

      if (path) {
        await loadProfile();

        Alert.alert(
          "Document uploaded",
          type === "aadhaar"
            ? "Your Aadhaar document has been uploaded."
            : "Your driving license has been uploaded.",
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Upload failed",
        error?.message || "Unable to upload document.",
      );
    } finally {
      setUploading(null);
    }
  };

  const submitVerification = async () => {
    setSubmitting(true);

    const { error } = await submitDriverVerification();

    setSubmitting(false);

    if (error) {
      Alert.alert("Unable to submit", error.message);
      return;
    }

    await loadProfile();

    Alert.alert(
      "Verification submitted",
      "Your documents are now pending verification.",
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const status = profile?.driver_verification_status || "not_submitted";

  const aadhaarUploaded = !!profile?.aadhaar_url;
  const licenseUploaded = !!profile?.driving_license_url;

  const canSubmit = aadhaarUploaded && licenseUploaded;

  const statusConfig =
    status === "approved"
      ? {
          icon: "shield-checkmark" as const,
          title: "Driver verified",
          text: "Your driver profile has been approved.",
          background: colors.successLight,
          color: colors.success,
        }
      : status === "pending"
        ? {
            icon: "time" as const,
            title: "Verification pending",
            text: "Your documents are waiting for review.",
            background: "#FFFBEB",
            color: colors.warning,
          }
        : status === "rejected"
          ? {
              icon: "alert-circle" as const,
              title: "Verification needs attention",
              text: "Review your documents and submit them again.",
              background: colors.dangerLight,
              color: colors.danger,
            }
          : {
              icon: "shield-outline" as const,
              title: "Become a verified driver",
              text: "Verify your identity and license to publish rides.",
              background: colors.primaryLight,
              color: colors.primary,
            };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Feather name="arrow-left" size={22} color={colors.textPrimary} />
      </Pressable>

      <Text style={styles.title}>Driver verification</Text>

      <Text style={styles.subtitle}>
        Complete verification before publishing rides
      </Text>

      <View
        style={[
          styles.statusCard,
          {
            backgroundColor: statusConfig.background,
          },
        ]}
      >
        <Ionicons
          name={statusConfig.icon}
          size={30}
          color={statusConfig.color}
        />

        <View style={styles.statusContent}>
          <Text
            style={[
              styles.statusTitle,
              {
                color: statusConfig.color,
              },
            ]}
          >
            {statusConfig.title}
          </Text>

          <Text style={styles.statusText}>{statusConfig.text}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Required documents</Text>

      <DocumentCard
        title="Aadhaar"
        subtitle="Government identity verification"
        uploaded={aadhaarUploaded}
        verified={profile?.aadhaar_verified}
        loading={uploading === "aadhaar"}
        onPress={() => uploadDocument("aadhaar")}
      />

      <DocumentCard
        title="Driving license"
        subtitle="Required to publish rides"
        uploaded={licenseUploaded}
        verified={profile?.driving_license_verified}
        loading={uploading === "driving-license"}
        onPress={() => uploadDocument("driving-license")}
      />

      <View style={styles.infoCard}>
        <Feather name="lock" size={18} color={colors.primary} />

        <Text style={styles.infoText}>
          Your documents are stored in a private verification bucket and are not
          visible on your public profile.
        </Text>
      </View>

      {status !== "approved" && (
        <Pressable
          style={[
            styles.submitButton,
            (!canSubmit || submitting) && styles.disabledButton,
          ]}
          onPress={submitVerification}
          disabled={!canSubmit || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={19} color="#FFFFFF" />

              <Text style={styles.submitText}>Submit for verification</Text>
            </>
          )}
        </Pressable>
      )}
    </ScrollView>
  );
}

function DocumentCard({
  title,
  subtitle,
  uploaded,
  verified,
  loading,
  onPress,
}: {
  title: string;
  subtitle: string;
  uploaded: boolean;
  verified: boolean;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.documentCard}>
      <View
        style={[styles.documentIcon, uploaded && styles.documentIconUploaded]}
      >
        <Feather
          name="file-text"
          size={21}
          color={uploaded ? colors.success : colors.primary}
        />
      </View>

      <View style={styles.documentContent}>
        <Text style={styles.documentTitle}>{title}</Text>

        <Text style={styles.documentSubtitle}>{subtitle}</Text>

        {verified ? (
          <Text style={styles.verifiedText}>Verified</Text>
        ) : uploaded ? (
          <Text style={styles.uploadedText}>Uploaded</Text>
        ) : (
          <Text style={styles.requiredText}>Required</Text>
        )}
      </View>

      <Pressable style={styles.uploadButton} onPress={onPress}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={styles.uploadText}>
            {uploaded ? "Replace" : "Upload"}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
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
    alignItems: "center",
    justifyContent: "center",
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
  statusCard: {
    flexDirection: "row",
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
  },
  statusContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  documentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  documentIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  documentIconUploaded: {
    backgroundColor: colors.successLight,
  },
  documentContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  documentTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  documentSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  verifiedText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  uploadedText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  requiredText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  uploadButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
  },
  uploadText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  infoText: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  submitButton: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
