import React, { useRef } from "react";
import { Animated, Pressable, StyleProp, ViewStyle } from "react-native";

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export default function PressScale({
  children,
  onPress,
  style,
  disabled = false,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      speed: 45,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => animate(0.97)}
      onPressOut={() => animate(1)}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
