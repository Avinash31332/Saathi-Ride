import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import GlobalBottomSheet from "../components/GlobalBottomSheet";
import RealtimeListener from "../components/RealtimeListener";
import GlobalEventProvider from "../providers/GlobalEventProvider";

export default function RootLayout() {
  return (
    <GlobalEventProvider>
      <RealtimeListener />

      <Stack
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          animation: "fade_from_bottom",
          animationDuration: 300,
        }}
      >
        <Stack.Screen name="index" />

        <Stack.Screen name="signup" />

        <Stack.Screen name="login" />

        <Stack.Screen name="complete-profile" />

        <Stack.Screen name="(tabs)" />
      </Stack>

      <GlobalBottomSheet />

      <StatusBar style="auto" />
    </GlobalEventProvider>
  );
}
