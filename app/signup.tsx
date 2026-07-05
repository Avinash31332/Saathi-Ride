import { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";

import { signUp } from "../services/auth";
import { router } from "expo-router";

export default function HomeScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    const { error } = await signUp(email, password);

    if (error) {
      Alert.alert(error.message);
      return;
    }

    Alert.alert("Welcome to RideShare 🚗");
    router.replace("/(tabs)");
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#fff",
      }}
    >
      <Text
        style={{
          fontSize: 28,
          marginBottom: 20,
          fontWeight: "bold",
        }}
      >
        RideShare 🚗
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{
          borderWidth: 1,
          marginBottom: 12,
          padding: 12,
        }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{
          borderWidth: 1,
          marginBottom: 20,
          padding: 12,
        }}
      />

      <Button title="Create Account" onPress={handleSignup} />
    </View>
  );
}
