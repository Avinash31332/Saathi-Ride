import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { router } from "expo-router";

import { supabase } from "../../services/supabase";
import { getMyVehicles, deleteVehicle } from "../../services/vehicle.service";
import {
  colors,
  spacing,
  radius,
  typography,
  shadow,
} from "../../constants/theme";

function CarCard({
  item,
  index,
  onDelete,
}: {
  item: any;
  index: number;
  onDelete: (id: string) => void;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity: fade, transform: [{ translateY: slide }] }}
    >
      <View style={styles.card}>
        <View style={styles.carIconBadge}>
          <Feather name="truck" size={20} color={colors.primary} />
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.carName}>{item.vehicle_name}</Text>
          <Text style={styles.carNumber}>{item.vehicle_number}</Text>
          <View style={styles.seatsRow}>
            <Feather name="users" size={13} color={colors.textMuted} />
            <Text style={styles.seatsText}>{item.total_seats} seats</Text>
          </View>
        </View>

        <Pressable
          style={styles.deleteButton}
          onPress={() => onDelete(item.id)}
          hitSlop={8}
        >
          <Feather name="trash-2" size={18} color={colors.danger} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function MyCarsScreen() {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const buttonScale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  const pressOut = () =>
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();

  useEffect(() => {
    loadCars();
  }, []);

  const loadCars = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await getMyVehicles(user.id);

    setCars(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await deleteVehicle(id);

    loadCars();
  };

  return (
    <View style={styles.flex}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>My Vehicles</Text>

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <Pressable
            style={styles.addButton}
            onPressIn={pressIn}
            onPressOut={pressOut}
            onPress={() => router.push("/profile/add-vehicle")}
          >
            <Feather name="plus" size={16} color={colors.surface} />
            <Text style={styles.addButtonText}>Add Vehicle</Text>
          </Pressable>
        </Animated.View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : cars.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconBadge}>
            <Feather name="truck" size={26} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No vehicles yet</Text>
          <Text style={styles.emptySubtitle}>
            Add a vehicle to start driving
          </Text>
        </View>
      ) : (
        <FlatList
          data={cars}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <CarCard item={item} index={index} onDelete={handleDelete} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surfaceMuted },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: { ...typography.title, fontSize: 22 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    ...shadow.card,
  },
  addButtonText: { color: colors.surface, fontSize: 13, fontWeight: "600" },
  listContent: { padding: spacing.md },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  carIconBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  cardContent: { flex: 1 },
  carName: { ...typography.body, fontWeight: "700" },
  carNumber: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  seatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  seatsText: { fontSize: 12, color: colors.textMuted },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerLight,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },
  emptyIconBadge: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    ...shadow.card,
  },
  emptyTitle: { ...typography.title, fontSize: 18, marginBottom: spacing.xs },
  emptySubtitle: { ...typography.subtitle, textAlign: "center" },
});
