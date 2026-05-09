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

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
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
      </Stack>
    </>
  );
}
