import { Button, Text } from "react-native";

export default function VerificationSheet({ payload, onClose }: any) {
  return (
    <>
      <Text
        style={{
          fontSize: 26,
          fontWeight: "bold",
        }}
      >
        Verification
      </Text>

      <Text
        style={{
          marginVertical: 20,
        }}
      >
        {payload?.message}
      </Text>

      <Button title="Continue" onPress={onClose} />
    </>
  );
}
