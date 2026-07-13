import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Animated,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { colors, radius, spacing } from "../../constants/theme";
import { searchPlaces } from "../../services/maps/osm.service";

export interface SelectedPlace {
  id: string | number;
  name: string;
  latitude: number;
  longitude: number;
}

interface Props {
  placeholder: string;

  onPlaceSelected(place: SelectedPlace): void;

  onPlaceCleared?: () => void;
}

const ANDROID_DROPDOWN_ELEVATION = 100;

const MAX_VISIBLE_RESULTS = 8;

const SEARCH_DELAY_MS = 350;

export default function PlaceSearch({
  placeholder,
  onPlaceSelected,
  onPlaceCleared,
}: Props) {
  const [query, setQuery] = useState("");

  const [results, setResults] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  const [searched, setSearched] = useState(false);

  const [focused, setFocused] = useState(false);

  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(
    null,
  );

  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const requestIdRef = useRef(0);

  const isDropdownOpen =
    focused &&
    !selectedPlace &&
    query.trim().length >= 2 &&
    (results.length > 0 || searched);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (selectedPlace) {
      return;
    }

    if (trimmedQuery.length < 2) {
      requestIdRef.current += 1;

      setResults([]);
      setSearched(false);
      setLoading(false);

      return;
    }

    const timer = setTimeout(async () => {
      const requestId = ++requestIdRef.current;

      try {
        setLoading(true);

        const places = await searchPlaces(trimmedQuery);

        if (requestId !== requestIdRef.current) {
          return;
        }

        const validPlaces = (places || []).filter(
          (place: any) =>
            place &&
            (typeof place.id === "string" || typeof place.id === "number") &&
            typeof place.name === "string" &&
            place.name.trim().length > 0 &&
            typeof place.latitude === "number" &&
            Number.isFinite(place.latitude) &&
            typeof place.longitude === "number" &&
            Number.isFinite(place.longitude),
        );

        setResults(validPlaces);
        setSearched(true);
      } catch (error) {
        console.log("PLACE SEARCH ERROR:", error);

        if (requestId === requestIdRef.current) {
          setResults([]);
          setSearched(true);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, SEARCH_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [query, selectedPlace]);

  useEffect(() => {
    Animated.timing(dropdownAnim, {
      toValue: isDropdownOpen ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isDropdownOpen, dropdownAnim]);

  const closeDropdown = () => {
    setFocused(false);

    Keyboard.dismiss();
  };

  const handleQueryChange = (value: string) => {
    if (selectedPlace) {
      setSelectedPlace(null);

      onPlaceCleared?.();
    }

    setQuery(value);

    setSearched(false);
  };

  const handleSelect = (item: any) => {
    const place: SelectedPlace = {
      id: item.id,

      name: item.name,

      latitude: Number(item.latitude),

      longitude: Number(item.longitude),
    };

    requestIdRef.current += 1;

    Keyboard.dismiss();

    setSelectedPlace(place);

    setQuery(place.name);

    setResults([]);

    setSearched(false);

    setLoading(false);

    setFocused(false);

    console.log("========== PLACE SELECTED ==========");

    console.log(JSON.stringify(place, null, 2));

    onPlaceSelected(place);
  };

  const handleClear = () => {
    requestIdRef.current += 1;

    setQuery("");

    setSelectedPlace(null);

    setResults([]);

    setSearched(false);

    setLoading(false);

    setFocused(false);

    onPlaceCleared?.();

    Keyboard.dismiss();
  };

  return (
    <View
      style={{
        zIndex: 100,
        elevation: ANDROID_DROPDOWN_ELEVATION,
      }}
    >
      <View
        style={[
          styles.searchBox,

          focused && styles.searchBoxFocused,

          selectedPlace && styles.searchBoxSelected,
        ]}
      >
        <Ionicons
          name={selectedPlace ? "checkmark-circle" : "location-outline"}
          size={19}
          color={selectedPlace ? colors.success : colors.primary}
          style={styles.searchIcon}
        />

        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={handleQueryChange}
          onFocus={() => {
            setFocused(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setFocused(false);
            }, 180);
          }}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
        />

        {loading && <ActivityIndicator size="small" color={colors.primary} />}

        {!loading && query.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={10}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
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
            <View>
              {results.slice(0, MAX_VISIBLE_RESULTS).map((item) => {
                const parts = item.name.split(",");

                const title = parts[0]?.trim();

                const subtitle = parts.slice(1).join(",").trim();

                return (
                  <TouchableOpacity
                    key={String(item.id)}
                    onPress={() => handleSelect(item)}
                    style={styles.resultRow}
                    activeOpacity={0.65}
                  >
                    <View style={styles.resultIcon}>
                      <Ionicons
                        name="location"
                        size={16}
                        color={colors.primary}
                      />
                    </View>

                    <View style={styles.resultContent}>
                      <Text numberOfLines={1} style={styles.resultTitle}>
                        {title}
                      </Text>

                      {!!subtitle && (
                        <Text numberOfLines={2} style={styles.resultSubtitle}>
                          {subtitle}
                        </Text>
                      )}
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textMuted}
                    />
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

  searchBoxFocused: {
    borderColor: colors.primary,
  },

  searchBoxSelected: {
    borderColor: colors.success,
  },

  searchIcon: {
    marginRight: spacing.sm,
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

    shadowOffset: {
      width: 0,
      height: 6,
    },

    maxHeight: 360,

    zIndex: 9999,

    overflow: "hidden",
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

    alignItems: "center",

    paddingHorizontal: spacing.md,

    paddingVertical: 13,

    borderBottomWidth: 0.5,

    borderColor: colors.border,
  },

  resultIcon: {
    width: 34,

    height: 34,

    borderRadius: radius.sm,

    backgroundColor: colors.primaryLight,

    alignItems: "center",

    justifyContent: "center",
  },

  resultContent: {
    flex: 1,

    marginLeft: spacing.sm,

    marginRight: spacing.sm,
  },

  resultTitle: {
    fontSize: 15,

    fontWeight: "600",

    color: colors.textPrimary,
  },

  resultSubtitle: {
    color: colors.textSecondary,

    marginTop: 2,

    fontSize: 12,

    lineHeight: 17,
  },
});
