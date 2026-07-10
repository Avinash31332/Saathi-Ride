import useGlobalEvents from "../hooks/useGlobalEvents";

export function useEventService() {
  const { publish } = useGlobalEvents();

  return {
    //------------------------------------------------
    // Ride Completion
    //------------------------------------------------

    showRideCompletion(payload: any) {
      publish(
        "rideCompletion",
        payload,
        `rideCompletion-${payload.bookingId}`,
      );
    },

    showRideCompleted(payload: any, isDriver: boolean) {
      publish(
        "rideCompleted",
        {
          ...payload,
          isDriver,
        },
        `rideCompleted-${payload.rideId}-${payload.reviewerId}`,
      );
    },

    //------------------------------------------------
    // Passenger Drop
    //------------------------------------------------

    showPassengerDropRequest(payload: any) {
      publish(
        "passengerDropRequest",
        payload,
        `dropRequest-${payload.bookingId}`,
      );
    },

    showPassengerDropReason(payload: any) {
      publish(
        "passengerDropReason",
        payload,
        `dropReason-${payload.bookingId}`,
      );
    },

    //------------------------------------------------
    // Payment
    //------------------------------------------------

    showPayment(payload: any) {
      publish(
        "payment",
        payload,
        `payment-${payload.paymentId ?? Date.now()}`,
      );
    },

    //------------------------------------------------
    // Verification
    //------------------------------------------------

    showVerification(payload: any) {
      publish(
        "verification",
        payload,
        `verification-${payload.userId ?? Date.now()}`,
      );
    },

    //------------------------------------------------
    // Ride Cancelled
    //------------------------------------------------

    showRideCancelled(payload: any) {
      publish(
        "rideCancelled",
        payload,
        `rideCancelled-${payload.rideId}`,
      );
    },

    //------------------------------------------------
    // SOS
    //------------------------------------------------

    showSOS(payload: any) {
      publish(
        "sos",
        payload,
        `sos-${Date.now()}`,
      );
    },
  };
}