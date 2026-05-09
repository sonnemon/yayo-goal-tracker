import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

import { useAuth } from "@/components/auth/AuthProvider";
import { FloatingTabBar } from "@/components/floating-tab-bar";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function TabsLayout() {
  const { session, loading } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-brand-black gap-3">
        <ActivityIndicator color={isDark ? "#9fe870" : "#163300"} />
        <Text className="text-neutral-warmDark dark:text-neutral-gray font-semibold text-sm">
          Loading…
        </Text>
      </View>
    );
  }
  if (!session) return <Redirect href="/(auth)/signin" />;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="goals" options={{ title: "Goals" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
