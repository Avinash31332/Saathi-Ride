import { Button, Text } from "react-native";

export default function PaymentSheet({ payload, onClose }: any) {
  return (
    <>
      <Text
        style={{
          fontSize: 26,
          fontWeight: "bold",
        }}
      >
        Payment
      </Text>

      <Text
        style={{
          marginVertical: 20,
        }}
      >
        ₹{payload?.amount}
      </Text>

      <Button title="OK" onPress={onClose} />
    </>
  );
}
