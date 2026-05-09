import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";
import { useUnits } from "@/lib/units";

export const PRESET_UNITS = [
  "$",
  "steps",
  "books",
  "pages",
  "km",
  "L",
  "min",
];

type Props = {
  value: string;
  onChange: (next: string) => void;
};

export function UnitBadges({ value, onChange }: Props) {
  const [customMode, setCustomMode] = useState(false);
  const { resolvedTheme } = useTheme();
  const { data: units } = useUnits();
  const isDark = resolvedTheme === "dark";
  const placeholderColor = isDark ? "#5a5c59" : "#868685";

  const customValues = (units ?? []).map((u) => u.value);
  const isInPresets = PRESET_UNITS.includes(value);
  const isInCustom = !isInPresets && customValues.includes(value);
  const isUnknownCustom = value !== "" && !isInPresets && !isInCustom;

  function selectExisting(u: string) {
    onChange(u);
    setCustomMode(false);
  }

  function openCustom() {
    setCustomMode(true);
    if (isInPresets || isInCustom) onChange("");
  }

  const isDefault = value === "";

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        <Pressable
          onPress={() => selectExisting("")}
          className={`px-3.5 py-2 rounded-pill border active:scale-95 ${
            isDefault
              ? "bg-brand-green border-brand-green"
              : "bg-white dark:bg-neutral-darkSurface border-brand-black/10 dark:border-white/10"
          }`}
        >
          <Text
            className={`font-semibold text-sm ${
              isDefault
                ? "text-brand-greenDark"
                : "text-brand-black dark:text-white"
            }`}
          >
            —
          </Text>
        </Pressable>
        {customValues.map((u) => {
          const active = value === u;
          return (
            <Pressable
              key={`custom-${u}`}
              onPress={() => selectExisting(u)}
              className={`px-3.5 py-2 rounded-pill active:scale-95 ${
                active
                  ? "bg-brand-green"
                  : "bg-brand-mint dark:bg-brand-greenDark"
              }`}
            >
              <Text
                className={`font-semibold text-sm ${
                  active
                    ? "text-brand-greenDark"
                    : "text-brand-greenDark dark:text-brand-mint"
                }`}
              >
                {u}
              </Text>
            </Pressable>
          );
        })}
        {PRESET_UNITS.map((u) => {
          const active = value === u;
          return (
            <Pressable
              key={u}
              onPress={() => selectExisting(u)}
              className={`px-3.5 py-2 rounded-pill border active:scale-95 ${
                active
                  ? "bg-brand-green border-brand-green"
                  : "bg-white dark:bg-neutral-darkSurface border-brand-black/10 dark:border-white/10"
              }`}
            >
              <Text
                className={`font-semibold text-sm ${
                  active
                    ? "text-brand-greenDark"
                    : "text-brand-black dark:text-white"
                }`}
              >
                {u}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={openCustom}
          className={`px-3.5 py-2 rounded-pill border flex-row items-center gap-1 active:scale-95 ${
            customMode || isUnknownCustom
              ? "bg-brand-green border-brand-green"
              : "bg-white dark:bg-neutral-darkSurface border-brand-black/10 dark:border-white/10"
          }`}
        >
          {isUnknownCustom && !customMode ? (
            <Text className="font-semibold text-sm text-brand-greenDark">
              {value}
            </Text>
          ) : (
            <Ionicons
              name="add"
              size={16}
              color={customMode ? "#163300" : isDark ? "#ffffff" : "#0e0f0c"}
            />
          )}
        </Pressable>
      </View>
      {customMode ? (
        <TextInput
          value={isUnknownCustom ? value : ""}
          onChangeText={onChange}
          placeholder="e.g. miles, hours, calories"
          placeholderTextColor={placeholderColor}
          autoFocus
          className="rounded-token-md border border-brand-black/10 dark:border-white/10 px-4 py-4 text-brand-black dark:text-white text-[16px] font-semibold"
        />
      ) : null}
    </View>
  );
}
