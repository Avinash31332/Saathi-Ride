import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Keyboard,
  Animated,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { searchPlaces } from "../../services/maps/osm.service";
import { colors, spacing, radius } from "../../constants/theme";

interface Props {
  placeholder: string;
  onPlaceSelected(place: {
    id: string | number;
    name: string;
    latitude: number;
    longitude: number;
  }): void;
}

// Android needs an elevation value to paint the dropdown above sibling views.
const ANDROID_DROPDOWN_ELEVATION = 100;

// Dropdown never shows more than this many results — no need for a
// virtualized list, which is what was causing the
// "VirtualizedLists should never be nested inside plain ScrollViews"
// warning when PlaceSearch was used inside the create-ride ScrollView.
const MAX_VISIBLE_RESULTS = 8;

export default function PlaceSearch({ placeholder, onPlaceSelected }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [focused, setFocused] = useState(false);

  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const isDropdownOpen =
    focused && (results.length > 0 || (searched && query.length >= 2));

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const places = await searchPlaces(query);

        // Defensive: only keep results that actually have a usable
        // string name + numeric coordinates. This is what stops a
        // malformed place object (or the raw JSON) from ever reaching
        // onPlaceSelected -> create-ride.tsx -> the rides table.
        const validPlaces = (places || []).filter(
          (p: any) =>
            p &&
            typeof p.name === "string" &&
            p.name.trim().length > 0 &&
            typeof p.latitude === "number" &&
            typeof p.longitude === "number",
        );

        setResults(validPlaces);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    Animated.timing(dropdownAnim, {
      toValue: isDropdownOpen ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isDropdownOpen]);

  const closeDropdown = () => {
    setFocused(false);
    Keyboard.dismiss();
  };

  const handleSelect = (item: any) => {
    Keyboard.dismiss();

    setQuery(item.name);
    setResults([]);
    setSearched(false);
    setFocused(false);

    onPlaceSelected({
      id: item.id,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
    });
  };

  return (
    <View style={{ zIndex: 100, elevation: ANDROID_DROPDOWN_ELEVATION }}>
      <View style={styles.searchBox}>
        <Ionicons
          name="location-outline"
          size={19}
          color={colors.primary}
          style={{ marginRight: 8 }}
        />

        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            // Small delay so a tap on a result registers before we close.
            setTimeout(() => setFocused(false), 120);
          }}
          style={styles.input}
        />

        {loading && <ActivityIndicator size="small" color={colors.primary} />}

        {!loading && query.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setQuery("");
              setResults([]);
              setSearched(false);
              closeDropdown();
            }}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={19} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {isDropdownOpen && (
        <Animated.View
          pointerEvents={isDropdownOpen ? "auto" : "none"}
          style={[
            styles.dropdown,
            {
              opacity: dropdownAnim,
              transform: [
                {
                  translateY: dropdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-8, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {results.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={colors.textMuted}
              />
              <Text style={styles.emptyText}>No places found</Text>
            </View>
          ) : (
            // Plain View + map instead of FlatList: this is a bounded,
            // short dropdown list so it doesn't need virtualization, and
            // avoids nesting a VirtualizedList inside the parent
            // ScrollView in create-ride.tsx.
            <View>
              {results.slice(0, MAX_VISIBLE_RESULTS).map((item) => {
                const parts = item.name.split(",");

                return (
                  <TouchableOpacity
                    key={item.id.toString()}
                    onPress={() => handleSelect(item)}
                    style={styles.resultRow}
                    activeOpacity={0.6}
                  >
                    <Ionicons
                      name="pin-outline"
                      size={16}
                      color={colors.primary}
                      style={{ marginTop: 2 }}
                    />
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text numberOfLines={1} style={styles.resultTitle}>
                        {parts[0]}
                      </Text>
                      <Text numberOfLines={2} style={styles.resultSubtitle}>
                        {parts.slice(1).join(", ")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },
  dropdown: {
    position: "absolute",
    top: 58,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    maxHeight: 260,
    zIndex: 9999,
  },
  emptyState: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: spacing.lg,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  resultRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderColor: colors.border,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  resultSubtitle: {
    color: colors.textSecondary,
    marginTop: 2,
    fontSize: 13,
  },
});
