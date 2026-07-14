import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";

import { colors, shadow } from "../../constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarShowLabel: true,

        tabBarActiveTintColor: colors.primary,

        tabBarInactiveTintColor: colors.textMuted,

        tabBarStyle: {
          height: 72,

          paddingTop: 8,

          paddingBottom: 10,

          backgroundColor: colors.surface,

          borderTopWidth: 0,

          ...shadow.md,
        },

        tabBarLabelStyle: {
          fontSize: 12,

          fontWeight: "600",

          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="journey"
        options={{
          title: "Journey",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "navigate-circle" : "navigate-circle-outline"}
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* We'll replace this with a floating FAB later */}
      <Tabs.Screen
        name="create"
        options={{
          title: "",

          tabBarIcon: () => (
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.primary,
                justifyContent: "center",
                alignItems: "center",
                marginTop: -10,

                shadowColor: colors.primary,
                shadowOpacity: 0.35,
                shadowRadius: 12,
                shadowOffset: {
                  width: 0,
                  height: 6,
                },
                elevation: 10,
              }}
            >
              <Ionicons name="add" size={34} color={colors.surface} />
            </View>
          ),

          tabBarLabel: () => null,
        }}
      />

      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="Profile"
        options={{
          title: "Profile",

          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
