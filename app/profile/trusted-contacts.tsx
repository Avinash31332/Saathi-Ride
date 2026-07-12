import { Feather, Ionicons } from "@expo/vector-icons";

import { router, useFocusEffect } from "expo-router";

import { useCallback, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import AnimatedCard from "../../components/common/AnimatedCard";
import AnimatedScreen from "../../components/common/AnimatedScreen";

import {
  TrustedContact,
  addTrustedContact,
  deleteTrustedContact,
  getTrustedContacts,
  updateTrustedContact,
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

  const [refreshing, setRefreshing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const [editingContact, setEditingContact] = useState<TrustedContact | null>(
    null,
  );

  const [name, setName] = useState("");

  const [phone, setPhone] = useState("");

  const [relationship, setRelationship] = useState("");

  const sheetSlide = useRef(new Animated.Value(650)).current;

  const loadContacts = async () => {
    const { data, error } = await getTrustedContacts();

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setContacts(data || []);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadContacts();
    }, []),
  );

  const animateSheetOpen = () => {
    sheetSlide.setValue(650);

    setModalVisible(true);

    requestAnimationFrame(() => {
      Animated.spring(sheetSlide, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 5,
      }).start();
    });
  };

  const closeModal = () => {
    Animated.timing(sheetSlide, {
      toValue: 650,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setEditingContact(null);
    });
  };

  const openAddContact = () => {
    if (contacts.length >= 3) {
      Alert.alert(
        "Contact limit reached",
        "You can add a maximum of 3 trusted contacts.",
      );

      return;
    }

    setEditingContact(null);

    setName("");

    setPhone("");

    setRelationship("");

    animateSheetOpen();
  };

  const openEditContact = (contact: TrustedContact) => {
    setEditingContact(contact);

    setName(contact.name);

    setPhone(contact.phone);

    setRelationship(contact.relationship || "");

    animateSheetOpen();
  };

  const saveContact = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Enter the contact name.");

      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      Alert.alert("Invalid phone", "Enter a valid 10 digit phone number.");

      return;
    }

    setSaving(true);

    const result = editingContact
      ? await updateTrustedContact(editingContact.id, {
          name,
          phone: cleanPhone,
          relationship,
        })
      : await addTrustedContact({
          name,
          phone: cleanPhone,
          relationship,
        });

    setSaving(false);

    if (result.error) {
      Alert.alert(
        editingContact ? "Unable to update contact" : "Unable to add contact",
        result.error.message,
      );

      return;
    }

    closeModal();

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

            setContacts((current) =>
              current.filter((item) => item.id !== contact.id),
            );
          },
        },
      ],
    );
  };

  return (
    <AnimatedScreen>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);

                loadContacts();
              }}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.headerRow}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,

                pressed && styles.pressedButton,
              ]}
              onPress={() => router.back()}
            >
              <Feather name="arrow-left" size={22} color={colors.textPrimary} />
            </Pressable>

            <View style={styles.headerText}>
              <Text style={styles.title}>Trusted contacts</Text>

              <Text style={styles.subtitle}>Your personal safety circle</Text>
            </View>
          </View>

          <View style={styles.safetyCard}>
            <View style={styles.safetyIcon}>
              <Ionicons name="shield-checkmark" size={25} color="#BE185D" />
            </View>

            <View style={styles.safetyContent}>
              <Text style={styles.safetyTitle}>Saathi Safety Mode</Text>

              <Text style={styles.safetyText}>
                During a safety-enabled journey, checkpoint progress, route
                alerts, destination arrival and SOS events can be shared with
                your trusted contacts.
              </Text>
            </View>
          </View>

          <View style={styles.sectionRow}>
            <View>
              <Text style={styles.sectionTitle}>Your contacts</Text>

              <Text style={styles.sectionSubtitle}>
                Add up to 3 people you trust
              </Text>
            </View>

            <View style={styles.counterBadge}>
              <Text style={styles.counter}>{contacts.length}/3</Text>
            </View>
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
                <Feather name="users" size={29} color={colors.primary} />
              </View>

              <Text style={styles.emptyTitle}>Build your safety circle</Text>

              <Text style={styles.emptyText}>
                Add someone you trust so important journey and emergency alerts
                can be shared when Safety Mode is active.
              </Text>
            </View>
          ) : (
            contacts.map((contact) => (
              <AnimatedCard
                key={contact.id}
                style={styles.contactCard}
                onPress={() => openEditContact(contact)}
              >
                <View style={styles.contactRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {contact.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.contactContent}>
                    <Text style={styles.contactName}>{contact.name}</Text>

                    {!!contact.relationship && (
                      <Text style={styles.relationship}>
                        {contact.relationship}
                      </Text>
                    )}

                    <View style={styles.phoneRow}>
                      <Ionicons
                        name="call-outline"
                        size={13}
                        color={colors.textMuted}
                      />

                      <Text style={styles.contactPhone}>
                        +91 {contact.phone}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.editButton,

                        pressed && styles.pressedButton,
                      ]}
                      onPress={() => openEditContact(contact)}
                    >
                      <Feather name="edit-2" size={17} color={colors.primary} />
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.deleteButton,

                        pressed && styles.pressedButton,
                      ]}
                      onPress={() => removeContact(contact)}
                    >
                      <Feather name="trash-2" size={17} color={colors.danger} />
                    </Pressable>
                  </View>
                </View>
              </AnimatedCard>
            ))
          )}

          <Pressable
            style={({ pressed }) => [
              styles.addButton,

              contacts.length >= 3 && styles.addButtonDisabled,

              pressed && contacts.length < 3 && styles.addButtonPressed,
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
          animationType="fade"
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />

            <Animated.View
              style={[
                styles.modalSheet,

                {
                  transform: [
                    {
                      translateY: sheetSlide,
                    },
                  ],
                },
              ]}
            >
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {editingContact
                      ? "Edit trusted contact"
                      : "Add trusted contact"}
                  </Text>

                  <Text style={styles.modalSubtitle}>
                    {editingContact
                      ? "Update contact information"
                      : "Add someone to your safety circle"}
                  </Text>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.closeButton,

                    pressed && styles.pressedButton,
                  ]}
                  onPress={closeModal}
                >
                  <Feather name="x" size={21} color={colors.textSecondary} />
                </Pressable>
              </View>

              <Text style={styles.label}>Name</Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={19}
                  color={colors.textMuted}
                />

                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Contact name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <Text style={styles.label}>Phone number</Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="call-outline"
                  size={19}
                  color={colors.textMuted}
                />

                <Text style={styles.prefix}>+91</Text>

                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholder="10 digit mobile number"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <Text style={styles.label}>Relationship</Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="people-outline"
                  size={19}
                  color={colors.textMuted}
                />

                <TextInput
                  style={styles.input}
                  value={relationship}
                  onChangeText={setRelationship}
                  placeholder="Mother, brother, friend..."
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,

                  saving && styles.savingButton,

                  pressed && !saving && styles.addButtonPressed,
                ]}
                onPress={saveContact}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.saveButtonText}>
                      {editingContact ? "Save changes" : "Add contact"}
                    </Text>

                    <Ionicons
                      name={editingContact ? "checkmark" : "shield-checkmark"}
                      size={19}
                      color="#FFFFFF"
                    />
                  </>
                )}
              </Pressable>
            </Animated.View>
          </View>
        </Modal>
      </View>
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },

  content: {
    padding: spacing.md,
    paddingTop: spacing.xl,
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

  pressedButton: {
    transform: [{ scale: 0.92 }],
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
    backgroundColor: "#FDF2F8",
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#FBCFE8",
  },

  safetyIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FCE7F3",
    alignItems: "center",
    justifyContent: "center",
  },

  safetyContent: {
    flex: 1,
    marginLeft: spacing.md,
  },

  safetyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#BE185D",
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
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },

  counterBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },

  counter: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 12,
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
    ...shadow.card,
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: spacing.md,
  },

  emptyText: {
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginTop: spacing.sm,
    fontSize: 13,
  },

  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: "800",
  },

  contactContent: {
    flex: 1,
    marginLeft: spacing.md,
  },

  contactName: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary,
  },

  relationship: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },

  contactPhone: {
    color: colors.textMuted,
    fontSize: 12,
  },

  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  editButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
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
    opacity: 0.5,
  },

  addButtonPressed: {
    transform: [{ scale: 0.97 }],
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingBottom: 35,
  },

  modalHandle: {
    width: 44,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginTop: spacing.sm,
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

  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    ...typography.label,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  inputContainer: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceMuted,
  },

  input: {
    flex: 1,
    paddingVertical: 13,
    marginLeft: spacing.sm,
    color: colors.textPrimary,
    fontSize: 15,
  },

  prefix: {
    marginLeft: spacing.sm,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  saveButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.xl,
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
