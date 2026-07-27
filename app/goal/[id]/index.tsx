import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Alert,
  Image,
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
  formatGoalProgressText,
  formatNumber,
  type Goal,
  getDirectChildren,
  goalProgressPct,
  isDecreasing,
  isGoodDelta,
  isValidProjection,
  projectedFor,
  quickIncrementsForGoal,
  sanitizeDecimalInput,
  uploadGoalLogImages,
  useAddProgress,
  useDeleteGoal,
  useGoal,
  useGoals,
} from "@/lib/goals";

type ProgressMode = "add" | "set";

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: goal, isLoading } = useGoal(id);
  const { data: allGoals } = useGoals();
  const addProgress = useAddProgress(id ?? "");
  const deleteGoal = useDeleteGoal();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#ffffff" : "#0e0f0c";

  const [mode, setMode] = useState<ProgressMode>("add");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Simple goal numbers (direction-aware)
  const decreasing = goal ? isDecreasing(goal) : false;
  const current = goal.progress ?? goal.start ?? 0;
  const target = goal.total ?? 0;
  const num = Number(value) || 0;
  const projected = goal ? projectedFor(goal, mode, num) : 0;
  const delta = projected - current;
  const hasValue = value !== "";
  const validSimple =
    hasValue && goal != null && isValidProjection(goal, projected);

  const currentPct = goal ? Math.max(0, goalProgressPct(goal)) : 0;
  const projPct =
    hasValue && goal ? Math.max(0, goalProgressPct(goal, projected)) : null;
  const showProjected = hasValue && projected !== current;

  const compositePct =
    childStats.total > 0 ? (childStats.done / childStats.total) * 100 : 0;

  // Reason textarea: trigger when user manually sets a value that
  // moves the goal AWAY from the target (regression).
  const isReverse =
    mode === "set" && hasValue && delta !== 0 && !isGoodDelta(goal, delta);

  async function handleAdd() {
    if (!validSimple || !goal) return;
    setError(null);
    setIsUploading(true);
    try {
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadGoalLogImages(images);
      }
      await addProgress.mutateAsync({
        amount: delta,
        reason: isReverse ? reason.trim() || null : null,
        images: imageUrls.length > 0 ? imageUrls : null,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add progress.");
    } finally {
      setIsUploading(false);
    }
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
        {/* header */}
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

        {/* title + progress */}
        <View className="px-6 pb-4">
          <Text
            className="font-display text-brand-black dark:text-white text-4xl"
            style={{ lineHeight: 0.85 * 36, letterSpacing: -0.5 }}
          >
            {goal.name}.
          </Text>

          <View className="flex-row items-center flex-wrap gap-2 mt-3">
            <Text className="font-semibold text-brand-black dark:text-white text-sm">
              {isComposite ? (
                `${childStats.done} / ${childStats.total} sub-goals`
              ) : (
                <>
                  <Text className="text-brand-black dark:text-white">
                    {formatNumber(current)}
                  </Text>
                  <Text className="text-neutral-warmDark dark:text-neutral-gray font-normal">
                    {` ${decreasing ? "↓" : "/"} ${formatNumber(target)}`}
                    {goal.unit ? ` ${goal.unit}` : ""}
                  </Text>
                </>
              )}
            </Text>
            <Text className="text-neutral-warmDark dark:text-neutral-gray text-sm">
              ·
            </Text>
            <Text className="font-semibold text-brand-greenDark dark:text-brand-green text-sm">
              {Math.round(isComposite ? compositePct : currentPct)}%
            </Text>
            {!isComposite && showProjected && projPct != null ? (
              <>
                <Text className="text-neutral-warmDark dark:text-neutral-gray text-sm">
                  →
                </Text>
                <View className="bg-brand-green rounded-pill px-2 py-0.5">
                  <Text className="text-brand-greenDark text-xs font-semibold">
                    {formatNumber(projected)} · {Math.round(projPct)}%
                  </Text>
                </View>
              </>
            ) : null}
          </View>

          <View className="h-1 rounded-pill bg-neutral-lightSurface dark:bg-white/10 mt-3 overflow-hidden">
            {!isComposite && projPct != null && projPct > currentPct ? (
              <View
                className="absolute left-0 top-0 bottom-0 bg-brand-green/40"
                style={{ width: `${projPct}%` }}
              />
            ) : null}
            <View
              className="absolute left-0 top-0 bottom-0 bg-brand-green"
              style={{ width: `${isComposite ? compositePct : currentPct}%` }}
            />
          </View>
        </View>

        <ScrollView
          contentContainerClassName="px-6 pt-4 pb-8 gap-4"
          keyboardShouldPersistTaps="handled"
        >
          {goal.notes ? (
            <View className="rounded-token-xl border border-brand-black/10 dark:border-white/10 bg-white dark:bg-neutral-darkSurface px-4 py-3.5 gap-1">
              <Text className="text-neutral-gray dark:text-[#6E726B] text-[11px] font-semibold uppercase tracking-wider">
                Note
              </Text>
              <Text className="text-brand-black dark:text-white text-[15px] font-semibold leading-snug">
                {goal.notes}
              </Text>
            </View>
          ) : null}
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
            <SimpleProgressForm
              goal={goal}
              mode={mode}
              setMode={setMode}
              value={value}
              setValue={setValue}
              reason={reason}
              setReason={setReason}
              images={images}
              setImages={setImages}
              projected={projected}
              delta={delta}
              hasValue={hasValue}
              isReverse={isReverse}
              isDark={isDark}
            />
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
              disabled={!validSimple || addProgress.isPending || isUploading}
              className="bg-brand-green rounded-pill h-[54px] items-center justify-center active:scale-95 disabled:opacity-40"
            >
              <Text className="text-brand-greenDark text-center font-semibold text-lg">
                {isUploading
                  ? "Uploading…"
                  : addProgress.isPending
                    ? "Saving…"
                    : mode === "set"
                      ? "Update progress"
                      : decreasing
                        ? "Log progress"
                        : "Add to goal"}
              </Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SimpleProgressForm({
  goal,
  mode,
  setMode,
  value,
  setValue,
  reason,
  setReason,
  images,
  setImages,
  projected,
  delta,
  hasValue,
  isReverse,
  isDark,
}: {
  goal: Goal;
  mode: ProgressMode;
  setMode: (m: ProgressMode) => void;
  value: string;
  setValue: (v: string) => void;
  reason: string;
  setReason: (v: string) => void;
  images: ImagePicker.ImagePickerAsset[];
  setImages: React.Dispatch<React.SetStateAction<ImagePicker.ImagePickerAsset[]>>;
  projected: number;
  delta: number;
  hasValue: boolean;
  isReverse: boolean;
  isDark: boolean;
}) {
  const decreasing = isDecreasing(goal);
  const current = goal.progress ?? goal.start ?? 0;
  const target = goal.total ?? 0;
  const incs = quickIncrementsForGoal(goal);
  const placeholderColor = isDark ? "#5a5c59" : "#868685";
  const dimColor = isDark ? "#A6ABA4" : "#454745";
  const muteColor = isDark ? "#6E726B" : "#868685";

  const deltaWord = decreasing ? "Subtract" : "Add";
  const deltaSym = decreasing ? "−" : "+";

  async function pickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to photos to attach images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets]);
    }
  }
  const goodDelta = isGoodDelta(goal, delta);

  function onChangeValue(text: string) {
    setValue(sanitizeDecimalInput(text));
  }

  function onChip(n: number) {
    if (mode === "add") {
      setValue(String(n));
    } else {
      // 'set total' chip: jump from current toward target by n, capped at target
      const next = decreasing
        ? Math.max(target, current - n)
        : Math.min(target, current + n);
      setValue(String(next));
    }
  }

  function onReachedChip() {
    setValue(String(target));
  }

  return (
    <View className="gap-4">
      {/* segmented toggle */}
      <View className="flex-row p-1 rounded-token-md border border-brand-black/10 dark:border-white/10 bg-neutral-lightSurface dark:bg-neutral-darkSurface">
        {(
          [
            { id: "add" as const, label: deltaWord, sym: deltaSym },
            { id: "set" as const, label: "Set total", sym: "=" },
          ]
        ).map((opt) => {
          const selected = mode === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => setMode(opt.id)}
              className={`flex-1 h-10 flex-row items-center justify-center gap-1.5 rounded-token-sm ${
                selected
                  ? "bg-white dark:bg-brand-black"
                  : "bg-transparent"
              }`}
            >
              <Text
                className={`text-base font-semibold ${
                  selected
                    ? "text-brand-greenDark dark:text-brand-green"
                    : "text-neutral-gray"
                }`}
              >
                {opt.sym}
              </Text>
              <Text
                className={`text-sm font-semibold ${
                  selected
                    ? "text-brand-black dark:text-white"
                    : "text-neutral-warmDark dark:text-neutral-gray"
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* big input */}
      <View className="relative">
        <TextInput
          value={value}
          onChangeText={onChangeValue}
          placeholder={mode === "add" ? "0" : formatNumber(current)}
          placeholderTextColor={placeholderColor}
          keyboardType="decimal-pad"
          autoFocus
          className="rounded-token-xl border border-brand-black/10 dark:border-white/10 bg-white dark:bg-neutral-darkSurface text-brand-black dark:text-white text-center font-display"
          style={{
            height: 84,
            fontSize: 44,
            lineHeight: 52,
            paddingHorizontal: 80,
          }}
        />
        <View
          pointerEvents="none"
          className="absolute left-5 top-0 bottom-0 items-center justify-center"
        >
          <Text className="text-neutral-gray font-semibold text-2xl">
            {mode === "add" ? deltaSym : "="}
          </Text>
        </View>
        {goal.unit ? (
          <View
            pointerEvents="none"
            className="absolute right-5 top-0 bottom-0 items-center justify-center"
          >
            <Text className="text-neutral-warmDark dark:text-neutral-gray font-semibold text-sm">
              {goal.unit}
            </Text>
          </View>
        ) : null}
      </View>

      {/* math preview */}
      {hasValue ? (
        <View className="flex-row items-center justify-center gap-2 px-3 py-2.5 rounded-token-md bg-neutral-lightSurface dark:bg-neutral-darkSurface border border-brand-black/10 dark:border-white/10">
          <Text className="text-neutral-warmDark dark:text-neutral-gray text-sm">
            {formatNumber(current)}
          </Text>
          <Text className="text-neutral-gray text-sm">→</Text>
          <Text className="text-brand-black dark:text-white text-sm font-semibold">
            {formatNumber(projected)}
          </Text>
          <Text
            className={`text-sm font-semibold ${
              goodDelta
                ? "text-brand-greenDark dark:text-brand-green"
                : "text-semantic-danger"
            }`}
          >
            ({delta >= 0 ? "+" : ""}
            {formatNumber(delta)})
          </Text>
        </View>
      ) : null}

      {/* reason — when value moves AWAY from target */}
      {isReverse ? (
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-semantic-danger text-[11px] font-semibold uppercase tracking-wider">
              {decreasing ? "Why is it going up?" : "Why is it going down?"}
            </Text>
            <Text className="text-neutral-gray text-[11px] font-semibold">
              Optional
            </Text>
          </View>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Miscount, reset, lost progress…"
            placeholderTextColor={isDark ? "#5a5c59" : "#868685"}
            multiline
            numberOfLines={3}
            maxLength={280}
            textAlignVertical="top"
            className="rounded-token-md border border-semantic-danger/30 bg-semantic-danger/5 dark:bg-semantic-danger/10 px-4 py-3 text-brand-black dark:text-white text-[15px] font-semibold"
            style={{ minHeight: 84 }}
          />
        </View>
      ) : null}

      {/* photos section */}
      {images.length === 0 ? (
        <Pressable
          onPress={pickImages}
          className="px-4 py-3.5 rounded-token-xl border border-dashed border-brand-black/20 dark:border-white/[0.16] flex-row items-center justify-between active:scale-[0.98] bg-white dark:bg-neutral-darkSurface"
        >
          <View className="flex-row items-center gap-2.5">
            <Ionicons name="image-outline" size={18} color={dimColor} />
            <Text className="text-neutral-warmDark dark:text-[#A6ABA4] text-[15px] font-semibold">
              Add photos
            </Text>
          </View>
          <Text className="text-neutral-gray dark:text-[#6E726B] text-[13px] font-semibold">
            Optional
          </Text>
        </Pressable>
      ) : (
        <View className="rounded-token-xl border border-brand-black/10 dark:border-white/10 bg-white dark:bg-neutral-darkSurface overflow-hidden">
          <View className="flex-row items-center justify-between px-4 py-3">
            <View className="flex-row items-center gap-2.5">
              <Ionicons name="image-outline" size={18} color={dimColor} />
              <Text className="text-brand-black dark:text-white text-[15px] font-semibold">
                Photos ({images.length})
              </Text>
            </View>
            <Pressable
              onPress={() => setImages([])}
              hitSlop={6}
              className="active:opacity-60"
            >
              <Ionicons name="close" size={16} color={muteColor} />
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 14, gap: 8 }}
          >
            {images.map((img, i) => (
              <View key={i} className="relative">
                <Image
                  source={{ uri: img.uri }}
                  style={{ width: 72, height: 72, borderRadius: 10 }}
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() =>
                    setImages((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-pill bg-brand-black/70 items-center justify-center"
                >
                  <Ionicons name="close" size={11} color="#F5F6F4" />
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={pickImages}
              className="w-[72px] h-[72px] rounded-token-md border border-dashed border-brand-black/20 dark:border-white/[0.16] items-center justify-center active:scale-95"
            >
              <Ionicons name="add" size={22} color={dimColor} />
            </Pressable>
          </ScrollView>
        </View>
      )}

      {/* quick chips */}
      <View className="gap-2">
        <Text className="text-neutral-gray text-[11px] font-semibold uppercase tracking-wider">
          {mode === "add"
            ? `Quick ${deltaWord.toLowerCase()}`
            : "Quick jump to"}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {incs.map((n) => (
            <Pressable
              key={n}
              onPress={() => onChip(n)}
              className="h-9 px-3.5 rounded-pill items-center justify-center bg-neutral-lightSurface dark:bg-neutral-darkSurface border border-brand-black/10 dark:border-white/10 active:scale-95"
            >
              <Text className="text-brand-black dark:text-white text-sm font-semibold">
                {deltaSym}
                {formatNumber(n)}
              </Text>
            </Pressable>
          ))}
          {mode === "set" ? (
            <Pressable
              onPress={onReachedChip}
              className="h-9 px-3.5 rounded-pill items-center justify-center border border-dashed border-brand-green/60 active:scale-95"
            >
              <Text className="text-brand-greenDark dark:text-brand-green text-sm font-semibold">
                Reached · {formatNumber(target)}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
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
      : formatGoalProgressText(goal);

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
