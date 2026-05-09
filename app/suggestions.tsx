import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/components/theme/ThemeProvider";
import { type SuggestionType, useCreateSuggestion } from "@/lib/suggestions";

const TYPES: { id: SuggestionType; label: string }[] = [
  { id: "feedback", label: "Feedback" },
  { id: "feature", label: "Feature" },
  { id: "bug", label: "Bug" },
];

export default function SuggestionsScreen() {
  const [type, setType] = useState<SuggestionType>("feedback");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#ffffff" : "#0e0f0c";
  const placeholderColor = isDark ? "#5a5c59" : "#868685";
  const createSuggestion = useCreateSuggestion();

  const trimmedMessage = message.trim();
  const canSubmit =
    trimmedMessage.length > 0 && !createSuggestion.isPending && !sent;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    try {
      await createSuggestion.mutateAsync({
        title,
        message: trimmedMessage,
        type,
      });
      setSent(true);
      setTimeout(() => router.back(), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send.");
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
            Send suggestion
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView
          contentContainerClassName="px-6 pt-2 pb-8 gap-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-2">
            <Text
              className="font-display text-brand-black dark:text-white text-3xl"
              style={{ lineHeight: 0.85 * 30, letterSpacing: -0.5 }}
            >
              Tell us anything.
            </Text>
            <Text className="font-semibold text-neutral-warmDark dark:text-neutral-gray text-sm">
              Bug, idea, or just thoughts — we read everything.
            </Text>
          </View>

          <View className="gap-3">
            <Text className="font-semibold text-brand-black dark:text-white text-sm">
              Type
            </Text>
            <View className="flex-row gap-2">
              {TYPES.map((t) => {
                const active = type === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setType(t.id)}
                    className={`flex-1 h-9 rounded-pill items-center justify-center border active:scale-95 ${
                      active
                        ? "bg-brand-green border-brand-green"
                        : "bg-white dark:bg-neutral-darkSurface border-brand-black/10 dark:border-white/10"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        active
                          ? "text-brand-greenDark"
                          : "text-brand-black dark:text-white"
                      }`}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="gap-2">
            <Text className="font-semibold text-brand-black dark:text-white text-sm">
              Title{" "}
              <Text className="text-neutral-gray font-semibold">(optional)</Text>
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Quick summary"
              placeholderTextColor={placeholderColor}
              className="rounded-token-md border border-brand-black/10 dark:border-white/10 px-4 py-4 text-brand-black dark:text-white text-[16px] font-semibold"
            />
          </View>

          <View className="gap-2">
            <Text className="font-semibold text-brand-black dark:text-white text-sm">
              Message
            </Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Tell us more…"
              placeholderTextColor={placeholderColor}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              style={{ minHeight: 140, paddingTop: 14 }}
              className="rounded-token-md border border-brand-black/10 dark:border-white/10 px-4 pb-4 text-brand-black dark:text-white text-[16px] font-semibold"
            />
          </View>

          {error ? (
            <View className="rounded-token-md bg-semantic-danger/10 px-4 py-3">
              <Text className="text-semantic-danger text-sm font-semibold">
                {error}
              </Text>
            </View>
          ) : null}

          {sent ? (
            <View className="rounded-token-md bg-brand-mint dark:bg-brand-greenDark px-4 py-3 flex-row items-center gap-2">
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={isDark ? "#9fe870" : "#163300"}
              />
              <Text className="text-brand-greenDark dark:text-brand-mint text-sm font-semibold">
                Thanks — got it.
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View className="px-6 pb-4">
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            className="bg-brand-green rounded-pill py-4 active:scale-95 disabled:opacity-40"
          >
            <Text className="text-brand-greenDark text-center font-semibold text-lg">
              {createSuggestion.isPending
                ? "Sending…"
                : sent
                  ? "Sent"
                  : "Send"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
