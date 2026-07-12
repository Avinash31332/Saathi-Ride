import { View } from "react-native";

import StatCard from "../common/StatCard";
import SectionHeader from "./SectionHeader";

import { spacing } from "../../constants/theme";

interface Props {
  profile: any;
}

export default function DriverView({ profile }: Props) {
  return (
    <>
      <View
        style={{
          flexDirection: "row",
          gap: spacing.md,
        }}
      >
        <StatCard
          title="Driver Rating"
          value={Number(profile.driver_rating ?? 0).toFixed(1)}
          subtitle={`${profile.driver_review_count ?? 0} Reviews`}
          icon="star"
        />

        <StatCard
          title="Completed Rides"
          value={profile.driver_completed_rides ?? 0}
          icon="car-sport"
        />
      </View>

      <SectionHeader title="Driver" />

      <StatCard title="Vehicles" value="View" icon="car" />

      <View
        style={{
          height: spacing.md,
        }}
      />

      <StatCard
        title="Verification"
        value={
          profile.driver_verification_status === "approved"
            ? "Verified"
            : "Pending"
        }
        icon="shield-checkmark"
      />

      <View
        style={{
          height: spacing.md,
        }}
      />

      <StatCard title="Driver Reviews" value="View" icon="chatbubbles" />

      <View
        style={{
          height: spacing.md,
        }}
      />

      <StatCard title="Driver Dashboard" value="Open" icon="speedometer" />
    </>
  );
}
