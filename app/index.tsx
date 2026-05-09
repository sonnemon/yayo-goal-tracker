import { Redirect } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

import { useAuth } from "@/components/auth/AuthProvider";

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-brand-black gap-3">
        <ActivityIndicator color="#163300" />
        <Text className="text-neutral-warmDark dark:text-neutral-gray font-semibold text-sm">
          Loading session…
        </Text>
      </View>
    );
  }

  return <Redirect href={session ? "/(tabs)" : "/(auth)/signin"} />;
}
