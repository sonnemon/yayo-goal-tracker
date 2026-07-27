import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_900Black,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, useColorScheme, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider, useTheme } from "@/components/theme/ThemeProvider";
import { WidgetSync } from "@/components/widget-sync";
import { queryClient } from "@/lib/query-client";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_900Black,
  });
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  // Hide the native splash as soon as JS is ready — spinner takes over
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? "#0e0f0c" : "#ffffff",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator
          size="large"
          color={isDark ? "#9fe870" : "#163300"}
        />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <WidgetSync />
              <ThemedAppShell />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedAppShell() {
  const { resolvedTheme } = useTheme();
  const surfaceColor = resolvedTheme === "dark" ? "#0e0f0c" : "#ffffff";

  return (
    <>
      <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: surfaceColor },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile/edit" options={{ presentation: "modal" }} />
        <Stack.Screen name="premium" options={{ presentation: "modal" }} />
        <Stack.Screen
          name="suggestions"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="goal/new" />
        <Stack.Screen
          name="goal/[id]/index"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="goal/[id]/edit"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="goal/[id]/logs"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="goal/[id]/log/[logId]"
          options={{ presentation: "modal" }}
        />
      </Stack>
    </>
  );
}
