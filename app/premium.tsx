import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/components/theme/ThemeProvider";
import {
  fetchCurrentOffering,
  isIAPConfigured,
  isPremium,
  isUserCancelled,
  purchasePackage,
  restorePurchases,
} from "@/lib/iap";

type PlanId = "monthly" | "yearly";

type PlanRow = {
  id: PlanId;
  label: string;
  price: string;
  badge?: string;
  pkg: PurchasesPackage | null;
};

const FALLBACK_MONTHLY_PRICE = "$3.99 / month";
const FALLBACK_YEARLY_PRICE = "$24.99 / year";
const YEARLY_SAVINGS_BADGE = "Save 48%";

const FEATURES = [
  {
    icon: "infinite",
    title: "Unlimited goals",
    desc: "Beyond the 5-goal free tier.",
  },
  {
    icon: "apps",
    title: "Keep your widgets",
    desc: "Stay on the home screen after the 7-day free trial.",
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
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("yearly");
  const [monthlyPkg, setMonthlyPkg] = useState<PurchasesPackage | null>(null);
  const [yearlyPkg, setYearlyPkg] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(isIAPConfigured());
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!isIAPConfigured()) return;
    fetchCurrentOffering()
      .then((offering) => {
        if (cancelled) return;
        setMonthlyPkg(offering?.monthly ?? null);
        setYearlyPkg(offering?.annual ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const plans: PlanRow[] = [
    {
      id: "monthly",
      label: "Monthly",
      price: monthlyPkg?.product.priceString
        ? `${monthlyPkg.product.priceString} / month`
        : FALLBACK_MONTHLY_PRICE,
      pkg: monthlyPkg,
    },
    {
      id: "yearly",
      label: "Yearly",
      price: yearlyPkg?.product.priceString
        ? `${yearlyPkg.product.priceString} / year`
        : FALLBACK_YEARLY_PRICE,
      badge: YEARLY_SAVINGS_BADGE,
      pkg: yearlyPkg,
    },
  ];

  const selected = plans.find((p) => p.id === selectedPlan)!;

  async function handlePurchase() {
    if (purchasing || restoring) return;
    if (!isIAPConfigured()) {
      Alert.alert(
        "Premium not configured",
        "Set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY in your environment and run prebuild + run:ios to enable purchases."
      );
      return;
    }
    if (!selected.pkg) {
      Alert.alert(
        "Couldn’t load plans",
        "Make sure the products and offerings are configured in RevenueCat for this build."
      );
      return;
    }
    setPurchasing(true);
    try {
      const info = await purchasePackage(selected.pkg);
      if (isPremium(info)) {
        router.back();
      }
    } catch (err) {
      if (!isUserCancelled(err)) {
        Alert.alert(
          "Couldn’t complete purchase",
          err instanceof Error ? err.message : "Something went wrong."
        );
      }
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    if (purchasing || restoring) return;
    if (!isIAPConfigured()) {
      Alert.alert("Restore", "In-app purchases aren’t configured yet.");
      return;
    }
    setRestoring(true);
    try {
      const info = await restorePurchases();
      if (isPremium(info)) {
        Alert.alert("Restored", "Your Premium subscription is active again.");
        router.back();
      } else {
        Alert.alert("Nothing to restore", "No active Premium found on this Apple ID.");
      }
    } catch (err) {
      Alert.alert(
        "Couldn’t restore",
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setRestoring(false);
    }
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
          disabled={restoring || purchasing}
          className="px-3 py-2 rounded-token-md active:bg-brand-black/5 dark:active:bg-white/5 disabled:opacity-40"
        >
          <Text className="font-semibold text-neutral-warmDark dark:text-neutral-gray text-sm">
            {restoring ? "Restoring…" : "Restore"}
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
          {plans.map((p) => {
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
          disabled={purchasing || restoring || loading}
          className="bg-brand-green rounded-pill h-[54px] items-center justify-center active:scale-95 disabled:opacity-40 flex-row gap-2"
        >
          {purchasing || loading ? (
            <ActivityIndicator color="#163300" />
          ) : null}
          <Text className="text-brand-greenDark text-center font-semibold text-lg">
            {purchasing
              ? "Purchasing…"
              : loading
                ? "Loading plans…"
                : "Continue"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
