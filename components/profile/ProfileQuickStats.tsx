import { StyleSheet, View } from "react-native";
import { spacing } from "../../constants/theme";
import StatCard from "../common/StatCard";

export default function ProfileQuickStats({ profile }: any) {
  return (
    <View style={styles.row}>
      <StatCard
        title="Driver"
        value={Number(profile.driver_rating ?? 0).toFixed(1)}
        icon="star"
      />

      <StatCard
        title="Rides"
        value={profile.driver_completed_rides ?? 0}
        icon="car-sport"
      />

      <StatCard
        title="Trips"
        value={profile.passenger_completed_trips ?? 0}
        icon="briefcase"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
