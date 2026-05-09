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

export default function SignupScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordTooShort = password.length > 0 && password.length < 6;
  const trimmedFullName = fullName.trim();

  async function handleSignup() {
    setError(null);
    if (passwordTooShort) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: trimmedFullName },
      },
    });
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
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
              Start{"\n"}tracking.
            </Text>
            <Text className="font-semibold text-neutral-warmDark text-base">
              One account. Every goal. Beautiful widgets.
            </Text>
          </View>

          <View className="gap-5 mb-8">
            <View className="gap-2">
              <Text className="font-semibold text-brand-black text-sm">Full name</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Jane Doe"
                placeholderTextColor="#868685"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                className="rounded-token-md border border-brand-black/10 px-4 py-4 text-brand-black text-[16px] font-semibold"
              />
            </View>

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
                placeholder="At least 6 characters"
                placeholderTextColor="#868685"
                secureTextEntry
                autoComplete="new-password"
                className="rounded-token-md border border-brand-black/10 px-4 py-4 text-brand-black text-[16px] font-semibold"
              />
              {passwordTooShort ? (
                <Text className="text-neutral-gray text-xs font-semibold">
                  6 characters minimum.
                </Text>
              ) : null}
            </View>

            {error ? (
              <View className="rounded-token-md bg-semantic-danger/10 px-4 py-3">
                <Text className="text-semantic-danger text-sm font-semibold">{error}</Text>
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={handleSignup}
            disabled={submitting || !trimmedFullName || !email || !password || passwordTooShort}
            className="bg-brand-green rounded-pill py-4 active:scale-95 disabled:opacity-40 mb-6"
          >
            <Text className="text-brand-greenDark text-center font-semibold text-lg">
              {submitting ? "Creating account…" : "Create account"}
            </Text>
          </Pressable>

          <View className="flex-row justify-center gap-1.5">
            <Text className="text-neutral-warmDark text-base font-semibold">
              Already have an account?
            </Text>
            <Link
              href="/(auth)/signin"
              className="text-brand-greenDark font-semibold text-base underline"
            >
              Sign in
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
