import { useRef } from "react";
import { Animated, Pressable } from "react-native";

interface Props {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
}

export default function AnimatedCard({ children, style, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 35,
      bounciness: 5,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 35,
      bounciness: 5,
    }).start();
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale }],
        },
        style,
      ]}
    >
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
