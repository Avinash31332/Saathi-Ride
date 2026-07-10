import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { supabase } from "../../services/supabase";
import useGlobalEvents from "../../hooks/useGlobalEvents";
import { colors, spacing, radius, typography } from "../../constants/theme";
// ^ adjust this import path to wherever your colors/spacing/radius/typography file lives

export default function HomeScreen() {
  const { setEvent } = useGlobalEvents() as any;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  // ---- Menu data (grouped into sections) ----
  const sections: {
    title: string;
    items: {
      label: string;
      subtitle?: string;
      icon: React.ReactNode;
      onPress: () => void;
      variant?: "default" | "primary" | "danger";
    }[];
  }[] = [
    {
      title: "Rides",
      items: [
        {
          label: "Create Ride",
          subtitle: "Offer a ride to others",
          icon: (
            <Ionicons
              name="add-circle-outline"
              size={22}
              color={colors.primary}
            />
          ),
          onPress: () => router.push("/rides/create"),
          variant: "primary",
        },
        {
          label: "Search Rides",
          subtitle: "Find a ride to your destination",
          icon: (
            <Ionicons name="search-outline" size={22} color={colors.primary} />
          ),
          onPress: () => router.push("/rides/search"),
        },
        {
          label: "My Rides",
          subtitle: "Rides you're hosting",
          icon: (
            <MaterialCommunityIcons
              name="car-outline"
              size={22}
              color={colors.primary}
            />
          ),
          onPress: () => router.push("/rides/my-rides"),
        },
      ],
    },
    {
      title: "Bookings",
      items: [
        {
          label: "My Bookings",
          subtitle: "Rides you've booked",
          icon: (
            <Ionicons name="ticket-outline" size={22} color={colors.primary} />
          ),
          onPress: () => router.push("/bookings/my-bookings"),
        },
        {
          label: "My Passengers",
          subtitle: "Manage your passengers",
          icon: (
            <Ionicons name="people-outline" size={22} color={colors.primary} />
          ),
          onPress: () => router.push("/rides/passengers"),
        },
      ],
    },
    {
      title: "Profile & Vehicles",
      items: [
        {
          label: "Edit Profile",
          subtitle: "Your account details",
          icon: (
            <Ionicons name="person-outline" size={22} color={colors.primary} />
          ),
          onPress: () => router.push("/profile"),
        },
        {
          label: "My Cars",
          subtitle: "Vehicles you've added",
          icon: (
            <MaterialCommunityIcons
              name="car-side"
              size={22}
              color={colors.primary}
            />
          ),
          onPress: () => router.push("/profile/my-cars"),
        },
        {
          label: "Add Car",
          subtitle: "Register a new vehicle",
          icon: (
            <Ionicons name="add-outline" size={22} color={colors.primary} />
          ),
          onPress: () => router.push("/profile/add-vehicle"),
        },
        // {
        //   label: "My Reviews",
        //   subtitle: "Feedback from other users",
        //   icon: (
        //     <Ionicons name="star-outline" size={22} color={colors.primary} />
        //   ),
        //   onPress: () => router.push("/rides/review"),
        // },
      ],
    },
    {
      title: "Developer",
      items: [
        {
          label: "Test Global Event",
          icon: (
            <Ionicons name="flash-outline" size={20} color={colors.textMuted} />
          ),
          onPress: () => setEvent({ type: "rideCompletion" }),
        },
        {
          label: "Debug Events",
          icon: (
            <Ionicons name="bug-outline" size={20} color={colors.textMuted} />
          ),
          onPress: () => router.push("/debug/events" as any),
        },
        {
          label: "Test",
          icon: (
            <Ionicons name="flask-outline" size={20} color={colors.textMuted} />
          ),
          onPress: () => router.push("/test/Test" as any),
        },
        {
          label: "Place Search",
          icon: (
            <Ionicons
              name="location-outline"
              size={20}
              color={colors.textMuted}
            />
          ),
          onPress: () => router.push("/test/PlaceSearchTest" as any),
        },
        {
          label: "Route Preview",
          icon: (
            <Ionicons name="map-outline" size={20} color={colors.textMuted} />
          ),
          onPress: () => router.push("/test/RoutePreviewTest" as any),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.header}
        >
          <Text style={typography.title}>Hey there 👋</Text>
          <Text style={typography.subtitle}>Where are we headed today?</Text>
        </Animated.View>

        {/* Quick action banner */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.heroCard}
            onPress={() => router.push("/rides/search")}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Find a ride</Text>
              <Text style={styles.heroSubtitle}>
                Search rides going your way
              </Text>
            </View>
            <View style={styles.heroIconWrap}>
              <Ionicons
                name="car-sport-outline"
                size={28}
                color={colors.surface}
              />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Sections */}
        {sections.map((section, sIdx) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, iIdx) => (
                <Animated.View
                  key={item.label}
                  entering={FadeInDown.delay(
                    120 + sIdx * 60 + iIdx * 40,
                  ).duration(350)}
                >
                  <TouchableOpacity
                    activeOpacity={0.6}
                    style={[
                      styles.row,
                      iIdx === section.items.length - 1 && styles.rowLast,
                    ]}
                    onPress={item.onPress}
                  >
                    <View style={styles.rowIconWrap}>{item.icon}</View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowLabel}>{item.label}</Text>
                      {item.subtitle ? (
                        <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
                      ) : null}
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  heroTitle: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  heroSubtitle: {
    color: colors.primaryLight,
    fontSize: 13,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  rowLabel: {
    ...typography.body,
    fontWeight: "600",
  },
  rowSubtitle: {
    ...typography.subtitle,
    fontSize: 12,
    marginTop: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: "700",
    fontSize: 15,
    marginLeft: spacing.xs,
  },
});
