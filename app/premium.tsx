import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/components/theme/ThemeProvider";

type Plan = {
  id: "monthly" | "yearly";
  label: string;
  price: string;
  badge?: string;
};

const PLANS: Plan[] = [
  { id: "monthly", label: "Monthly", price: "$2.99 / month" },
  {
    id: "yearly",
    label: "Yearly",
    price: "$19.99 / year",
    badge: "Save 44%",
  },
];

const FEATURES = [
  { icon: "infinite", title: "Unlimited goals", desc: "No cap on active goals." },
  {
    icon: "apps",
    title: "iOS home screen widgets",
    desc: "See your progress at a glance.",
  },
  {
    icon: "color-palette-outline",
    title: "Custom themes",
    desc: "Pick your accent color.",
  },
  {
    icon: "stats-chart",
    title: "Detailed insights",
    desc: "Charts and streaks for every goal.",
  },
] as const;

export default function PremiumScreen() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#ffffff" : "#0e0f0c";
  const [selectedPlan, setSelectedPlan] = useState<Plan["id"]>("yearly");

  function handlePurchase() {
    Alert.alert(
      "Apple Paywall",
      "In-app purchase isn’t wired yet. Connect RevenueCat or react-native-iap to open the StoreKit flow.",
      [{ text: "OK" }]
    );
  }

  function handleRestore() {
    Alert.alert("Restore purchases", "No purchases to restore yet.");
  }

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-brand-black"
      edges={["bottom"]}
    >
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-token-md active:bg-brand-black/5 dark:active:bg-white/5"
        >
          <Ionicons name="close" size={22} color={iconColor} />
        </Pressable>
        <Pressable
          onPress={handleRestore}
          className="px-3 py-2 rounded-token-md active:bg-brand-black/5 dark:active:bg-white/5"
        >
          <Text className="font-semibold text-neutral-warmDark dark:text-neutral-gray text-sm">
            Restore
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="px-6 pt-2 pb-8 gap-8">
        <View className="items-start gap-3">
          <View className="w-14 h-14 rounded-token-2xl bg-brand-green items-center justify-center">
            <Ionicons name="trophy" size={28} color="#163300" />
          </View>
          <Text
            className="font-display text-brand-black dark:text-white text-5xl"
            style={{ lineHeight: 0.85 * 48, letterSpacing: -1 }}
          >
            Premium.
          </Text>
          <Text className="font-semibold text-neutral-warmDark dark:text-neutral-gray text-base">
            Unlock everything Goal Tracker can do.
          </Text>
        </View>

        <View className="gap-4">
          {FEATURES.map((f) => (
            <View key={f.title} className="flex-row items-start gap-3">
              <View className="w-10 h-10 rounded-token-md bg-brand-mint dark:bg-brand-greenDark items-center justify-center">
                <Ionicons
                  name={f.icon}
                  size={20}
                  color={isDark ? "#9fe870" : "#163300"}
                />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="font-semibold text-brand-black dark:text-white text-base">
                  {f.title}
                </Text>
                <Text className="font-semibold text-neutral-warmDark dark:text-neutral-gray text-sm">
                  {f.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View className="gap-3">
          {PLANS.map((p) => {
            const active = selectedPlan === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setSelectedPlan(p.id)}
                className={`flex-row items-center justify-between rounded-token-xl border-2 px-4 py-4 active:scale-[0.98] ${
                  active
                    ? "border-brand-green bg-brand-mint dark:bg-brand-greenDark"
                    : "border-brand-black/10 dark:border-white/10 bg-white dark:bg-neutral-darkSurface"
                }`}
              >
                <View className="gap-1 flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text
                      className={`font-semibold text-base ${
                        active
                          ? "text-brand-greenDark dark:text-brand-mint"
                          : "text-brand-black dark:text-white"
                      }`}
                    >
                      {p.label}
                    </Text>
                    {p.badge ? (
                      <View className="px-2 py-0.5 rounded-pill bg-brand-green">
                        <Text className="font-semibold text-brand-greenDark text-xs">
                          {p.badge}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text
                    className={`font-semibold text-sm ${
                      active
                        ? "text-brand-greenDark dark:text-brand-mint"
                        : "text-neutral-warmDark dark:text-neutral-gray"
                    }`}
                  >
                    {p.price}
                  </Text>
                </View>
                <View
                  className={`w-6 h-6 rounded-pill border-2 items-center justify-center ${
                    active
                      ? "bg-brand-green border-brand-green"
                      : "border-brand-black/20 dark:border-white/20"
                  }`}
                >
                  {active ? (
                    <Ionicons name="checkmark" size={16} color="#163300" />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text className="font-semibold text-neutral-gray text-xs text-center">
          Auto-renewable subscription. Cancel anytime in App Store settings.
        </Text>
      </ScrollView>

      <View className="px-6 pb-4">
        <Pressable
          onPress={handlePurchase}
          className="bg-brand-green rounded-pill py-4 active:scale-95"
        >
          <Text className="text-brand-greenDark text-center font-semibold text-lg">
            Continue
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
