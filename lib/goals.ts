import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export type GoalKind = "simple" | "composite";

export type Goal = {
  id: string;
  user_id: string;
  name: string;
  kind: GoalKind;
  parent_id: string | null;
  is_completed: boolean;
  total: number | null;
  progress: number | null;
  unit: string;
  icon: string;
  deadline: string | null;
  created_at: string;
  updated_at: string;
};

export type NewGoalInput = {
  name: string;
  icon: string;
  deadline: string | null;
  kind?: GoalKind;
  parent_id?: string | null;
  total?: number | null;
  unit?: string;
};

export type EditGoalInput = {
  name?: string;
  total?: number;
  unit?: string;
  icon?: string;
  deadline?: string | null;
};

export type GoalNode = Goal & { children: GoalNode[] };

export type GoalLog = {
  id: string;
  goal_id: string;
  amount: number;
  created_at: string;
};

const GOALS_KEY = ["goals"] as const;
const goalKey = (id: string) => ["goals", id] as const;
const goalLogsKey = (id: string) => ["goals", id, "logs"] as const;

const SUFFIX_NO_SPACE = new Set(["%"]);

export function formatGoalValue(n: number, unit: string): string {
  const num = n.toLocaleString("en-US");
  if (!unit) return num;
  if (SUFFIX_NO_SPACE.has(unit)) return `${num}${unit}`;
  return `${num} ${unit}`;
}

export function formatGoalRange(
  progress: number,
  total: number,
  unit: string
): string {
  const p = progress.toLocaleString("en-US");
  const t = total.toLocaleString("en-US");
  if (!unit) return `${p}/${t}`;
  if (SUFFIX_NO_SPACE.has(unit)) return `${p}/${t}${unit}`;
  return `${p}/${t} ${unit}`;
}

export function formatDeadline(date: string | null): string | null {
  if (!date) return null;
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
}

export function deadlineToISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type GoalStatus = "active" | "due-soon" | "overdue" | "completed";

const DUE_SOON_DAYS = 7;

export function daysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${deadline}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getGoalStatus(goal: Goal): GoalStatus {
  if (goal.is_completed) return "completed";
  if (
    goal.kind === "simple" &&
    goal.progress != null &&
    goal.total != null &&
    goal.progress >= goal.total
  ) {
    return "completed";
  }
  const days = daysUntilDeadline(goal.deadline);
  if (days === null) return "active";
  if (days < 0) return "overdue";
  if (days <= DUE_SOON_DAYS) return "due-soon";
  return "active";
}

export function formatDeadlineRelative(
  deadline: string | null
): string | null {
  const days = daysUntilDeadline(deadline);
  if (days === null) return null;
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= DUE_SOON_DAYS) return `in ${days}d`;
  return formatDeadline(deadline);
}

const STATUS_PRIORITY: Record<GoalStatus, number> = {
  overdue: 0,
  "due-soon": 1,
  active: 2,
  completed: 3,
};

function progressRatio(goal: Goal): number {
  if (goal.kind !== "simple" || goal.total == null || goal.progress == null) {
    return goal.is_completed ? 1 : 0;
  }
  return goal.total > 0 ? goal.progress / goal.total : 0;
}

export function sortGoalsSmart(goals: Goal[]): Goal[] {
  return [...goals].sort((a, b) => {
    const sa = getGoalStatus(a);
    const sb = getGoalStatus(b);
    if (sa !== sb) return STATUS_PRIORITY[sa] - STATUS_PRIORITY[sb];
    return progressRatio(b) - progressRatio(a);
  });
}

