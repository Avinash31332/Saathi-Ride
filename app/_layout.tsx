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
        screenOptions={{
          headerShown: false,
          animation: "fade_from_bottom",
          animationDuration: 300,
        }}
      >
        <Stack.Screen name="signup" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="complete-profile"
          options={{
            headerShown: false,
          }}
        />
      </Stack>

      <GlobalBottomSheet />

      <StatusBar style="auto" />
    </GlobalEventProvider>
  );
}
