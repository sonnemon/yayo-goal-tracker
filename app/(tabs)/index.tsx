import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GoalCard } from "@/components/goal-card";
import {
  buildGoalTree,
  getCompositeStats,
  getGoalStatus,
  sortGoalsSmart,
  useGoals,
} from "@/lib/goals";

export default function HomeScreen() {
  const { data: goals, isLoading, refetch, error } = useGoals();
  const [refreshing, setRefreshing] = useState(false);
  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }

  const tree = useMemo(() => buildGoalTree(goals ?? []), [goals]);
  const totalCount = tree.length;
  const sorted = useMemo(() => sortGoalsSmart(tree), [tree]);
  const statsById = useMemo(() => {
    const m = new Map<string, { done: number; total: number }>();
    for (const node of tree) m.set(node.id, getCompositeStats(node));
    return m;
  }, [tree]);

  const breakdown = useMemo(() => {
    const counts = { overdue: 0, dueSoon: 0, active: 0, completed: 0 };
    tree.forEach((g) => {
      const s = getGoalStatus(g);
      if (s === "overdue") counts.overdue += 1;
      else if (s === "due-soon") counts.dueSoon += 1;
      else if (s === "active") counts.active += 1;
      else counts.completed += 1;
    });
    return counts;
  }, [tree]);

  const headline = useMemo(() => {
    if (isLoading) return "Loading…";
    if (totalCount === 0) return "Your goals.";
    if (breakdown.overdue > 0 || breakdown.dueSoon > 0)
      return "Your urgent\ngoals.";
    if (breakdown.active > 0) return "Your active\ngoals.";
    return "All goals\ndone.";
  }, [breakdown, isLoading, totalCount]);

  const motivation = useMemo(() => {
    if (isLoading || totalCount === 0) return "";
    if (breakdown.overdue > 0)
      return "Time to clear the backlog. One at a time.";
    if (breakdown.dueSoon > 0)
      return "A few deadlines coming up — you got this.";
    if (breakdown.active > 0)
      return "Keep the momentum going. Small wins add up.";
    return "You crushed it all. Ready for the next one?";
  }, [breakdown, isLoading, totalCount]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-brand-black">
      <ScrollView
        contentContainerClassName="px-6 pt-6 pb-32 gap-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <View className="gap-2">
          <Text
            className="font-display text-brand-black dark:text-white text-4xl"
            style={{ lineHeight: 0.85 * 36, letterSpacing: -0.5 }}
          >
            {headline}
          </Text>
          {motivation ? (
            <Text className="font-semibold text-neutral-warmDark dark:text-neutral-gray text-base">
              {motivation}
            </Text>
          ) : null}
        </View>

        {isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator color="#163300" />
          </View>
        ) : error ? (
          <View className="rounded-token-xl border border-semantic-danger/30 bg-semantic-danger/10 px-4 py-3">
            <Text className="font-semibold text-semantic-danger text-sm">
              Couldn’t load goals. Pull to retry.
            </Text>
          </View>
        ) : totalCount === 0 ? (
          <View className="rounded-token-xl border border-brand-black/10 dark:border-white/10 px-4 py-6 bg-white dark:bg-neutral-darkSurface gap-2 items-start">
            <Text className="font-semibold text-brand-black dark:text-white text-base">
              No goals yet.
            </Text>
            <Text className="font-semibold text-neutral-warmDark dark:text-neutral-gray text-sm">
              Tap the green “+” to create your first one.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {sorted.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                childrenStats={statsById.get(goal.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
