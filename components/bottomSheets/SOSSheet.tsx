import { Button, Text } from "react-native";

export default function SOSSheet({ payload, onClose }: any) {
  return (
    <>
      <Text
        style={{
          fontSize: 28,
          color: "red",
          fontWeight: "bold",
        }}
      >
        🚨 SOS
      </Text>

      <Text
        style={{
          marginVertical: 20,
        }}
      >
        {payload?.message}
      </Text>

      <Button title="I Understand" onPress={onClose} />
    </>
  );
}
