import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/components/auth/AuthProvider";
import { Avatar } from "@/components/avatar";
import { useTheme } from "@/components/theme/ThemeProvider";
import { pickAndSaveAvatar, removeSavedAvatar } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

export default function ProfileScreen() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#ffffff" : "#0e0f0c";
  const placeholderColor = isDark ? "#5a5c59" : "#868685";

  const initialName = (
    (user?.user_metadata?.full_name as string | undefined) ?? ""
  ).trim();
  const initialAvatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ?? null;
  const email = user?.email ?? "";
  const userId = user?.id ?? "";

  const [fullName, setFullName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const trimmed = fullName.trim();
  const dirty = trimmed !== initialName;
  const canSave = trimmed.length > 0 && dirty && !saving;
  const avatarSource = trimmed || email;

  async function handleSave() {
    if (!canSave) return;
    setError(null);
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({
      data: { full_name: trimmed },
    });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.back();
  }

  async function handlePickAvatar() {
    if (!userId || uploadingAvatar) return;
    setAvatarError(null);
    setUploadingAvatar(true);
    try {
      const newUrl = await pickAndSaveAvatar(userId);
      if (newUrl) setAvatarUrl(newUrl);
    } catch (err) {
      setAvatarError(
        err instanceof Error ? err.message : "Couldn’t update photo."
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleRemoveAvatar() {
    if (!userId || uploadingAvatar) return;
    setAvatarError(null);
    setUploadingAvatar(true);
    try {
      await removeSavedAvatar(userId);
      setAvatarUrl(null);
    } catch (err) {
      setAvatarError(
        err instanceof Error ? err.message : "Couldn’t remove photo."
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-brand-black"
      edges={["bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-token-md active:bg-brand-black/5 dark:active:bg-white/5"
          >
            <Ionicons name="close" size={22} color={iconColor} />
          </Pressable>
          <Text className="font-semibold text-brand-black dark:text-white text-base">
            Edit profile
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView
          contentContainerClassName="px-6 pt-2 pb-8 gap-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center gap-3 pt-2">
            <Pressable
              onPress={handlePickAvatar}
              disabled={uploadingAvatar}
              className="active:scale-95"
            >
              <View className="relative">
                <Avatar
                  name={avatarSource}
                  imageUrl={avatarUrl}
                  size="lg"
                />
                <View className="absolute -right-1 -bottom-1 w-6 h-6 rounded-pill bg-brand-green border-2 border-white dark:border-brand-black items-center justify-center">
                  <Ionicons name="camera" size={12} color="#163300" />
                </View>
                {uploadingAvatar ? (
                  <View className="absolute inset-0 rounded-pill bg-black/40 items-center justify-center">
                    <ActivityIndicator color="#ffffff" />
                  </View>
                ) : null}
              </View>
            </Pressable>
            <Text
              className="font-display text-brand-black dark:text-white text-3xl"
              style={{ lineHeight: 0.85 * 30, letterSpacing: -0.5 }}
            >
              {trimmed || "Your profile"}
            </Text>
            {avatarUrl ? (
              <Pressable
                onPress={handleRemoveAvatar}
                disabled={uploadingAvatar}
                hitSlop={6}
                className="active:opacity-60 disabled:opacity-40"
              >
                <Text className="font-semibold text-semantic-danger text-sm">
                  Remove photo
                </Text>
              </Pressable>
            ) : (
              <Text className="font-semibold text-neutral-gray text-xs">
                Tap to change
              </Text>
            )}
            {avatarError ? (
              <Text className="font-semibold text-semantic-danger text-xs text-center">
                {avatarError}
              </Text>
            ) : null}
          </View>

          <View className="gap-5">
            <View className="gap-2">
              <Text className="font-semibold text-brand-black dark:text-white text-sm">
                Full name
              </Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Jane Doe"
                placeholderTextColor={placeholderColor}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                className="rounded-token-md border border-brand-black/10 dark:border-white/10 px-4 py-4 text-brand-black dark:text-white text-[16px] font-semibold"
              />
            </View>

            <View className="gap-2">
              <Text className="font-semibold text-brand-black dark:text-white text-sm">
                Email
              </Text>
              <View className="flex-row items-center justify-between rounded-token-md border border-brand-black/10 dark:border-white/10 bg-neutral-lightSurface dark:bg-white/5 px-4 py-4">
                <Text
                  className="text-brand-black dark:text-white text-[16px] font-semibold flex-1"
                  numberOfLines={1}
                >
                  {email}
                </Text>
                <Ionicons name="lock-closed" size={16} color="#868685" />
              </View>
              <Text className="font-semibold text-neutral-gray text-xs">
                Email can’t be changed from here yet.
              </Text>
            </View>

            {error ? (
              <View className="rounded-token-md bg-semantic-danger/10 px-4 py-3">
                <Text className="text-semantic-danger text-sm font-semibold">
                  {error}
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View className="px-6 pb-4">
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            className="bg-brand-green rounded-pill py-4 active:scale-95 disabled:opacity-40"
          >
            <Text className="text-brand-greenDark text-center font-semibold text-lg">
              {saving ? "Saving…" : "Save changes"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
