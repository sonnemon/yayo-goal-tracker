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
  start: number;
  progress: number | null;
  unit: string;
  icon: string;
  deadline: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type NewGoalInput = {
  name: string;
  icon: string;
  deadline: string | null;
  notes?: string | null;
  kind?: GoalKind;
  parent_id?: string | null;
  total?: number | null;
  start?: number;
  unit?: string;
};

export type EditGoalInput = {
  name?: string;
  total?: number;
  start?: number;
  unit?: string;
  icon?: string;
  deadline?: string | null;
  notes?: string | null;
};

export type GoalNode = Goal & { children: GoalNode[] };

export type GoalLog = {
  id: string;
  goal_id: string;
  amount: number;
  reason: string | null;
  images: string[] | null;
  created_at: string;
};

export type AddProgressInput = {
  amount: number;
  reason?: string | null;
  images?: string[] | null;
};

const GOALS_KEY = ["goals"] as const;
const goalKey = (id: string) => ["goals", id] as const;
const goalLogsKey = (id: string) => ["goals", id, "logs"] as const;

const SUFFIX_NO_SPACE = new Set(["%"]);

export function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString("en-US");
  return Number(n.toFixed(2)).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

/**
 * Sanitize numeric input strings: keep digits + a single decimal point,
 * cap the decimal portion to `maxDecimals` characters. Preserves a
 * trailing dot ("12.") so the user can keep typing.
 */
export function sanitizeDecimalInput(
  input: string,
  maxDecimals = 2
): string {
  const cleaned = input.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length === 1) return parts[0];
  const intPart = parts[0];
  const decPart = parts.slice(1).join("").slice(0, maxDecimals);
  return `${intPart}.${decPart}`;
}

export function formatGoalValue(n: number, unit: string): string {
  const num = formatNumber(n);
  if (!unit) return num;
  if (SUFFIX_NO_SPACE.has(unit)) return `${num}${unit}`;
  return `${num} ${unit}`;
}

export function formatGoalRange(
  progress: number,
  total: number,
  unit: string
): string {
  const p = formatNumber(progress);
  const t = formatNumber(total);
  if (!unit) return `${p}/${t}`;
  if (SUFFIX_NO_SPACE.has(unit)) return `${p}/${t}${unit}`;
  return `${p}/${t} ${unit}`;
}

// Direction-aware helpers — a goal is "decreasing" when its target is
// below where it started (lose weight, pay debt). Default direction is
// up (savings, reading) and start defaults to 0.

export function isDecreasing(
  goal: Pick<Goal, "start" | "total">
): boolean {
  if (goal.total == null) return false;
  return goal.total < goal.start;
}

export function goalRange(goal: Pick<Goal, "start" | "total">): number {
  const total = goal.total ?? 0;
  return Math.abs(total - goal.start) || 1;
}

export function goalProgressPct(
  goal: Pick<Goal, "start" | "total" | "progress">,
  valueOverride?: number
): number {
  const value = valueOverride ?? goal.progress ?? goal.start;
  const total = goal.total ?? 0;
  const range = Math.abs(total - goal.start) || 1;
  const moved = isDecreasing(goal) ? goal.start - value : value - goal.start;
  return Math.max(-99, Math.min(100, (moved / range) * 100));
}

export function projectedFor(
  goal: Pick<Goal, "start" | "total" | "progress">,
  mode: "add" | "set",
  amount: number
): number {
  if (mode === "set") return amount;
  const current = goal.progress ?? goal.start;
  return isDecreasing(goal) ? current - amount : current + amount;
}

export function isValidProjection(
  goal: Pick<Goal, "start" | "total">,
  projected: number
): boolean {
  // Allow overshoot beyond target; can't cross back through start.
  return isDecreasing(goal)
    ? projected <= goal.start
    : projected >= goal.start;
}

export function isGoodDelta(
  goal: Pick<Goal, "start" | "total">,
  delta: number
): boolean {
  if (delta === 0) return true;
  return isDecreasing(goal) ? delta < 0 : delta > 0;
}

export function quickIncrementsForGoal(
  goal: Pick<Goal, "start" | "total">
): number[] {
  const range = goalRange(goal);
  if (range <= 10) return [0.1, 0.5, 1, 2];
  if (range <= 50) return [1, 5, 10];
  if (range <= 500) return [5, 10, 25, 50];
  if (range <= 5000) return [10, 25, 50, 100];
  return [50, 100, 250, 500];
}

