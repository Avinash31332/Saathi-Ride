import React from "react";
import { Modal, View, StyleSheet } from "react-native";

import useGlobalEvents from "../hooks/useGlobalEvents";

import {
  RideCompletionSheet,
  RideCompletedSheet,
  RideCancelledSheet,
  PaymentSheet,
  VerificationSheet,
  SOSSheet,
} from "./bottomSheets";

export default function GlobalBottomSheet() {
  const { event, setEvent } = useGlobalEvents();

  if (!event) return null;

  const close = () => {
    if (event.dismissible === false) return;

    setEvent(null);
  };

  const renderSheet = () => {
    switch (event.type) {
      case "rideCompletion":
        return <RideCompletionSheet payload={event.payload} onClose={close} />;

      case "rideCompleted":
        return <RideCompletedSheet payload={event.payload} onClose={close} />;

      case "rideCancelled":
        return <RideCancelledSheet payload={event.payload} onClose={close} />;

      case "payment":
        return <PaymentSheet payload={event.payload} onClose={close} />;

      case "verification":
        return <VerificationSheet payload={event.payload} onClose={close} />;

      case "sos":
        return <SOSSheet payload={event.payload} onClose={close} />;

      default:
        return null;
    }
  };

  return (
    <Modal transparent animationType="slide" visible>
      <View style={styles.overlay}>
        <View style={styles.sheet}>{renderSheet()}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    minHeight: 340,
    padding: 25,
  },
});
