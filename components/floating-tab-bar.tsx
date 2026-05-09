import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/components/theme/ThemeProvider";

const TAB_ICONS: Record<
  string,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  index: { active: "home", inactive: "home-outline" },
  goals: { active: "flag", inactive: "flag-outline" },
  profile: { active: "person", inactive: "person-outline" },
};

const TAB_LABELS: Record<string, string> = {
  index: "Home",
  goals: "Goals",
  profile: "Profile",
};

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const insets = useSafeAreaInsets();
  const activeColor = isDark ? "#9fe870" : "#163300";
  const inactiveColor = isDark ? "#868685" : "#454745";

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: Math.max(insets.bottom - 8, 4),
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 16,
      }}
    >
      <BlurView
        intensity={isDark ? 60 : 80}
        tint={isDark ? "systemThickMaterialDark" : "systemThickMaterialLight"}
        style={{
          flex: 1,
          flexDirection: "row",
          borderRadius: 36,
          paddingHorizontal: 6,
          paddingVertical: 8,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: isDark
            ? "rgba(255,255,255,0.08)"
            : "rgba(14,15,12,0.06)",
        }}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const icons = TAB_ICONS[route.name];
          const iconName = isFocused ? icons?.active : icons?.inactive;
          const label = TAB_LABELS[route.name] ?? route.name;
          const color = isFocused ? activeColor : inactiveColor;

          return (
            <Pressable
              key={route.key}
              onPress={() => {
                if (!isFocused) navigation.navigate(route.name);
              }}
              hitSlop={6}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 6,
                gap: 2,
              }}
            >
              <Ionicons
                name={iconName ?? "ellipse"}
                size={22}
                color={color}
              />
              <Text
                style={{
                  color,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 11,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </BlurView>

      <Pressable
        onPress={() => router.push("/goal/new")}
        className="w-14 h-14 rounded-pill bg-brand-green items-center justify-center active:scale-95"
        style={{
          shadowColor: "#0e0f0c",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.18,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <Ionicons name="add" size={28} color="#163300" />
      </Pressable>
    </View>
  );
}
