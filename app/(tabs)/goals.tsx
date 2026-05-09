import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GoalCard } from "@/components/goal-card";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  buildGoalTree,
  type GoalNode,
  type GoalStatus,
  getCompositeStats,
  getGoalStatus,
  sortGoalsSmart,
  useGoals,
} from "@/lib/goals";

type Filter = "all" | "active" | "overdue" | "completed";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "overdue", label: "Overdue" },
  { id: "completed", label: "Done" },
];

function matchesFilter(goal: GoalNode, filter: Filter): boolean {
  if (filter === "all") return true;
  const status = getGoalStatus(goal);
  if (filter === "active") return status === "active" || status === "due-soon";
  if (filter === "overdue") return status === "overdue";
  if (filter === "completed") return status === "completed";
  return true;
}

export default function GoalsScreen() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#ffffff" : "#0e0f0c";
  const placeholderColor = isDark ? "#5a5c59" : "#868685";

  const tree = useMemo(() => buildGoalTree(goals ?? []), [goals]);
  const statsById = useMemo(() => {
    const m = new Map<string, { done: number; total: number }>();
    for (const node of tree) m.set(node.id, getCompositeStats(node));
    return m;
  }, [tree]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: 0,
      active: 0,
      overdue: 0,
      completed: 0,
    };
    tree.forEach((g) => {
      c.all += 1;
      const s: GoalStatus = getGoalStatus(g);
      if (s === "active" || s === "due-soon") c.active += 1;
      else if (s === "overdue") c.overdue += 1;
      else if (s === "completed") c.completed += 1;
    });
    return c;
  }, [tree]);

  const trimmedQuery = query.trim().toLowerCase();
  const filtered: GoalNode[] = useMemo(() => {
    const base = tree.filter((g) => matchesFilter(g, filter));
    const sorted = sortGoalsSmart(base) as GoalNode[];
    if (!trimmedQuery) return sorted;
    return sorted.filter((g) => g.name.toLowerCase().includes(trimmedQuery));
  }, [tree, filter, trimmedQuery]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-brand-black">
      <ScrollView
        contentContainerClassName="px-6 pt-6 pb-32 gap-6"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <View className="gap-3">
          <Text
            className="font-display text-brand-black dark:text-white text-4xl"
            style={{ lineHeight: 0.85 * 36, letterSpacing: -0.5 }}
          >
            Goals.
          </Text>
          <Text className="font-semibold text-neutral-warmDark dark:text-neutral-gray text-base">
            {counts.all} total · {counts.active} active · {counts.overdue} overdue · {counts.completed} done
          </Text>
        </View>

        <View className="flex-row items-center gap-2 rounded-pill border border-brand-black/10 dark:border-white/10 bg-white dark:bg-neutral-darkSurface px-4 py-2.5">
          <Ionicons name="search" size={18} color={iconColor} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search goals"
            placeholderTextColor={placeholderColor}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="never"
            className="flex-1 text-brand-black dark:text-white text-[16px] font-semibold"
          />
          {query ? (
            <Pressable
              onPress={() => setQuery("")}
              hitSlop={8}
              className="active:opacity-60"
            >
              <Ionicons name="close-circle" size={18} color={iconColor} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          {FILTERS.map((f) => {
            const active = filter === f.id;
            const count = counts[f.id];
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                className={`px-3.5 py-2 rounded-pill border flex-row items-center gap-1.5 active:scale-95 ${
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
                  {f.label}
                </Text>
                <Text
                  className={`font-semibold text-xs ${
                    active
                      ? "text-brand-greenDark/70"
                      : "text-neutral-gray"
                  }`}
                >
                  {count}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator color={isDark ? "#9fe870" : "#163300"} />
          </View>
        ) : error ? (
          <View className="rounded-token-xl border border-semantic-danger/30 bg-semantic-danger/10 px-4 py-3">
            <Text className="font-semibold text-semantic-danger text-sm">
              Couldn’t load goals. Pull to retry.
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <View className="rounded-token-xl border border-brand-black/10 dark:border-white/10 px-4 py-6 bg-white dark:bg-neutral-darkSurface">
            <Text className="font-semibold text-neutral-warmDark dark:text-neutral-gray text-sm">
              {trimmedQuery
                ? `No goals match “${query.trim()}”.`
                : "Nothing here yet."}
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {filtered.map((goal) => (
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
