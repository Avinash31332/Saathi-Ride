import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";

import { colors, radius, shadow } from "../../constants/theme";

export default function AppCard({ style, children, ...props }: ViewProps) {
  return (
    <View {...props} style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,

    borderRadius: radius.lg,

    ...shadow.md,
  },
});
