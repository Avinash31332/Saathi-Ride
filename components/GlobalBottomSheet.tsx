import React from "react";
import { Modal, View, StyleSheet } from "react-native";

import useGlobalEvents from "../hooks/useGlobalEvents";
import { BottomSheetRegistry } from "./bottomSheets/registry";

export default function GlobalBottomSheet() {
  const { currentEvent, closeCurrentEvent } = useGlobalEvents();

  if (!currentEvent) return null;

  const Sheet = BottomSheetRegistry[currentEvent.type];

  if (!Sheet) return null;

  return (
    <Modal transparent animationType="slide" visible>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Sheet payload={currentEvent.payload} onClose={closeCurrentEvent} />
        </View>
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
