import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { GoalIcon } from "@/components/icon-picker";
import { useTheme } from "@/components/theme/ThemeProvider";
import type { Goal } from "@/lib/goals";

type Props = {
  open: boolean;
  value: string | null;
  composites: Goal[];
  onPick: (id: string | null) => void;
  onClose: () => void;
};

export function ParentSheet({ open, value, composites, onPick, onClose }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#9fe870" : "#163300";

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable onPress={onClose} className="flex-1 bg-black/55" />
        <View className="bg-white dark:bg-[#0E0F0E] border-t border-brand-black/10 dark:border-white/[0.08] rounded-t-[28px] max-h-[78%]">
          <View className="self-center w-9 h-1 bg-brand-black/20 dark:bg-white/[0.16] rounded-sm mt-2 mb-1.5" />

          <View className="px-5 pt-2">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-brand-black dark:text-[#F5F6F4] text-[17px] font-semibold">
                Parent goal
              </Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Text className="text-brand-greenDark dark:text-brand-green text-[15px] font-semibold">
                  Done
                </Text>
              </Pressable>
            </View>
            <Text className="text-neutral-gray dark:text-[#6E726B] text-[13px] mb-3.5">
              Group this goal under a composite goal, or leave it standalone.
            </Text>
          </View>

          <ScrollView contentContainerClassName="px-5 pb-7 gap-2">
            <Pressable
              onPress={() => {
                onPick(null);
                onClose();
              }}
              className={`flex-row items-center gap-3 px-4 py-3 rounded-token-lg border active:scale-[0.98] ${
                value === null
                  ? "bg-brand-green border-brand-green"
                  : "bg-neutral-lightSurface dark:bg-[#161816] border-brand-black/10 dark:border-white/[0.08]"
              }`}
            >
              <View
                className={`w-9 h-9 rounded-pill items-center justify-center ${
                  value === null
                    ? "bg-brand-greenDark/20"
                    : "bg-white dark:bg-[#0E0F0E]"
                }`}
              >
                <Ionicons name="remove-outline" size={18} color={iconColor} />
              </View>
              <View className="flex-1">
                <Text
                  className={`font-semibold text-[15px] ${
                    value === null
                      ? "text-brand-greenDark"
                      : "text-brand-black dark:text-[#F5F6F4]"
                  }`}
                >
                  None
                </Text>
                <Text
                  className={`text-xs font-semibold ${
                    value === null
                      ? "text-brand-greenDark/70"
                      : "text-neutral-gray dark:text-[#6E726B]"
                  }`}
                >
                  Top-level goal
                </Text>
              </View>
              {value === null ? (
                <Ionicons name="checkmark" size={18} color="#163300" />
              ) : null}
            </Pressable>

            {composites.length === 0 ? (
              <View className="rounded-token-lg border border-dashed border-brand-black/15 dark:border-white/[0.12] px-4 py-5 items-center">
                <Text className="text-neutral-gray dark:text-[#6E726B] text-sm font-semibold text-center">
                  You don’t have any composite goals yet.
                </Text>
                <Text className="text-neutral-gray dark:text-[#6E726B] text-xs mt-1 text-center">
                  Create one to use it as a parent here.
                </Text>
              </View>
            ) : (
              composites.map((g) => {
                const sel = g.id === value;
                return (
                  <Pressable
                    key={g.id}
                    onPress={() => {
                      onPick(g.id);
                      onClose();
                    }}
                    className={`flex-row items-center gap-3 px-4 py-3 rounded-token-lg border active:scale-[0.98] ${
                      sel
                        ? "bg-brand-green border-brand-green"
                        : "bg-neutral-lightSurface dark:bg-[#161816] border-brand-black/10 dark:border-white/[0.08]"
                    }`}
                  >
                    <View
                      className={`w-9 h-9 rounded-pill items-center justify-center ${
                        sel
                          ? "bg-brand-greenDark/20"
                          : "bg-white dark:bg-[#0E0F0E]"
                      }`}
                    >
                      <GoalIcon name={g.icon} size={18} color={iconColor} />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`font-semibold text-[15px] ${
                          sel
                            ? "text-brand-greenDark"
                            : "text-brand-black dark:text-[#F5F6F4]"
                        }`}
                        numberOfLines={1}
                      >
                        {g.name}
                      </Text>
                      <Text
                        className={`text-xs font-semibold ${
                          sel
                            ? "text-brand-greenDark/70"
                            : "text-neutral-gray dark:text-[#6E726B]"
                        }`}
                      >
                        Composite
                      </Text>
                    </View>
                    {sel ? (
                      <Ionicons name="checkmark" size={18} color="#163300" />
                    ) : null}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
