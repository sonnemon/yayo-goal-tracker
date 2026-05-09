import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/components/auth/AuthProvider";
import { Avatar } from "@/components/avatar";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function ProfileTabScreen() {
  const { user, signOut } = useAuth();
  const { resolvedTheme, toggle } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#ffffff" : "#0e0f0c";
  const chevronColor = isDark ? "#5a5c59" : "#868685";

  const fullName = (user?.user_metadata?.full_name as string | undefined)?.trim();
  const email = user?.email ?? "";
  const displayName = fullName || (email ? email.split("@")[0] : "User");
  const avatarSource = fullName || email;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-brand-black">
      <ScrollView contentContainerClassName="px-6 pt-12 pb-32 gap-8">
        <View className="items-center gap-4 pt-2">
          <Avatar name={avatarSource} size="lg" />
          <View className="items-center gap-1">
            <Text
              className="font-display text-brand-black dark:text-white text-3xl text-center"
              style={{ lineHeight: 0.85 * 30, letterSpacing: -0.5 }}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text
              className="font-semibold text-neutral-warmDark dark:text-neutral-gray text-sm"
              numberOfLines={1}
            >
              {email}
            </Text>
          </View>
        </View>

        <View className="gap-2">
          <SectionHeader>Account</SectionHeader>
          <Section>
            <Row
              icon="person-outline"
              label="Edit profile"
              onPress={() => router.push("/profile/edit")}
              iconColor={iconColor}
              chevronColor={chevronColor}
            />
            <Divider />
            <Row
              icon="sparkles"
              label="Go Premium"
              onPress={() => router.push("/premium")}
              iconColor="#163300"
              labelColor="text-brand-greenDark dark:text-brand-green"
              iconBg="bg-brand-green"
              chevronColor={chevronColor}
            />
          </Section>
        </View>

        <View className="gap-2">
          <SectionHeader>Preferences</SectionHeader>
          <Section>
            <View className="flex-row items-center justify-between px-4 py-3.5">
              <View className="flex-row items-center gap-3">
                <Ionicons
                  name={isDark ? "moon" : "moon-outline"}
                  size={20}
                  color={iconColor}
                />
                <Text className="font-semibold text-brand-black dark:text-white text-base">
                  Dark mode
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggle}
                trackColor={{ false: "#e8ebe6", true: "#9fe870" }}
                thumbColor="#ffffff"
                ios_backgroundColor="#e8ebe6"
              />
            </View>
          </Section>
        </View>

        <View className="gap-2">
          <SectionHeader>Help</SectionHeader>
          <Section>
            <Row
              icon="chatbubble-ellipses-outline"
              label="Suggestions"
              onPress={() => router.push("/suggestions")}
              iconColor={iconColor}
              chevronColor={chevronColor}
            />
          </Section>
        </View>

        <View className="gap-2">
          <SectionHeader>Session</SectionHeader>
          <Section>
            <Row
              icon="log-out-outline"
              label="Sign out"
              onPress={signOut}
              iconColor="#d03238"
              labelColor="text-semantic-danger"
              chevronColor={chevronColor}
            />
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ children }: { children: string }) {
  return (
    <Text className="font-semibold text-neutral-gray text-xs uppercase tracking-wider px-4">
      {children}
    </Text>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <View className="rounded-token-2xl border border-brand-black/10 dark:border-white/10 bg-white dark:bg-neutral-darkSurface overflow-hidden">
      {children}
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-brand-black/10 dark:bg-white/10 mx-4" />;
}

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  iconColor: string;
  iconBg?: string;
  labelColor?: string;
  chevronColor: string;
};

function Row({
  icon,
  label,
  onPress,
  iconColor,
  iconBg,
  labelColor,
  chevronColor,
}: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between px-4 py-3.5 active:bg-brand-black/5 dark:active:bg-white/5"
    >
      <View className="flex-row items-center gap-3 flex-1">
        {iconBg ? (
          <View
            className={`w-7 h-7 rounded-token-md ${iconBg} items-center justify-center`}
          >
            <Ionicons name={icon} size={16} color={iconColor} />
          </View>
        ) : (
          <View className="w-7 items-center">
            <Ionicons name={icon} size={20} color={iconColor} />
          </View>
        )}
        <Text
          className={`font-semibold text-base ${
            labelColor ?? "text-brand-black dark:text-white"
          }`}
        >
          {label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={chevronColor} />
    </Pressable>
  );
}
