import React from "react";
import { Pressable } from "react-native";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PressableCard({ children, style, onPress }: any) {
  const scale = useSharedValue(1);

  const animated = useAnimatedStyle(() => ({
    transform: [
      {
        scale: scale.value,
      },
    ],
  }));

  return (
    <AnimatedPressable
      style={[animated, style]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
