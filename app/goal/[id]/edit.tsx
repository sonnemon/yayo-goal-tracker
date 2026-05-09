import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DEFAULT_ICON, GoalIcon } from "@/components/icon-picker";
import { IconSheet } from "@/components/sheets/icon-sheet";
import {
  type UnitOption,
  UnitSheet,
} from "@/components/sheets/unit-sheet";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  deadlineToISODate,
  useGoal,
  useGoals,
  useUpdateGoal,
} from "@/lib/goals";
import { useCreateUnit, useUnits } from "@/lib/units";

const PRESET_UNIT_OPTIONS: UnitOption[] = [
  { id: "none", label: "—" },
  { id: "S/.", label: "S/." },
  { id: "$", label: "$" },
  { id: "steps", label: "steps" },
  { id: "books", label: "books" },
  { id: "pages", label: "pages" },
  { id: "km", label: "km" },
  { id: "L", label: "L" },
  { id: "min", label: "min" },
];

export default function EditGoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: goal, isLoading } = useGoal(id);
  const updateGoal = useUpdateGoal(id ?? "");
  const createUnit = useCreateUnit();
  const { data: customUnits } = useUnits();
  const { data: allGoals } = useGoals();
  const parentGoal = goal?.parent_id
    ? (allGoals ?? []).find((g) => g.id === goal.parent_id) ?? null
    : null;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const textColor = isDark ? "#F5F6F4" : "#0e0f0c";
  const dimColor = isDark ? "#A6ABA4" : "#454745";
  const muteColor = isDark ? "#6E726B" : "#868685";

  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [icon, setIcon] = useState<string>(DEFAULT_ICON);
  const [unitId, setUnitId] = useState<string>("none");
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadline, setDeadline] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [iconSheetOpen, setIconSheetOpen] = useState(false);
  const [unitSheetOpen, setUnitSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const isComposite = goal?.kind === "composite";

  const presetLabels = new Set(PRESET_UNIT_OPTIONS.map((p) => p.label));
  const allUnits: UnitOption[] = [
    ...PRESET_UNIT_OPTIONS,
    ...(customUnits ?? [])
      .filter((u) => !presetLabels.has(u.value))
      .map((u) => ({
        id: u.value,
        label: u.value,
        custom: true,
      })),
  ];

  useEffect(() => {
    if (goal && !hydrated) {
      setName(goal.name);
      setIcon(goal.icon || DEFAULT_ICON);
      if (goal.kind === "simple") {
        setTarget(goal.total != null ? String(goal.total) : "");
        const matched = allUnits.find((u) => u.label === goal.unit);
        setUnitId(goal.unit ? (matched?.id ?? goal.unit) : "none");
      }
      if (goal.deadline) {
        setHasDeadline(true);
        setDeadline(new Date(`${goal.deadline}T00:00:00`));
      } else {
        setHasDeadline(false);
      }
      setHydrated(true);
    }
  }, [goal, hydrated, allUnits]);

  const targetNumber = parseFloat(target);
  const targetValid =
    target.trim().length > 0 &&
    !Number.isNaN(targetNumber) &&
    targetNumber > 0;
  const canSubmit =
    name.trim().length > 0 &&
    (isComposite || targetValid) &&
    !updateGoal.isPending;

  const currentUnit = allUnits.find((u) => u.id === unitId) ?? allUnits[0];
  const unitForSave = unitId === "none" ? "" : currentUnit.label;
  const isCustomLabel =
    unitForSave !== "" &&
    !PRESET_UNIT_OPTIONS.some((p) => p.label === unitForSave);

  async function handleSave() {
    if (!canSubmit || !goal) return;
    setError(null);
    try {
      if (isComposite) {
        await updateGoal.mutateAsync({
          name: name.trim(),
          icon,
          deadline: hasDeadline ? deadlineToISODate(deadline) : null,
        });
      } else {
        await updateGoal.mutateAsync({
          name: name.trim(),
          total: targetNumber,
          unit: unitForSave,
          icon,
          deadline: hasDeadline ? deadlineToISODate(deadline) : null,
        });
        if (isCustomLabel) {
          createUnit.mutate(unitForSave);
        }
      }
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    }
  }

  function handleAddCustomUnit(label: string) {
    setUnitId(label);
    createUnit.mutate(label);
    setUnitSheetOpen(false);
  }

  function fmtDate(d: Date) {
    return d.toLocaleDateString("en", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-white dark:bg-black items-center justify-center"
        edges={["bottom"]}
      >
        <ActivityIndicator color={isDark ? "#9fe870" : "#163300"} />
      </SafeAreaView>
    );
  }

  if (!goal) {
    return (
      <SafeAreaView
        className="flex-1 bg-white dark:bg-black items-center justify-center px-6 gap-3"
        edges={["bottom"]}
      >
        <Text className="font-semibold text-brand-black dark:text-white text-base">
          Goal not found.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-brand-green rounded-pill px-6 py-3 active:scale-95"
        >
          <Text className="text-brand-greenDark font-semibold">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-black"
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-4 pt-2 pb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-pill active:bg-brand-black/5 dark:active:bg-white/[0.05]"
          >
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </Pressable>
          <Text className="text-brand-black dark:text-[#F5F6F4] text-[17px] font-semibold">
            Edit goal
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView
          contentContainerClassName="px-5 pb-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="bg-white dark:bg-[#0E0F0E] border border-brand-black/10 dark:border-white/[0.08] rounded-[24px] p-[18px] gap-3.5">
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => setIconSheetOpen(true)}
                className="w-[52px] h-[52px] rounded-token-lg bg-brand-green items-center justify-center active:scale-95"
              >
                <GoalIcon name={icon} size={26} color="#163300" />
                <View className="absolute -right-[3px] -bottom-[3px] w-5 h-5 rounded-pill bg-neutral-lightSurface dark:bg-[#1F221F] border-2 border-white dark:border-black items-center justify-center">
                  <Ionicons name="pencil" size={10} color={textColor} />
                </View>
              </Pressable>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Goal name"
                placeholderTextColor={muteColor}
                className="flex-1 text-brand-black dark:text-[#F5F6F4] text-[19px] font-semibold"
                style={{ padding: 0, lineHeight: 23 }}
              />
            </View>

            {isComposite ? (
              <>
                <View className="h-px bg-brand-black/10 dark:bg-white/[0.08]" />
                <View className="flex-row items-start gap-2.5">
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={muteColor}
                    style={{ marginTop: 2 }}
                  />
                  <Text className="flex-1 text-neutral-warmDark dark:text-[#A6ABA4] text-[13px] font-semibold leading-[18px]">
                    A composite goal is a container. It completes when all of
                    its sub-goals are done.
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View className="h-px bg-brand-black/10 dark:bg-white/[0.08]" />
                <View className="flex-row items-center gap-2.5">
                  <Text className="text-neutral-gray dark:text-[#6E726B] text-[13px] font-semibold w-14">
                    Target
                  </Text>
                  <TextInput
                    value={target}
                    onChangeText={(t) => setTarget(t.replace(/[^\d.]/g, ""))}
                    placeholder="0"
                    placeholderTextColor={muteColor}
                    keyboardType="decimal-pad"
                    className="flex-1 text-brand-black dark:text-[#F5F6F4] text-[28px] font-semibold text-right"
                    style={{ padding: 0, lineHeight: 32 }}
                  />
                  <Pressable
                    onPress={() => setUnitSheetOpen(true)}
                    className={`flex-row items-center gap-1.5 h-9 px-3 rounded-pill active:scale-95 ${
                      unitId === "none"
                        ? "bg-neutral-lightSurface dark:bg-[#1F221F]"
                        : "bg-brand-green"
                    }`}
                    style={{ minWidth: 56 }}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        unitId === "none"
                          ? "text-brand-black dark:text-[#F5F6F4]"
                          : "text-brand-greenDark"
                      }`}
                    >
                      {currentUnit.label}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={14}
                      color={unitId === "none" ? textColor : "#163300"}
                    />
                  </Pressable>
                </View>
              </>
            )}
          </View>

          {parentGoal ? (
            <View className="mt-3.5 px-4 py-3.5 rounded-token-lg bg-white dark:bg-[#0E0F0E] border border-brand-black/10 dark:border-white/[0.08] flex-row items-center justify-between opacity-80">
              <View className="flex-row items-center gap-2.5 flex-1">
                <Ionicons name="git-branch-outline" size={18} color="#163300" />
                <Text
                  className="text-brand-black dark:text-[#F5F6F4] text-[15px] font-semibold flex-1"
                  numberOfLines={1}
                >
                  Parent: {parentGoal.name}
                </Text>
              </View>
              <Ionicons name="lock-closed" size={14} color={muteColor} />
            </View>
          ) : null}

          <View className="mt-3.5">
            {!hasDeadline ? (
              <Pressable
                onPress={() => setHasDeadline(true)}
                className="px-4 py-3.5 rounded-token-lg bg-white dark:bg-[#0E0F0E] border border-dashed border-brand-black/20 dark:border-white/[0.16] flex-row items-center justify-between active:scale-[0.98]"
              >
                <View className="flex-row items-center gap-2.5">
                  <Ionicons name="calendar-outline" size={18} color={dimColor} />
                  <Text className="text-neutral-warmDark dark:text-[#A6ABA4] text-[15px] font-semibold">
                    Add deadline
                  </Text>
                </View>
                <Text className="text-neutral-gray dark:text-[#6E726B] text-[13px] font-semibold">
                  Optional
                </Text>
              </Pressable>
            ) : (
              <View className="bg-white dark:bg-[#0E0F0E] border border-brand-black/10 dark:border-white/[0.08] rounded-[24px] overflow-hidden">
                <View className="flex-row items-center justify-between px-4 py-3.5">
                  <View className="flex-row items-center gap-2.5">
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={dimColor}
                    />
                    <Text className="text-brand-black dark:text-[#F5F6F4] text-[15px] font-semibold">
                      Deadline
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2.5">
                    <Text className="text-brand-greenDark dark:text-brand-green text-[15px] font-semibold">
                      {fmtDate(deadline)}
                    </Text>
                    <Pressable
                      onPress={() => setHasDeadline(false)}
                      hitSlop={6}
                      className="active:opacity-60"
                    >
                      <Ionicons name="close" size={16} color={muteColor} />
                    </Pressable>
                  </View>
                </View>
                <View className="px-3 pb-3">
                  <View className="bg-neutral-lightSurface dark:bg-[#161816] rounded-[18px] border border-brand-black/10 dark:border-white/[0.08] py-2 items-center">
                    <DateTimePicker
                      value={deadline}
                      mode="date"
                      display="inline"
                      accentColor="#163300"
                      themeVariant={isDark ? "dark" : "light"}
                      onChange={(_, d) => {
                        if (d) setDeadline(d);
                      }}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          {error ? (
            <View className="mt-3.5 rounded-token-md bg-semantic-danger/10 px-4 py-3">
              <Text className="text-semantic-danger text-sm font-semibold">
                {error}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View className="px-5 pt-2.5 pb-4 bg-white dark:bg-black">
          <Pressable
            onPress={handleSave}
            disabled={!canSubmit}
            className="h-[54px] rounded-pill bg-brand-green items-center justify-center active:scale-95 disabled:opacity-40"
          >
            <Text className="text-brand-greenDark text-[17px] font-semibold">
              {updateGoal.isPending ? "Saving…" : "Save changes"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <IconSheet
        open={iconSheetOpen}
        value={icon}
        onPick={setIcon}
        onClose={() => setIconSheetOpen(false)}
      />
      <UnitSheet
        open={unitSheetOpen}
        value={unitId}
        units={allUnits}
        onPick={(id) => {
          setUnitId(id);
          setUnitSheetOpen(false);
        }}
        onAddCustom={handleAddCustomUnit}
        onClose={() => setUnitSheetOpen(false)}
      />
    </SafeAreaView>
  );
}
