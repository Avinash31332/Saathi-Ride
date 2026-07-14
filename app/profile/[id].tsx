import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import { colors, radius, spacing, typography } from "../../constants/theme";
import {
  getDriverProfile,
  getDriverVehicles,
} from "../../services/driver.service";

export default function DriverProfile() {
  const { id } = useLocalSearchParams();

  const [profile, setProfile] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDriver();
  }, []);

  const loadDriver = async () => {
    try {
      const { data } = await getDriverProfile(id as string);

      const vehiclesResult = await getDriverVehicles(id as string);

      setProfile(data);

      setVehicles(vehiclesResult.data || []);
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
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
        <Ionicons
          name="person-remove-outline"
          size={40}
          color={colors.textMuted}
        />
        <Text style={styles.emptyText}>Driver not found</Text>
      </View>
    );
  }

  const verificationStyle = () => {
    const status = (profile.verification_status || "").toLowerCase();
    if (status === "verified") {
      return {
        bg: colors.successLight,
        color: colors.success,
        icon: "shield-checkmark" as const,
      };
    }
    if (status === "pending") {
      return {
        bg: "#FFFBEB",
        color: colors.warning,
        icon: "time" as const,
      };
    }
    return {
      bg: colors.surfaceMuted,
      color: colors.textSecondary,
      icon: "shield-outline" as const,
    };
  };

  const verification = verificationStyle();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={32} color={colors.primary} />
        </View>

        <Text style={styles.name}>{profile.full_name || "Not Provided"}</Text>
        <Text style={styles.phone}>{profile.phone || "Not Provided"}</Text>

        <View
          style={[
            styles.verificationBadge,
            { backgroundColor: verification.bg },
          ]}
        >
          <Ionicons
            name={verification.icon}
            size={14}
            color={verification.color}
          />
          <Text
            style={[styles.verificationText, { color: verification.color }]}
          >
            {profile.verification_status || "Not Verified"}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="star" size={18} color={colors.warning} />
          <Text style={styles.statValue}>
            {Number(profile.rating || 0).toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={18}
            color={colors.primary}
          />
          <Text style={styles.statValue}>{profile.total_reviews || 0}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons
            name="checkmark-done-outline"
            size={18}
            color={colors.success}
          />
          <Text style={styles.statValue}>{profile.total_rides || 0}</Text>
          <Text style={styles.statLabel}>Rides</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Vehicles</Text>

      {vehicles.length === 0 ? (
        <View style={styles.emptyVehicles}>
          <Ionicons name="car-outline" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>No vehicles added</Text>
        </View>
      ) : (
        vehicles.map((vehicle) => (
          <View key={vehicle.id} style={styles.vehicleCard}>
            <View style={styles.vehicleHeader}>
              <Ionicons
                name="car-sport-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.vehicleName}>{vehicle.vehicle_name}</Text>
            </View>

            <View style={styles.vehicleMetaRow}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="pricetag-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.metaText}>{vehicle.vehicle_number}</Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons
                  name="people-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.metaText}>{vehicle.total_seats} seats</Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons
                  name="color-palette-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.metaText}>{vehicle.vehicle_color}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 14,
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.title,
    fontSize: 20,
  },
  phone: {
    ...typography.subtitle,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyVehicles: {
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vehicleCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  vehicleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  vehicleMetaRow: {
    flexDirection: "row",
    gap: spacing.md,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
