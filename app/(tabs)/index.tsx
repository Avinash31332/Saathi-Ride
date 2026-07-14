import CreateRideHero from "@/components/home/CreateRideHero";
import { Text } from "@react-navigation/elements";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ContinueJourneyCard from "../../components/home/ContinueJourneyCard";
import GreetingCard from "../../components/home/GreetingCard";
import QuickActionGrid from "../../components/home/QuickActionGrid";
import SearchCard from "../../components/home/SearchCard";
import UpcomingRideCard from "../../components/home/UpcomingRideCard";
import { colors, spacing, typography } from "../../constants/theme";
export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <GreetingCard name="Avinash" />

        <SearchCard />
        <ContinueJourneyCard />
        <UpcomingRideCard />
        <Text
          style={{
            ...typography.heading,
            marginTop: spacing.xl,
          }}
        >
          Want to offer a ride?
        </Text>
        <Text
          style={{
            ...typography.body,
            marginTop: spacing.md,
          }}
        >
          Feel Like traveling?
        </Text>
        <CreateRideHero />
        <QuickActionGrid />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryLight,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
});
