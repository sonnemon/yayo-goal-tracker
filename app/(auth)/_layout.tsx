import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

import { useAuth } from "@/components/auth/AuthProvider";

export default function AuthLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white gap-3">
        <ActivityIndicator color="#163300" />
        <Text className="text-neutral-warmDark font-semibold text-sm">Loading…</Text>
      </View>
    );
  }
  if (session) return <Redirect href="/(tabs)" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#ffffff" },
      }}
    />
  );
}
