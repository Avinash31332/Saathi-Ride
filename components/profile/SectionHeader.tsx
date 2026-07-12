import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "../../constants/theme";

export default function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },

  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
});
