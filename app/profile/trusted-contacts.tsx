import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  TrustedContact,
  addTrustedContact,
  deleteTrustedContact,
  getTrustedContacts,
} from "../../services/trusted-contact.service";

import {
  colors,
  radius,
  shadow,
  spacing,
  typography,
} from "../../constants/theme";

export default function TrustedContactsScreen() {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");

  const loadContacts = async () => {
    const { data, error } = await getTrustedContacts();

    if (error) {
      Alert.alert("Error", error.message);
    }

    setContacts(data || []);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadContacts();
    }, []),
  );

  const openAddContact = () => {
    if (contacts.length >= 3) {
      Alert.alert(
        "Contact limit reached",
        "You can add a maximum of 3 trusted contacts.",
      );

      return;
    }

    setName("");
    setPhone("");
    setRelationship("");
    setModalVisible(true);
  };

  const saveContact = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert(
        "Missing information",
        "Contact name and phone number are required.",
      );

      return;
    }

    setSaving(true);

    const { error } = await addTrustedContact({
      name,
      phone,
      relationship,
    });

    setSaving(false);

    if (error) {
      Alert.alert("Unable to add contact", error.message);
      return;
    }

    setModalVisible(false);

    await loadContacts();
  };

  const removeContact = (contact: TrustedContact) => {
    Alert.alert(
      "Remove trusted contact?",
      `${contact.name} will no longer receive your ride safety alerts.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const { error } = await deleteTrustedContact(contact.id);

            if (error) {
              Alert.alert("Unable to remove contact", error.message);
              return;
            }

            await loadContacts();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.title}>Trusted contacts</Text>

            <Text style={styles.subtitle}>
              Safety alerts can be shared with up to 3 people
            </Text>
          </View>
        </View>

        <View style={styles.safetyCard}>
          <View style={styles.safetyIcon}>
            <Ionicons
              name="shield-checkmark"
              size={24}
              color={colors.primary}
            />
          </View>

          <View style={styles.safetyContent}>
            <Text style={styles.safetyTitle}>Saathi Safety Mode</Text>

            <Text style={styles.safetyText}>
              During safety-enabled rides, your trusted contacts can receive
              ride progress, route deviation and SOS alerts.
            </Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Your contacts</Text>

          <Text style={styles.counter}>{contacts.length}/3</Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loader}
          />
        ) : contacts.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Feather name="users" size={28} color={colors.primary} />
            </View>

            <Text style={styles.emptyTitle}>No trusted contacts yet</Text>

            <Text style={styles.emptyText}>
              Add someone you trust so safety alerts can be shared during your
              ride.
            </Text>
          </View>
        ) : (
          contacts.map((contact) => (
            <View key={contact.id} style={styles.contactCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {contact.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.contactContent}>
                <Text style={styles.contactName}>{contact.name}</Text>

                <Text style={styles.contactPhone}>{contact.phone}</Text>

                {!!contact.relationship && (
                  <Text style={styles.relationship}>
                    {contact.relationship}
                  </Text>
                )}
              </View>

              <Pressable
                style={styles.deleteButton}
                onPress={() => removeContact(contact)}
              >
                <Feather name="trash-2" size={18} color={colors.danger} />
              </Pressable>
            </View>
          ))
        )}

        <Pressable
          style={[
            styles.addButton,
            contacts.length >= 3 && styles.addButtonDisabled,
          ]}
          onPress={openAddContact}
        >
          <Feather name="plus" size={19} color="#FFFFFF" />

          <Text style={styles.addButtonText}>Add trusted contact</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add trusted contact</Text>

              <Pressable onPress={() => setModalVisible(false)}>
                <Feather name="x" size={23} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.label}>Name</Text>

            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Mother"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Phone number</Text>

            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 98765 43210"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Relationship</Text>

            <TextInput
              style={styles.input}
              value={relationship}
              onChangeText={setRelationship}
              placeholder="e.g. Parent, sibling, friend"
              placeholderTextColor={colors.textMuted}
            />

            <Pressable
              style={[styles.saveButton, saving && styles.savingButton]}
              onPress={saveContact}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save contact</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.title,
    fontSize: 22,
  },
  subtitle: {
    ...typography.subtitle,
    fontSize: 13,
    marginTop: 2,
  },
  safetyCard: {
    flexDirection: "row",
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  safetyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  safetyContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  safetyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  safetyText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  counter: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  loader: {
    marginTop: 50,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  contactContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  contactName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  contactPhone: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  relationship: {
    color: colors.primary,
    fontSize: 12,
    marginTop: 3,
  },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  addButtonDisabled: {
    opacity: 0.55,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: 35,
  },
  modalHandle: {
    width: 44,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  label: {
    ...typography.label,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceMuted,
  },
  saveButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  savingButton: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
