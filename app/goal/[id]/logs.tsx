import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
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
  isGoodDelta,
  useDeleteGoalLog,
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

  // Logs come sorted DESC by created_at, so the first occurrence
  // of each goal_id is the most recent — only those can be deleted.
  const latestLogIds = useMemo(() => {
    const seen = new Set<string>();
    const ids = new Set<string>();
    for (const l of logs ?? []) {
      if (seen.has(l.goal_id)) continue;
      seen.add(l.goal_id);
      ids.add(l.id);
    }
    return ids;
  }, [logs]);

  const deleteLog = useDeleteGoalLog();

  function confirmDelete(logId: string) {
    Alert.alert(
      "Delete entry?",
      "This will reverse the progress change on the goal.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteLog.mutate(logId),
        },
      ]
    );
  }

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
              const isAdd = log.amount >= 0;
              // Coloring is "good direction" aware: for a weight-loss goal
              // a negative amount is good (green); for savings, positive is good.
              const isGood = source
                ? isGoodDelta(source, log.amount)
                : isAdd;
              const formatted = formatGoalValue(
                Math.abs(log.amount),
                sourceUnit
              );
              return (
                <View
                  key={log.id}
                  className="flex-row items-center justify-between rounded-token-xl border border-brand-black/10 dark:border-white/10 px-4 py-3 bg-white dark:bg-neutral-darkSurface"
                >
                  <View className="gap-1 flex-1 mr-3">
                    <Text
                      className={`font-semibold text-base ${
                        isGood
                          ? "text-brand-black dark:text-white"
                          : "text-semantic-danger"
                      }`}
                    >
                      {isAdd ? "+" : "−"}
                      {formatted}
                    </Text>
                    {isComposite && source ? (
                      <Text
                        className="font-semibold text-brand-greenDark dark:text-brand-green text-xs"
                        numberOfLines={1}
                      >
                        {source.name}
                      </Text>
                    ) : null}
                    {log.reason ? (
                      <Text
                        className="text-neutral-warmDark dark:text-neutral-gray text-xs"
                        numberOfLines={3}
                      >
                        {log.reason}
                      </Text>
                    ) : null}
                    <Text className="font-semibold text-neutral-warmDark dark:text-neutral-gray text-xs">
                      {formatLogDate(log.created_at)}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View
                      className={`w-9 h-9 rounded-pill items-center justify-center ${
                        isGood
                          ? "bg-brand-mint dark:bg-brand-greenDark"
                          : "bg-semantic-danger/10 dark:bg-semantic-danger/20"
                      }`}
                    >
                      <Ionicons
                        name={isAdd ? "add" : "remove"}
                        size={18}
                        color={
                          isGood ? (isDark ? "#9fe870" : "#163300") : "#d03238"
                        }
                      />
                    </View>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: "/goal/[id]/log/[logId]",
                          params: { id, logId: log.id },
                        })
                      }
                      className="w-9 h-9 rounded-pill items-center justify-center active:scale-95 active:bg-brand-black/5 dark:active:bg-white/5"
                    >
                      <Ionicons
                        name="eye-outline"
                        size={16}
                        color={iconColor}
                      />
                    </Pressable>
                    {latestLogIds.has(log.id) ? (
                      <Pressable
                        onPress={() => confirmDelete(log.id)}
                        disabled={deleteLog.isPending}
                        className="w-9 h-9 rounded-pill items-center justify-center active:scale-95 active:bg-semantic-danger/10 disabled:opacity-40"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#d03238"
                        />
                      </Pressable>
                    ) : null}
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
