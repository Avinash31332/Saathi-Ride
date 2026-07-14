import { View } from "react-native";

import StatCard from "../common/StatCard";
import SectionHeader from "./SectionHeader";

import { router } from "expo-router";
import { spacing } from "../../constants/theme";

export default function PassengerView({ profile }: any) {
  return (
    <>
      <View
        style={{
          flexDirection: "row",
          gap: spacing.md,
        }}
      >
        <StatCard
          title="Passenger Rating"
          value={Number(profile.passenger_rating ?? 0).toFixed(1)}
          subtitle={`${profile.passenger_review_count ?? 0} Reviews`}
          icon="star"
        />

        <StatCard
          title="Trips"
          value={profile.passenger_completed_trips ?? 0}
          icon="briefcase"
        />
      </View>

      <SectionHeader title="Passenger" />

      <View
        style={{
          height: spacing.md,
        }}
      />

      <StatCard
        title="Booking History"
        value="View"
        icon="time"
        onPress={() => router.push("/bookings/my-bookings")}
      />

      <View
        style={{
          height: spacing.md,
        }}
      />

      <StatCard
        title="Trusted Contacts"
        value="Manage"
        icon="people"
        onPress={() => router.push("/profile/trusted-contacts")}
      />
    </>
  );
}
