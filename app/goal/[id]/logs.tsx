import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/components/theme/ThemeProvider";
import {
  formatGoalValue,
  getDescendantIds,
  useGoal,
  useGoalLogs,
  useGoalLogsForIds,
  useGoals,
} from "@/lib/goals";

function formatLogDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (sameDay) return `Today · ${time}`;
  if (isYesterday) return `Yesterday · ${time}`;
  return `${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  })} · ${time}`;
}

export default function GoalLogsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: goal } = useGoal(id);
  const { data: allGoals } = useGoals();
  const isComposite = goal?.kind === "composite";

  const descendantIds = useMemo(
    () => (id && isComposite ? getDescendantIds(allGoals ?? [], id) : []),
    [allGoals, id, isComposite]
  );

  const simpleQuery = useGoalLogs(isComposite ? undefined : id);
  const aggregatedQuery = useGoalLogsForIds(
    isComposite ? descendantIds : undefined
  );

  const logs = isComposite ? aggregatedQuery.data : simpleQuery.data;
  const isLoading = isComposite ? aggregatedQuery.isLoading : simpleQuery.isLoading;
  const isFetching = isComposite ? aggregatedQuery.isFetching : simpleQuery.isFetching;
  const error = isComposite ? aggregatedQuery.error : simpleQuery.error;
  const refetch = isComposite ? aggregatedQuery.refetch : simpleQuery.refetch;

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#ffffff" : "#0e0f0c";

  const goalById = useMemo(() => {
    const m = new Map<string, (typeof allGoals extends (infer T)[] | undefined ? T : never)>();
    for (const g of allGoals ?? []) m.set(g.id, g);
    return m;
  }, [allGoals]);

  const count = logs?.length ?? 0;

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
        <Text className="font-semibold text-brand-black dark:text-white text-base">
          Logs
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        contentContainerClassName="px-6 pt-2 pb-8 gap-6"
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
          />
        }
      >
        <View className="gap-3">
          <Text
            className="font-display text-brand-black dark:text-white text-4xl"
            style={{ lineHeight: 0.85 * 36, letterSpacing: -0.5 }}
          >
            {goal?.name ?? "Goal"}.
          </Text>
          <Text className="font-semibold text-neutral-warmDark dark:text-neutral-gray text-base">
            {isLoading
              ? "Loading entries…"
              : isComposite
                ? `${count} ${count === 1 ? "entry" : "entries"} from ${descendantIds.length} sub-goal${descendantIds.length === 1 ? "" : "s"}.`
                : `${count} ${count === 1 ? "entry" : "entries"}.`}
          </Text>
        </View>

        {isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator color={isDark ? "#9fe870" : "#163300"} />
          </View>
        ) : error ? (
          <View className="rounded-token-xl border border-semantic-danger/30 bg-semantic-danger/10 px-4 py-3">
            <Text className="font-semibold text-semantic-danger text-sm">
              Couldn’t load logs. Pull to retry.
            </Text>
          </View>
        ) : count === 0 ? (
          <View className="rounded-token-xl border border-brand-black/10 dark:border-white/10 px-4 py-6 bg-white dark:bg-neutral-darkSurface gap-2 items-start">
            <Text className="font-semibold text-brand-black dark:text-white text-base">
              No entries yet.
            </Text>
            <Text className="font-semibold text-neutral-warmDark dark:text-neutral-gray text-sm">
              {isComposite
                ? "Sub-goals haven’t logged any progress."
                : "Add progress from the goal screen."}
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {logs?.map((log) => {
              const source = goalById.get(log.goal_id);
              const sourceUnit = source?.unit ?? goal?.unit ?? "";
              return (
                <View
                  key={log.id}
                  className="flex-row items-center justify-between rounded-token-xl border border-brand-black/10 dark:border-white/10 px-4 py-3 bg-white dark:bg-neutral-darkSurface"
                >
                  <View className="gap-1 flex-1 mr-3">
                    <Text className="font-semibold text-brand-black dark:text-white text-base">
                      +{formatGoalValue(log.amount, sourceUnit)}
                    </Text>
                    {isComposite && source ? (
                      <Text
                        className="font-semibold text-brand-greenDark dark:text-brand-green text-xs"
                        numberOfLines={1}
                      >
                        {source.name}
                      </Text>
                    ) : null}
                    <Text className="font-semibold text-neutral-warmDark dark:text-neutral-gray text-xs">
                      {formatLogDate(log.created_at)}
                    </Text>
                  </View>
                  <View className="w-9 h-9 rounded-pill bg-brand-mint dark:bg-brand-greenDark items-center justify-center">
                    <Ionicons
                      name="add"
                      size={18}
                      color={isDark ? "#9fe870" : "#163300"}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
