import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import AnimatedScreen from "../../components/common/AnimatedScreen";
import DriverView from "../../components/profile/DriverView";
import PassengerView from "../../components/profile/PassengerView";
import ProfileHeader from "../../components/profile/ProfileHeader";
import SegmentedPill from "../../components/profile/SegmentedPill";

import { colors, spacing } from "../../constants/theme";

import EditProfileModal from "@/components/profile/EditProfileModal";
import ProfileQuickStats from "@/components/profile/ProfileQuickStats";
import {
  getMyProfile,
  pickAndUploadProfileImage,
} from "../../services/profile.service";

type Mode = "driver" | "passenger";

export default function ProfileV2() {
  const [profile, setProfile] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [mode, setMode] = useState<Mode>("driver");
  const [editVisible, setEditVisible] = useState(false);

  const [uploadingImage, setUploadingImage] = useState(false);

  const fade = useState(new Animated.Value(1))[0];

  const load = useCallback(async () => {
    const { data } = await getMyProfile();

    setProfile(data);

    setLoading(false);

    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, []);

  const switchMode = (value: Mode) => {
    Animated.sequence([
      Animated.timing(fade, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),

      Animated.timing(fade, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    setMode(value);
  };

  const changeProfileImage = async () => {
    setUploadingImage(true);

    const { data, error } = await pickAndUploadProfileImage();

    setUploadingImage(false);

    if (error) {
      Alert.alert("Unable to update photo", error.message);

      return;
    }

    if (data) {
      setProfile(data);
    }
  };

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );

  return (
    <AnimatedScreen>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);

              load();
            }}
          />
        }
      >
        <ProfileHeader
          profile={profile}
          uploading={uploadingImage}
          onEditImage={changeProfileImage}
          onEditProfile={() => setEditVisible(true)}
        />{" "}
        <ProfileQuickStats profile={profile} />
        <SegmentedPill value={mode} onChange={switchMode} />
        <Animated.View
          style={{
            opacity: fade,
          }}
        >
          {mode === "driver" ? (
            <DriverView profile={profile} />
          ) : (
            <PassengerView profile={profile} />
          )}
        </Animated.View>
        <View
          style={{
            height: spacing.xl,
          }}
        />
      </ScrollView>
      <EditProfileModal
        visible={editVisible}
        profile={profile}
        onClose={() => setEditVisible(false)}
        onUpdated={(updatedProfile) => {
          setProfile(updatedProfile);
        }}
      />
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    flexGrow: 1,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
  },
});
