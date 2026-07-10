import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  View,
  Text,
  TextInput,
  ActivityIndicator,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAvailableSeats } from "../../services/seat.service";
import { searchRides } from "../../services/ride.service";
import { router } from "expo-router";
import { colors, spacing, radius, typography } from "../../constants/theme";

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

      <FlatList
        data={rides}
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
});
