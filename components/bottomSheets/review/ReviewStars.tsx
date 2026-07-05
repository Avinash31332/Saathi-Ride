import React, { useRef } from "react";
import { View, Pressable, Animated, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../constants/theme";

interface Props {
  rating: number;
  onChange: (rating: number) => void;
}

export default function ReviewStars({ rating, onChange }: Props) {
  const scales = useRef(
    [1, 2, 3, 4, 5].map(() => new Animated.Value(1)),
  ).current;

  const handlePress = (value: number, index: number) => {
    Animated.sequence([
      Animated.timing(scales[index], {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scales[index], {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
    onChange(value);
  };

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((value, index) => (
        <Pressable
          key={value}
          onPress={() => handlePress(value, index)}
          style={styles.starButton}
        >
          <Animated.View style={{ transform: [{ scale: scales[index] }] }}>
            <Ionicons
              name={value <= rating ? "star" : "star-outline"}
              size={38}
              color={value <= rating ? colors.warning : colors.border}
            />
          </Animated.View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 20,
  },
  starButton: { marginHorizontal: 6 },
});
