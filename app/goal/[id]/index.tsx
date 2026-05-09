import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GoalIcon } from "@/components/icon-picker";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  formatGoalRange,
  type Goal,
  getDirectChildren,
  useAddProgress,
  useDeleteGoal,
  useGoal,
  useGoals,
} from "@/lib/goals";

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: goal, isLoading } = useGoal(id);
  const { data: allGoals } = useGoals();
  const addProgress = useAddProgress(id ?? "");
  const deleteGoal = useDeleteGoal();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#ffffff" : "#0e0f0c";
  const placeholderColor = isDark ? "#5a5c59" : "#868685";
  const isComposite = goal?.kind === "composite";

  const children = useMemo(
    () => (id ? getDirectChildren(allGoals ?? [], id) : []),
    [allGoals, id]
  );
  const childStats = useMemo(() => {
    const total = children.length;
    const done = children.filter((c) => c.is_completed).length;
    return { done, total };
  }, [children]);

  const parsedAmount = parseFloat(amount);
  const canSubmit =
    !Number.isNaN(parsedAmount) && parsedAmount > 0 && !addProgress.isPending;

  async function handleAdd() {
    if (!canSubmit) return;
    setError(null);
    try {
      await addProgress.mutateAsync(parsedAmount);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add progress.");
    }
  }

  function handleEdit() {
    if (!goal) return;
    router.push({
      pathname: "/goal/[id]/edit",
      params: { id: goal.id },
    });
  }

  function handleLogs() {
    if (!goal) return;
    router.push({
      pathname: "/goal/[id]/logs",
      params: { id: goal.id },
    });
  }

  function handleDelete() {
    if (!goal) return;
    const childCount = children.length;
    const message =
      childCount > 0
        ? `This will also delete ${childCount} sub-goal${childCount === 1 ? "" : "s"} and their history. This can’t be undone.`
        : "This will also delete its progress history. This can’t be undone.";
    Alert.alert("Delete goal?", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteGoal.mutateAsync(goal.id);
            router.back();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Could not delete goal."
            );
          }
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-white dark:bg-brand-black items-center justify-center"
        edges={["bottom"]}
      >
        <ActivityIndicator color={isDark ? "#9fe870" : "#163300"} />
      </SafeAreaView>
    );
  }

  if (!goal) {
    return (
      <SafeAreaView
        className="flex-1 bg-white dark:bg-brand-black items-center justify-center px-6 gap-3"
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

  const percent = isComposite
    ? childStats.total > 0
      ? (childStats.done / childStats.total) * 100
      : 0
    : Math.min(100, ((goal.progress ?? 0) / (goal.total ?? 1)) * 100);

  function handleAddSubgoal() {
    if (!goal) return;
    router.push({
      pathname: "/goal/new",
      params: { parent_id: goal.id },
    });
  }

  function handleAi() {
    if (!goal) return;
    router.push({
      pathname: "/goal/[id]/ai",
      params: { id: goal.id },
    });
  }

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-brand-black"
      edges={["bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-token-md active:bg-brand-black/5 dark:active:bg-white/5"
          >
            <Ionicons name="close" size={22} color={iconColor} />
          </Pressable>
          <View className="flex-row items-center gap-1">
            <Pressable
              onPress={handleLogs}
              className="flex-row items-center gap-1.5 px-3 py-2 rounded-token-md active:bg-brand-black/5 dark:active:bg-white/5"
            >
              <Ionicons name="time-outline" size={16} color={iconColor} />
              <Text className="font-semibold text-brand-black dark:text-white text-sm">
                Logs
              </Text>
            </Pressable>
            <Pressable
              onPress={handleEdit}
              className="flex-row items-center gap-1.5 px-3 py-2 rounded-token-md active:bg-brand-black/5 dark:active:bg-white/5"
            >
              <Ionicons name="pencil" size={16} color={iconColor} />
              <Text className="font-semibold text-brand-black dark:text-white text-sm">
                Edit
              </Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              disabled={deleteGoal.isPending}
              className="flex-row items-center gap-1.5 px-3 py-2 rounded-token-md active:bg-semantic-danger/10 disabled:opacity-40"
            >
              <Ionicons name="trash-outline" size={16} color="#d03238" />
              <Text className="font-semibold text-semantic-danger text-sm">
                {deleteGoal.isPending ? "Deleting…" : "Delete"}
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerClassName="px-6 pt-2 pb-8 gap-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-3">
            <Text
              className="font-display text-brand-black dark:text-white text-4xl"
              style={{ lineHeight: 0.85 * 36, letterSpacing: -0.5 }}
            >
              {goal.name}.
            </Text>
            <View className="flex-row items-baseline gap-2">
              <Text className="font-semibold text-neutral-warmDark dark:text-neutral-gray text-base">
                {isComposite
                  ? `${childStats.done} / ${childStats.total} sub-goals`
                  : formatGoalRange(
                      goal.progress ?? 0,
                      goal.total ?? 0,
                      goal.unit
                    )}
              </Text>
              <Text className="font-semibold text-brand-greenDark dark:text-brand-green text-sm">
                · {Math.round(percent)}%
              </Text>
            </View>
          </View>

          <View className="h-2 rounded-pill bg-neutral-lightSurface dark:bg-white/10 overflow-hidden">
            <View
              className="h-full bg-brand-green rounded-pill"
              style={{ width: `${percent}%` }}
            />
          </View>

          {isComposite ? (
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-brand-black dark:text-white text-sm">
                  Sub-goals
                </Text>
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={handleAi}
                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-pill border border-brand-green/40 bg-brand-green/10 active:scale-95"
                  >
                    <Ionicons
                      name="sparkles"
                      size={13}
                      color={isDark ? "#9fe870" : "#163300"}
                    />
                    <Text className="text-brand-greenDark dark:text-brand-green text-xs font-semibold">
                      AI
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleAddSubgoal}
                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-pill bg-brand-green active:scale-95"
                  >
                    <Ionicons name="add" size={14} color="#163300" />
                    <Text className="text-brand-greenDark text-xs font-semibold">
                      Add sub-goal
                    </Text>
                  </Pressable>
                </View>
              </View>
              {children.length === 0 ? (
                <View className="rounded-token-md border border-dashed border-brand-black/15 dark:border-white/10 px-4 py-5 items-center">
                  <Text className="font-semibold text-neutral-warmDark dark:text-neutral-gray text-sm text-center">
                    No sub-goals yet.
                  </Text>
                  <Text className="text-neutral-gray dark:text-[#6E726B] text-xs mt-1 text-center">
                    Add one to start tracking progress.
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  {children.map((child) => (
                    <ChildRow key={child.id} goal={child} isDark={isDark} />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View className="gap-3">
              <Text className="font-semibold text-brand-black dark:text-white text-sm">
                Add progress {goal.unit ? `(${goal.unit})` : ""}
              </Text>
              <TextInput
                value={amount}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9.]/g, "");
                  const parts = cleaned.split(".");
                  const safe =
                    parts.length > 1
                      ? `${parts[0]}.${parts.slice(1).join("")}`
                      : cleaned;
                  setAmount(safe);
                }}
                placeholder="100"
                placeholderTextColor={placeholderColor}
                keyboardType="decimal-pad"
                className="rounded-token-md border border-brand-black/10 dark:border-white/10 px-4 py-4 text-brand-black dark:text-white text-[16px] font-semibold"
              />
            </View>
          )}

          {error ? (
            <View className="rounded-token-md bg-semantic-danger/10 px-4 py-3">
              <Text className="text-semantic-danger text-sm font-semibold">
                {error}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        {isComposite ? null : (
        <View className="px-6 pb-4">
          <Pressable
            onPress={handleAdd}
            disabled={!canSubmit}
            className="bg-brand-green rounded-pill py-4 active:scale-95 disabled:opacity-40"
          >
            <Text className="text-brand-greenDark text-center font-semibold text-lg">
              {addProgress.isPending ? "Adding…" : "Add to goal"}
            </Text>
          </Pressable>
        </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChildRow({ goal, isDark }: { goal: Goal; isDark: boolean }) {
  const isChildComposite = goal.kind === "composite";
  const accent = isDark ? "#9fe870" : "#163300";
  const subline = isChildComposite
    ? goal.is_completed
      ? "All sub-goals done"
      : "Composite"
    : goal.is_completed
      ? "Completed"
      : `${goal.progress ?? 0} / ${goal.total ?? 0}${goal.unit ? ` ${goal.unit}` : ""}`;

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/goal/[id]", params: { id: goal.id } })
      }
      className="flex-row items-center gap-3 px-3 py-3 rounded-token-md border border-brand-black/10 dark:border-white/10 bg-white dark:bg-neutral-darkSurface active:scale-[0.98]"
    >
      <View
        className={`w-9 h-9 rounded-pill items-center justify-center ${
          goal.is_completed
            ? "bg-brand-green"
            : "bg-brand-mint dark:bg-brand-greenDark"
        }`}
      >
        <GoalIcon name={goal.icon} size={16} color={accent} />
      </View>
      <View className="flex-1">
        <Text
          className="font-semibold text-brand-black dark:text-white text-[15px]"
          numberOfLines={1}
        >
          {goal.name}
        </Text>
        <Text className="font-semibold text-neutral-warmDark dark:text-neutral-gray text-xs mt-0.5">
          {subline}
        </Text>
      </View>
      {goal.is_completed ? (
        <Ionicons name="checkmark-circle" size={18} color="#054d28" />
      ) : (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={isDark ? "#6E726B" : "#868685"}
        />
      )}
    </Pressable>
  );
}
