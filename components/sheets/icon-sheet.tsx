import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";

import {
  GoalIcon,
  ICON_CATEGORIES,
  type IconCategory,
  getIconCategory,
} from "@/components/icon-picker";
import { useTheme } from "@/components/theme/ThemeProvider";

type Props = {
  open: boolean;
  value: string;
  onPick: (id: string) => void;
  onClose: () => void;
};

const CATEGORIES: { id: IconCategory; label: string }[] = [
  { id: "sports", label: "Sports" },
  { id: "food", label: "Food" },
  { id: "life", label: "Life" },
  { id: "others", label: "Others" },
];

export function IconSheet({ open, value, onPick, onClose }: Props) {
  const [category, setCategory] = useState<IconCategory>(() =>
    getIconCategory(value)
  );
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const textColor = isDark ? "#F5F6F4" : "#0e0f0c";

  useEffect(() => {
    if (open) setCategory(getIconCategory(value));
  }, [open, value]);

  const filtered = ICON_CATEGORIES[category];

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Pressable onPress={onClose} className="flex-1 bg-black/55" />
        <View className="bg-white dark:bg-[#0E0F0E] border-t border-brand-black/10 dark:border-white/[0.08] rounded-t-[28px] max-h-[80%]">
          <View className="self-center w-9 h-1 bg-brand-black/20 dark:bg-white/[0.16] rounded-sm mt-2 mb-1.5" />

          <View className="px-5 pt-2 pb-3.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-brand-black dark:text-[#F5F6F4] text-[17px] font-semibold">
                Choose icon
              </Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Text className="text-brand-greenDark dark:text-brand-green text-[15px] font-semibold">
                  Done
                </Text>
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerClassName="px-5 pb-4">
            <View className="flex-row flex-wrap -m-1">
              {filtered.map((id) => {
                const sel = id === value;
                return (
                  <View
                    key={id}
                    style={{ width: "16.666%" }}
                    className="p-1"
                  >
                    <Pressable
                      onPress={() => {
                        onPick(id);
                        onClose();
                      }}
                      className={`aspect-square rounded-token-lg border items-center justify-center active:scale-95 ${
                        sel
                          ? "bg-brand-green border-brand-green"
                          : "bg-neutral-lightSurface dark:bg-[#161816] border-brand-black/10 dark:border-white/[0.08]"
                      }`}
                    >
                      <GoalIcon
                        name={id}
                        size={22}
                        color={sel ? "#163300" : textColor}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          <View className="flex-row gap-2 px-5 pt-3 pb-6 border-t border-brand-black/10 dark:border-white/[0.08]">
            {CATEGORIES.map((c) => {
              const active = category === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategory(c.id)}
                  className={`flex-1 h-9 rounded-pill items-center justify-center border active:scale-95 ${
                    active
                      ? "bg-brand-green border-brand-green"
                      : "bg-neutral-lightSurface dark:bg-[#161816] border-brand-black/10 dark:border-white/[0.08]"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      active
                        ? "text-brand-greenDark"
                        : "text-brand-black dark:text-[#F5F6F4]"
                    }`}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
