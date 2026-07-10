import { View, Button } from "react-native";

import { useEventService } from "../../services/event.service";

export default function DebugEventsScreen() {
  const { showRideCompleted, showPassengerDropRequest, showPayment, showSOS } =
    useEventService();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        gap: 20,
        padding: 20,
      }}
    >
      <Button
        title="Ride Completed"
        onPress={() => {
          showRideCompleted(
            {
              rideId: "ride1",
              reviewerId: "user1",
              driverId: "driver1",
            },
            false,
          );

          showPayment({
            amount: 200,
          });

          showSOS({
            location: "Hyderabad",
          });
        }}
      />

      <Button
        title="Passenger Drop"
        onPress={() =>
          showPassengerDropRequest({
            bookingId: "booking1",
            rideId: "ride1",
            source: "A",
            destination: "B",
          })
        }
      />

      <Button
        title="Payment"
        onPress={() =>
          showPayment({
            amount: 120,
          })
        }
      />

      <Button
        title="SOS"
        onPress={() =>
          showSOS({
            location: "Hyderabad",
          })
        }
      />
    </View>
  );
}