export function buildGoalTree(goals: Goal[]): GoalNode[] {
  const byId = new Map<string, GoalNode>();
  for (const g of goals) byId.set(g.id, { ...g, children: [] });
  const roots: GoalNode[] = [];
  for (const node of byId.values()) {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function getCompositeStats(node: GoalNode): { done: number; total: number } {
  const total = node.children.length;
  const done = node.children.filter((c) => c.is_completed).length;
  return { done, total };
}

export function getComposites(goals: Goal[]): Goal[] {
  return goals.filter((g) => g.kind === "composite");
}

export function getDirectChildren(goals: Goal[], parentId: string): Goal[] {
  return goals.filter((g) => g.parent_id === parentId);
}

export function getDescendantIds(goals: Goal[], rootId: string): string[] {
  const byParent = new Map<string, string[]>();
  for (const g of goals) {
    if (!g.parent_id) continue;
    const arr = byParent.get(g.parent_id);
    if (arr) arr.push(g.id);
    else byParent.set(g.parent_id, [g.id]);
  }
  const out: string[] = [];
  const stack = [rootId];
  while (stack.length) {
    const cur = stack.pop()!;
    const kids = byParent.get(cur);
    if (!kids) continue;
    for (const k of kids) {
      out.push(k);
      stack.push(k);
    }
  }
  return out;
}

async function fetchGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Goal[]) ?? [];
}

async function fetchGoal(id: string): Promise<Goal | null> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Goal | null) ?? null;
}

async function insertGoal(input: NewGoalInput): Promise<Goal> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const kind: GoalKind = input.kind ?? "simple";
  const row: Record<string, unknown> =
    kind === "composite"
      ? {
          user_id: user.id,
          name: input.name,
          icon: input.icon,
          deadline: input.deadline,
          kind,
          parent_id: input.parent_id ?? null,
          total: null,
          progress: null,
          unit: "",
        }
      : {
          user_id: user.id,
          name: input.name,
          icon: input.icon,
          deadline: input.deadline,
          kind,
          parent_id: input.parent_id ?? null,
          total: input.total ?? 0,
          unit: input.unit ?? "",
        };
  const { data, error } = await supabase
    .from("goals")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return data as Goal;
}

async function patchGoal(id: string, patch: EditGoalInput): Promise<Goal> {
  const { data, error } = await supabase
    .from("goals")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Goal;
}

async function rpcAddProgress(id: string, amount: number): Promise<Goal> {
  const { data, error } = await supabase.rpc("add_goal_progress", {
    goal_id: id,
    amount,
  });
  if (error) throw error;
  const rows = (data as Goal[]) ?? [];
  if (rows.length === 0) throw new Error("Goal not found");
  return rows[0];
}

async function deleteGoalRow(id: string): Promise<void> {
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw error;
}

async function fetchGoalLogs(goalId: string): Promise<GoalLog[]> {
  const { data, error } = await supabase
    .from("goal_logs")
    .select("*")
    .eq("goal_id", goalId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as GoalLog[]) ?? [];
}

async function fetchLogsForGoals(goalIds: string[]): Promise<GoalLog[]> {
  if (goalIds.length === 0) return [];
  const { data, error } = await supabase
    .from("goal_logs")
    .select("*")
    .in("goal_id", goalIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as GoalLog[]) ?? [];
}

export function useGoals() {
  return useQuery({ queryKey: GOALS_KEY, queryFn: fetchGoals });
}

export function useGoal(id: string | undefined) {
  return useQuery({
    queryKey: id ? goalKey(id) : ["goals", "_none"],
    queryFn: () => fetchGoal(id as string),
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: insertGoal,
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  });
}

export function useCreateGoalsBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inputs: NewGoalInput[]) => {
      const created: Goal[] = [];
      for (const input of inputs) {
        created.push(await insertGoal(input));
      }
      return created;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  });
}

export function useUpdateGoal(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: EditGoalInput) => patchGoal(id, patch),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: GOALS_KEY });
      qc.setQueryData(goalKey(id), data);
    },
  });
}

export function useAddProgress(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) => rpcAddProgress(id, amount),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: GOALS_KEY });
      qc.setQueryData(goalKey(id), data);
      qc.invalidateQueries({ queryKey: goalLogsKey(id) });
    },
  });
}

export function useGoalLogs(id: string | undefined) {
  return useQuery({
    queryKey: id ? goalLogsKey(id) : ["goals", "_none", "logs"],
    queryFn: () => fetchGoalLogs(id as string),
    enabled: !!id,
  });
}

export function useGoalLogsForIds(ids: string[] | undefined) {
  const sortedKey = (ids ?? []).slice().sort().join(",");
  const enabled = !!ids && ids.length > 0;
  return useQuery({
    queryKey: ["goals", "logs-for", sortedKey],
    queryFn: () => fetchLogsForGoals(ids as string[]),
    enabled,
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteGoalRow,
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  });
}
