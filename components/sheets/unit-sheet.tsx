import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTheme } from "@/components/theme/ThemeProvider";

export type UnitOption = {
  id: string;
  label: string;
  custom?: boolean;
};

type Props = {
  open: boolean;
  value: string;
  units: UnitOption[];
  onPick: (id: string) => void;
  onAddCustom: (label: string) => void;
  onClose: () => void;
};

export function UnitSheet({
  open,
  value,
  units,
  onPick,
  onAddCustom,
  onClose,
}: Props) {
  const [mode, setMode] = useState<"list" | "create">("list");
  const [draft, setDraft] = useState("");
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const muteColor = isDark ? "#6E726B" : "#868685";
  const accentLink = isDark ? "#9fe870" : "#163300";

  useEffect(() => {
    if (!open) {
      setMode("list");
      setDraft("");
    }
  }, [open]);

  const trimmed = draft.trim();
  const exists = units.some(
    (u) => u.label.toLowerCase() === trimmed.toLowerCase()
  );
  const canSave = trimmed.length > 0 && !exists;

  function submit() {
    if (!canSave) return;
    onAddCustom(trimmed);
    setDraft("");
    setMode("list");
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        <Pressable onPress={onClose} className="flex-1 bg-black/55" />
        <View className="bg-white dark:bg-[#0E0F0E] border-t border-brand-black/10 dark:border-white/[0.08] rounded-t-[28px] max-h-[78%]">
          <View className="self-center w-9 h-1 bg-brand-black/20 dark:bg-white/[0.16] rounded-sm mt-2 mb-1.5" />

          {mode === "list" ? (
            <>
              <View className="px-5 pt-2">
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-brand-black dark:text-[#F5F6F4] text-[17px] font-semibold">
                    Unit
                  </Text>
                  <Pressable onPress={onClose} hitSlop={8}>
                    <Text
                      className="text-brand-greenDark dark:text-brand-green text-[15px] font-semibold"
                    >
                      Done
                    </Text>
                  </Pressable>
                </View>
                <Text className="text-neutral-gray dark:text-[#6E726B] text-[13px] mb-3.5">
                  How is your target measured?
                </Text>
              </View>

              <ScrollView contentContainerClassName="px-5 pb-7">
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {units.map((u) => {
                    const sel = u.id === value;
                    return (
                      <Pressable
                        key={u.id}
                        onPress={() => {
                          onPick(u.id);
                          onClose();
                        }}
                        className={`flex-row items-center gap-1.5 h-[38px] px-4 rounded-pill border active:scale-95 ${
                          sel
                            ? "bg-brand-green border-brand-green"
                            : "bg-neutral-lightSurface dark:bg-[#161816] border-brand-black/10 dark:border-white/[0.08]"
                        }`}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            sel
                              ? "text-brand-greenDark"
                              : "text-brand-black dark:text-[#F5F6F4]"
                          }`}
                        >
                          {u.label}
                        </Text>
                        {u.custom ? (
                          <View
                            className={`px-1.5 py-px rounded ${
                              sel
                                ? "bg-brand-greenDark/20"
                                : "bg-brand-black/10 dark:bg-[#1F221F]"
                            }`}
                          >
                            <Text
                              className={`text-[10px] font-semibold ${
                                sel
                                  ? "text-brand-greenDark"
                                  : "text-neutral-gray dark:text-[#6E726B]"
                              }`}
                            >
                              custom
                            </Text>
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable
                  onPress={() => setMode("create")}
                  className="h-12 rounded-token-lg bg-neutral-lightSurface dark:bg-[#161816] border border-dashed border-brand-black/20 dark:border-white/[0.16] items-center justify-center flex-row gap-2 active:scale-[0.98]"
                >
                  <Ionicons
                    name="add"
                    size={16}
                    color={isDark ? "#F5F6F4" : "#0e0f0c"}
                  />
                  <Text className="text-brand-black dark:text-[#F5F6F4] text-sm font-semibold">
                    Create custom unit
                  </Text>
                </Pressable>
              </ScrollView>
            </>
          ) : (
            <>
              <View className="px-5 pt-2">
                <View className="flex-row items-center justify-between mb-1.5">
                  <Pressable
                    onPress={() => setMode("list")}
                    hitSlop={8}
                    className="flex-row items-center gap-1"
                  >
                    <Ionicons
                      name="chevron-back"
                      size={16}
                      color={accentLink}
                    />
                    <Text className="text-brand-greenDark dark:text-brand-green text-[15px] font-semibold">
                      Back
                    </Text>
                  </Pressable>
                  <Pressable onPress={submit} disabled={!canSave} hitSlop={8}>
                    <Text
                      className={`text-[15px] font-semibold ${
                        canSave
                          ? "text-brand-greenDark dark:text-brand-green"
                          : "text-neutral-gray dark:text-[#6E726B]"
                      }`}
                    >
                      Save
                    </Text>
                  </Pressable>
                </View>
              </View>
              <ScrollView contentContainerClassName="px-5 pt-3.5 pb-7">
                <Text className="text-brand-black dark:text-[#F5F6F4] text-[22px] font-semibold mb-1">
                  Create custom unit
                </Text>
                <Text className="text-neutral-gray dark:text-[#6E726B] text-[13px] mb-5">
                  Short label that fits next to your target number.
                </Text>

                <Text className="text-neutral-warmDark dark:text-[#A6ABA4] text-xs font-semibold uppercase tracking-wider mb-2">
                  Label
                </Text>
                <TextInput
                  value={draft}
                  onChangeText={(t) => setDraft(t.slice(0, 12))}
                  placeholder="e.g. cups, reps, sessions"
                  placeholderTextColor={muteColor}
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect={false}
                  className={`h-[52px] px-4 rounded-token-lg bg-neutral-lightSurface dark:bg-[#161816] border text-brand-black dark:text-[#F5F6F4] text-[17px] font-semibold ${
                    exists
                      ? "border-semantic-danger"
                      : "border-brand-black/10 dark:border-white/[0.08]"
                  }`}
                />
                <View className="flex-row justify-between mt-2">
                  <Text
                    className={`text-xs font-semibold ${
                      exists
                        ? "text-semantic-danger"
                        : "text-neutral-gray dark:text-[#6E726B]"
                    }`}
                  >
                    {exists ? "That unit already exists" : "Up to 12 characters"}
                  </Text>
                  <Text className="text-xs font-semibold text-neutral-gray dark:text-[#6E726B]">
                    {draft.length}/12
                  </Text>
                </View>

                {trimmed && !exists ? (
                  <View className="mt-5 rounded-token-lg bg-neutral-lightSurface dark:bg-[#161816] border border-brand-black/10 dark:border-white/[0.08] px-4 py-3.5">
                    <Text className="text-neutral-gray dark:text-[#6E726B] text-[11px] font-semibold uppercase tracking-wider mb-2">
                      Preview
                    </Text>
                    <View className="flex-row items-baseline gap-2">
                      <Text className="text-brand-black dark:text-[#F5F6F4] text-[28px] font-semibold">
                        5,000
                      </Text>
                      <View className="h-7 px-2.5 rounded-pill bg-brand-green items-center justify-center">
                        <Text className="text-brand-greenDark text-[13px] font-semibold">
                          {trimmed}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}
              </ScrollView>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
