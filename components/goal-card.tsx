import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { GoalIcon } from "@/components/icon-picker";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  formatDeadlineRelative,
  formatGoalProgressText,
  type Goal,
  getGoalStatus,
  goalProgressPct,
} from "@/lib/goals";

type Props = {
  goal: Goal;
  childrenStats?: { done: number; total: number };
};

export function GoalCard({ goal, childrenStats }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const status = getGoalStatus(goal);
  const deadlineText = formatDeadlineRelative(goal.deadline);
  const isComposite = goal.kind === "composite";

  const percent = isComposite
    ? childrenStats && childrenStats.total > 0
      ? (childrenStats.done / childrenStats.total) * 100
      : 0
    : goal.total && goal.progress != null
      ? Math.max(0, Math.min(100, goalProgressPct(goal)))
      : 0;

  const isCompleted = status === "completed";
  const iconColor = isCompleted
    ? "#163300"
    : isDark
      ? "#9fe870"
      : "#163300";

  let statusEl: React.ReactNode = null;
  if (isCompleted) {
    statusEl = (
      <View className="flex-row items-center gap-1">
        <Ionicons name="checkmark-circle" size={12} color="#054d28" />
        <Text className="text-semantic-positive dark:text-brand-green text-xs font-semibold">
          Completed
        </Text>
      </View>
    );
  } else if (deadlineText) {
    const colorClass =
      status === "overdue"
        ? "text-semantic-danger"
        : status === "due-soon"
          ? "text-semantic-orange"
          : "text-neutral-warmDark dark:text-neutral-gray";
    statusEl = (
      <Text className={`text-xs font-semibold ${colorClass}`}>
        {deadlineText}
      </Text>
    );
  }

  const headlineText = isComposite
    ? childrenStats && childrenStats.total > 0
      ? `${childrenStats.done} / ${childrenStats.total} sub-goals`
      : "No sub-goals yet"
    : formatGoalProgressText(goal);

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: "/goal/[id]", params: { id: goal.id } })
      }
      className="rounded-token-xl border border-brand-black/10 dark:border-white/10 px-4 py-3 flex-row items-center gap-3 bg-white dark:bg-neutral-darkSurface active:scale-[0.98]"
    >
      <View
        className={`w-10 h-10 rounded-pill items-center justify-center ${
          isCompleted
            ? "bg-brand-green"
            : "bg-brand-mint dark:bg-brand-greenDark"
        }`}
      >
        <GoalIcon name={goal.icon} size={20} color={iconColor} />
      </View>
      <View className="flex-1 gap-1.5">
        <View className="flex-row items-baseline justify-between gap-3">
          <Text
            className="font-semibold text-brand-black dark:text-white text-base flex-1"
            numberOfLines={1}
          >
            {headlineText}
          </Text>
          <View className="flex-row items-center gap-1.5">
            {isComposite ? (
              <Ionicons
                name="git-branch-outline"
                size={12}
                color={isDark ? "#9fe870" : "#163300"}
              />
            ) : null}
            <Text className="font-semibold text-brand-greenDark dark:text-brand-green text-xs">
              {Math.round(percent)}%
            </Text>
          </View>
        </View>
        <View className="flex-row items-baseline justify-between gap-3">
          <Text
            className="font-semibold text-neutral-warmDark dark:text-neutral-gray text-xs flex-1"
            numberOfLines={1}
          >
            {goal.name}
          </Text>
          {statusEl}
        </View>
        <View className="h-1.5 rounded-pill bg-neutral-lightSurface dark:bg-white/10 overflow-hidden mt-1">
          <View
            className="h-full bg-brand-green rounded-pill"
            style={{ width: `${percent}%` }}
          />
        </View>
      </View>
    </Pressable>
  );
}