export function formatGoalProgressText(
  goal: Pick<Goal, "start" | "total" | "progress" | "unit">,
  currentOverride?: number
): string {
  const cur = currentOverride ?? goal.progress ?? goal.start;
  const tgt = goal.total ?? 0;
  const sep = isDecreasing(goal) ? "↓" : "/";
  const unit = goal.unit ?? "";
  const sp = unit && !SUFFIX_NO_SPACE.has(unit) ? ` ${unit}` : unit;
  return `${formatNumber(cur)} ${sep} ${formatNumber(tgt)}${unit ? sp : ""}`;
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

export function hasReachedTarget(goal: Goal): boolean {
  if (goal.kind !== "simple") return false;
  if (goal.progress == null || goal.total == null) return false;
  return isDecreasing(goal)
    ? goal.progress <= goal.total
    : goal.progress >= goal.total;
}

export function getGoalStatus(goal: Goal): GoalStatus {
  if (goal.is_completed) return "completed";
  if (hasReachedTarget(goal)) return "completed";
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
  return Math.max(0, Math.min(1, goalProgressPct(goal) / 100));
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
  const startValue = input.start ?? 0;
  const row: Record<string, unknown> =
    kind === "composite"
      ? {
          user_id: user.id,
          name: input.name,
          icon: input.icon,
          deadline: input.deadline,
          notes: input.notes ?? null,
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
          notes: input.notes ?? null,
          kind,
          parent_id: input.parent_id ?? null,
          total: input.total ?? 0,
          start: startValue,
          progress: startValue,
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

export async function uploadGoalLogImages(
  assets: Array<{ uri: string; mimeType?: string | null; base64?: string | null }>
): Promise<string[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const urls: string[] = [];
  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    const ext = asset.mimeType?.split("/")[1] ?? "jpg";
    const path = `${user.id}/${Date.now()}-${i}.${ext}`;
    // fetch().blob() returns 0 bytes in RN — decode base64 to ArrayBuffer instead
    let uploadData: ArrayBuffer;
    if (asset.base64) {
      const binary = atob(asset.base64);
      const bytes = new Uint8Array(binary.length);
      for (let j = 0; j < binary.length; j++) {
        bytes[j] = binary.charCodeAt(j);
      }
      uploadData = bytes.buffer;
    } else {
      uploadData = await fetch(asset.uri).then((r) => r.arrayBuffer());
    }
    const { error } = await supabase.storage
      .from("goal-log-images")
      .upload(path, uploadData, { contentType: asset.mimeType ?? "image/jpeg" });
    if (error) throw error;
    const { data } = supabase.storage
      .from("goal-log-images")
      .getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

export async function insertInitialGoalLog(
  goalId: string,
  images: string[]
): Promise<void> {
  const { error } = await supabase
    .from("goal_logs")
    .insert({ goal_id: goalId, amount: 0, reason: null, images });
  if (error) throw error;
}

async function rpcAddProgress(
  id: string,
  amount: number,
  reason?: string | null,
  images?: string[] | null
): Promise<Goal> {
  const { data, error } = await supabase.rpc("add_goal_progress", {
    goal_id: id,
    amount,
    reason: reason ?? null,
  });
  if (error) throw error;
  const rows = (data as Goal[]) ?? [];
  if (rows.length === 0) throw new Error("Goal not found");
  if (images && images.length > 0) {
    const { data: log } = await supabase
      .from("goal_logs")
      .select("id")
      .eq("goal_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (log) {
      await supabase.from("goal_logs").update({ images }).eq("id", log.id);
    }
  }
  return rows[0];
}

async function deleteGoalRow(id: string): Promise<void> {
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw error;
}

async function rpcDeleteGoalLog(logId: string): Promise<Goal> {
  const { data, error } = await supabase.rpc("delete_goal_log", {
    log_id: logId,
  });
  if (error) throw error;
  const rows = (data as Goal[]) ?? [];
  if (rows.length === 0) throw new Error("Log not found");
  return rows[0];
}

async function fetchGoalLog(logId: string): Promise<GoalLog | null> {
  const { data, error } = await supabase
    .from("goal_logs")
    .select("*")
    .eq("id", logId)
    .maybeSingle();
  if (error) throw error;
  return (data as GoalLog | null) ?? null;
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
    mutationFn: (input: AddProgressInput) =>
      rpcAddProgress(id, input.amount, input.reason ?? null, input.images ?? null),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: GOALS_KEY });
      qc.setQueryData(goalKey(id), data);
      qc.invalidateQueries({ queryKey: goalLogsKey(id) });
    },
  });
}

export function useGoalLog(logId: string | undefined) {
  return useQuery({
    queryKey: logId ? ["goal_log", logId] : ["goal_log", "_none"],
    queryFn: () => fetchGoalLog(logId as string),
    enabled: !!logId,
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

export function useDeleteGoalLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (logId: string) => rpcDeleteGoalLog(logId),
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  });
}
