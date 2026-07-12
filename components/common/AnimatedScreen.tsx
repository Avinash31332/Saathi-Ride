import { useEffect, useRef } from "react";
import { Animated } from "react-native";

export default function AnimatedScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fade,
        transform: [{ translateY: slide }],
      }}
    >
      {children}
    </Animated.View>
  );
}
