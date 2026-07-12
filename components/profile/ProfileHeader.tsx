import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  colors,
  radius,
  shadow,
  spacing,
  typography,
} from "../../constants/theme";

interface Props {
  profile: any;
  uploading?: boolean;
  onEditImage?: () => void;
  onEditProfile?: () => void;
}

export default function ProfileHeader({
  profile,
  uploading = false,
  onEditImage,
  onEditProfile,
}: Props) {
  const memberDate = profile.member_since || profile.created_at;

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        <View style={styles.avatar}>
          {profile.profile_image ? (
            <Image
              source={{
                uri: profile.profile_image,
              }}
              style={styles.avatarImage}
            />
          ) : (
            <Ionicons name="person" size={46} color={colors.primary} />
          )}

          {uploading && (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.cameraButton,
            pressed && {
              transform: [{ scale: 0.92 }],
            },
          ]}
          onPress={onEditImage}
          disabled={uploading}
        >
          <Ionicons name="camera" size={17} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.nameRow}>
        <Text style={styles.name}>{profile.full_name || "Saathi Member"}</Text>

        <Pressable
          style={({ pressed }) => [
            styles.editButton,
            pressed && {
              transform: [{ scale: 0.94 }],
            },
          ]}
          onPress={onEditProfile}
        >
          <Ionicons name="pencil" size={15} color={colors.primary} />
        </Pressable>
      </View>

      {!!memberDate && (
        <Text style={styles.member}>
          Member since{" "}
          {new Date(memberDate).toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
          })}
        </Text>
      )}

      <View style={styles.badges}>
        {profile.is_verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={15} color="#15803D" />

            <Text style={styles.verifiedText}>Identity Verified</Text>
          </View>
        )}

        {profile.driver_verification_status === "approved" && (
          <View style={styles.driverBadge}>
            <Ionicons
              name="shield-checkmark"
              size={15}
              color={colors.primary}
            />

            <Text style={styles.driverText}>Driver Verified</Text>
          </View>
        )}

        {profile.women_trusted_driver && (
          <View style={styles.womenBadge}>
            <Ionicons name="shield-checkmark" size={15} color="#BE185D" />

            <Text style={styles.womenText}>Women Trusted</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: spacing.lg,
  },

  avatarWrapper: {
    position: "relative",
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 3,
    borderColor: colors.surface,
    ...shadow.card,
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  cameraButton: {
    position: "absolute",
    right: -2,
    bottom: 3,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.surface,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
  },

  name: {
    ...typography.title,
  },

  editButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },

  member: {
    color: colors.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },

  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "#ECFDF5",
  },

  verifiedText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803D",
  },

  driverBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },

  driverText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },

  womenBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "#FCE7F3",
  },

  womenText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#BE185D",
  },
});
