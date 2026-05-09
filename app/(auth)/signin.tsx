import { Link, router } from "expo-router";
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

import { supabase } from "@/lib/supabase";

export default function SigninScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignin() {
    setError(null);
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow px-6 pt-6 pb-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-3 mb-10 mt-12">
            <Text
              className="font-display text-brand-black text-6xl"
              style={{ lineHeight: 0.85 * 60, letterSpacing: -1 }}
            >
              Welcome{"\n"}back.
            </Text>
            <Text className="font-semibold text-neutral-warmDark text-base">
              Sign in to keep your streak alive.
            </Text>
          </View>

          <View className="gap-5 mb-8">
            <View className="gap-2">
              <Text className="font-semibold text-brand-black text-sm">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#868685"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                className="rounded-token-md border border-brand-black/10 px-4 py-4 text-brand-black text-[16px] font-semibold"
              />
            </View>

            <View className="gap-2">
              <Text className="font-semibold text-brand-black text-sm">Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#868685"
                secureTextEntry
                autoComplete="current-password"
                className="rounded-token-md border border-brand-black/10 px-4 py-4 text-brand-black text-[16px] font-semibold"
              />
            </View>

            {error ? (
              <View className="rounded-token-md bg-semantic-danger/10 px-4 py-3">
                <Text className="text-semantic-danger text-sm font-semibold">{error}</Text>
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={handleSignin}
            disabled={submitting || !email || !password}
            className="bg-brand-green rounded-pill py-4 active:scale-95 disabled:opacity-40 mb-6"
          >
            <Text className="text-brand-greenDark text-center font-semibold text-lg">
              {submitting ? "Signing in…" : "Sign in"}
            </Text>
          </Pressable>

          <View className="flex-row justify-center gap-1.5">
            <Text className="text-neutral-warmDark text-base font-semibold">New here?</Text>
            <Link
              href="/(auth)/signup"
              className="text-brand-greenDark font-semibold text-base underline"
            >
              Create an account
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
