import { Button, Text } from "react-native";

export default function RideCancelledSheet({ onClose }: any) {
  return (
    <>
      <Text
        style={{
          fontSize: 26,
          fontWeight: "bold",
        }}
      >
        Ride Cancelled
      </Text>

      <Text style={{ marginVertical: 20 }}>This ride has been cancelled.</Text>

      <Button title="OK" onPress={onClose} />
    </>
  );
}
