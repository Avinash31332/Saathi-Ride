import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
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
import { getMyProfile } from "../../services/profile.service";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = async () => {
    const { data, error } = await getMyProfile();

    if (error) {
      console.log("PROFILE ERROR:", error);
    }

    setProfile(data);
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, []),
  );

  const refresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Profile not found</Text>
      </View>
    );
  }

  const genderLabel =
    profile.gender === "female"
      ? "Female"
      : profile.gender === "male"
        ? "Male"
        : profile.gender === "other"
          ? "Other"
          : profile.gender === "prefer_not_to_say"
            ? "Prefer not to say"
            : "Not set";

  const isVerifiedDriver = profile.driver_verification_status === "approved";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Feather name="user" size={34} color={colors.primary} />
        </View>

        <Text style={styles.name}>
          {profile.full_name || "Complete your profile"}
        </Text>

        <Text style={styles.phone}>{profile.phone || "Phone not added"}</Text>

        <Text style={styles.gender}>{genderLabel}</Text>

        <View style={styles.badges}>
          {isVerifiedDriver && (
            <View style={styles.verifiedBadge}>
              <Ionicons
                name="shield-checkmark"
                size={14}
                color={colors.success}
              />
              <Text style={styles.verifiedText}>Verified Driver</Text>
            </View>
          )}

          {profile.women_trusted_driver && (
            <View style={styles.womenBadge}>
              <Ionicons name="shield" size={14} color="#9D174D" />
              <Text style={styles.womenBadgeText}>Women Trusted Driver</Text>
            </View>
          )}
        </View>

        <Pressable
          style={styles.editButton}
          onPress={() => router.push("/profile/edit" as any)}
        >
          <Feather name="edit-2" size={15} color={colors.primary} />
          <Text style={styles.editText}>Edit profile</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Your reputation</Text>

      <View style={styles.ratingRow}>
        <View style={styles.ratingCard}>
          <View style={styles.ratingIcon}>
            <Ionicons name="car" size={20} color={colors.primary} />
          </View>

          <Text style={styles.ratingTitle}>Driver</Text>

          <Text style={styles.ratingValue}>
            {Number(profile.driver_rating || 0).toFixed(1)}
          </Text>

          <View style={styles.starRow}>
            <Ionicons name="star" size={15} color={colors.warning} />
            <Text style={styles.reviewCount}>
              {profile.driver_total_reviews || 0} reviews
            </Text>
          </View>

          <Text style={styles.tripCount}>
            {profile.driver_completed_rides || 0} completed rides
          </Text>
        </View>

        <View style={styles.ratingCard}>
          <View style={styles.ratingIcon}>
            <Ionicons name="person" size={20} color={colors.primary} />
          </View>

          <Text style={styles.ratingTitle}>Passenger</Text>

          <Text style={styles.ratingValue}>
            {Number(profile.passenger_rating || 0).toFixed(1)}
          </Text>

          <View style={styles.starRow}>
            <Ionicons name="star" size={15} color={colors.warning} />
            <Text style={styles.reviewCount}>
              {profile.passenger_total_reviews || 0} reviews
            </Text>
          </View>

          <Text style={styles.tripCount}>
            {profile.passenger_completed_trips || 0} completed trips
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Safety & verification</Text>

      <MenuItem
        icon="shield"
        title="Driver verification"
        subtitle={
          isVerifiedDriver
            ? "Your driver account is verified"
            : "Verify documents to publish rides"
        }
        onPress={() => router.push("/profile/verification" as any)}
      />

      <MenuItem
        icon="users"
        title="Trusted contacts"
        subtitle="Add up to 3 people for safety alerts"
        onPress={() => router.push("/profile/trusted-contacts" as any)}
      />

      <Text style={styles.sectionTitle}>Driving</Text>

      <MenuItem
        icon="truck"
        title="My vehicles"
        subtitle="Manage your registered vehicles"
        onPress={() => router.push("/profile/my-cars" as any)}
      />
    </ScrollView>
  );
}

function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIcon}>
        <Feather name={icon} size={19} color={colors.primary} />
      </View>

      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>

      <Feather name="chevron-right" size={20} color={colors.textMuted} />
    </Pressable>
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
  emptyText: {
    color: colors.textMuted,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.title,
    fontSize: 22,
  },
  phone: {
    color: colors.textSecondary,
    marginTop: 3,
  },
  gender: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 3,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  verifiedText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "700",
  },
  womenBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FCE7F3",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  womenBadgeText: {
    color: "#9D174D",
    fontSize: 12,
    fontWeight: "700",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  editText: {
    color: colors.primary,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  ratingRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  ratingCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ratingIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  ratingTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  ratingValue: {
    fontSize: 27,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 3,
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tripCount: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 7,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  menuContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
