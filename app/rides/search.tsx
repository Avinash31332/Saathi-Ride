import { supabase } from "@/services/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, radius, spacing, typography } from "../../constants/theme";
import { searchRides } from "../../services/ride.service";
import { getAvailableSeats } from "../../services/seat.service";

// How long to wait after the last keystroke before hitting the DB.
// Keeps "letter to letter" search from firing a query on every single
// character when someone is typing fast.
const DEBOUNCE_MS = 300;

export default function SearchRideScreen() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  //isFemale
  const [isFemale, setIsFemale] = useState(false);
  const [womenOnlyFilter, setWomenOnlyFilter] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = async (src: string, dest: string) => {
    setLoading(true);

    const { data, error } = await searchRides(src, dest);

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    const ridesWithSeats = await Promise.all(
      (data || []).map(async (ride) => {
        const seats = await getAvailableSeats(ride.id);

        return {
          ...ride,
          currentAvailableSeats: seats,
        };
      }),
    );

    setRides(ridesWithSeats);
    setSearched(true);
    setLoading(false);
  };

  // Fires on every change to source/destination, debounced, so partial
  // text ("gun") matches full names ("Guntur") as the user types,
  // instead of only on a manual Search button press.
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (source.trim().length === 0 && destination.trim().length === 0) {
      setRides([]);
      setSearched(false);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      runSearch(source, destination);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [source, destination]);

  useEffect(() => {
    loadUserGender();
  }, []);

  const loadUserGender = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("gender")
      .eq("id", user.id)
      .single();

    if (error) {
      console.log("GENDER LOAD ERROR:", error);
      return;
    }

    setIsFemale(data?.gender === "female");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search Ride</Text>
      <Text style={styles.subtitle}>Find a ride that matches your route</Text>

      <View style={styles.form}>
        <View style={styles.inputRow}>
          <Ionicons
            name="ellipse-outline"
            size={18}
            color={colors.primary}
            style={styles.inputIcon}
          />
          <TextInput
            placeholder="Source"
            placeholderTextColor={colors.textMuted}
            value={source}
            onChangeText={setSource}
            style={styles.input}
          />
          {loading && <ActivityIndicator size="small" color={colors.primary} />}
        </View>

        <View style={styles.inputRow}>
          <Ionicons
            name="location-outline"
            size={18}
            color={colors.danger}
            style={styles.inputIcon}
          />
          <TextInput
            placeholder="Destination"
            placeholderTextColor={colors.textMuted}
            value={destination}
            onChangeText={setDestination}
            style={styles.input}
          />
        </View>
      </View>

      {isFemale && (
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Ride preference</Text>

          <View style={styles.filterRow}>
            <Pressable
              style={[
                styles.filterChip,
                !womenOnlyFilter && styles.filterChipActive,
              ]}
              onPress={() => setWomenOnlyFilter(false)}
            >
              <Ionicons
                name="car-outline"
                size={16}
                color={!womenOnlyFilter ? colors.primary : colors.textSecondary}
              />

              <Text
                style={[
                  styles.filterChipText,
                  !womenOnlyFilter && styles.filterChipTextActive,
                ]}
              >
                All rides
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterChip,
                womenOnlyFilter && styles.womenFilterChipActive,
              ]}
              onPress={() => setWomenOnlyFilter(true)}
            >
              <Ionicons
                name="shield-checkmark"
                size={16}
                color={womenOnlyFilter ? "#BE185D" : colors.textSecondary}
              />

              <Text
                style={[
                  styles.filterChipText,
                  womenOnlyFilter && styles.womenFilterTextActive,
                ]}
              >
                Women Only
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      <FlatList
        data={
          womenOnlyFilter
            ? rides.filter((ride) => ride.women_only === true)
            : rides
        }
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: spacing.md,
          paddingBottom: spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          searched && !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={28} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                No rides found for this route
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/rides/[id]",
                params: { id: item.id },
              })
            }
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
          >
            {item.women_only && (
              <View style={styles.womenBadge}>
                <Ionicons name="shield-checkmark" size={13} color="#BE185D" />

                <Text style={styles.womenBadgeText}>Women Only</Text>
              </View>
            )}

            <View style={styles.cardHeader}>
              <Text style={styles.route} numberOfLines={1}>
                {item.source} → {item.destination}
              </Text>

              <Text style={styles.price}>₹{item.price}</Text>
            </View>

            <View style={styles.cardMetaRow}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={colors.textSecondary}
                />

                <Text style={styles.metaText}>{item.ride_date}</Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={colors.textSecondary}
                />

                <Text style={styles.metaText}>{item.ride_time}</Text>
              </View>

              <View style={styles.metaItem}>
                <Ionicons
                  name="people-outline"
                  size={14}
                  color={colors.textSecondary}
                />

                <Text style={styles.metaText}>
                  {item.currentAvailableSeats} seats
                </Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.subtitle,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  route: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  cardMetaRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.sm,
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
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 14,
  },
  womenBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FCE7F3",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
  },

  womenBadgeText: {
    color: "#BE185D",
    fontSize: 11,
    fontWeight: "700",
  },

  filterSection: {
    marginTop: spacing.md,
  },

  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  filterChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },

  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  filterChipTextActive: {
    color: colors.primary,
  },

  womenFilterChipActive: {
    backgroundColor: "#FDF2F8",
    borderColor: "#BE185D",
  },

  womenFilterTextActive: {
    color: "#BE185D",
  },
});
