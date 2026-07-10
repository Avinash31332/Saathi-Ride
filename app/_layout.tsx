import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import GlobalEventProvider from "../providers/GlobalEventProvider";
import GlobalBottomSheet from "../components/GlobalBottomSheet";
import RealtimeListener from "../components/RealtimeListener";

export default function RootLayout() {
  return (
    <GlobalEventProvider>
      <RealtimeListener />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade_from_bottom",
          animationDuration: 300,
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
      </Stack>

      <GlobalBottomSheet />

      <StatusBar style="auto" />
    </GlobalEventProvider>
  );
}
