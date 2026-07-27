import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
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

import { DEFAULT_ICON, GoalIcon, suggestIcon } from "@/components/icon-picker";
import { IconSheet } from "@/components/sheets/icon-sheet";
import { ParentSheet } from "@/components/sheets/parent-sheet";
import {
  type UnitOption,
  UnitSheet,
} from "@/components/sheets/unit-sheet";
import { useTheme } from "@/components/theme/ThemeProvider";
import {
  deadlineToISODate,
  formatNumber,
  type GoalKind,
  getComposites,
  insertInitialGoalLog,
  sanitizeDecimalInput,
  uploadGoalLogImages,
  useCreateGoal,
  useGoals,
} from "@/lib/goals";
import { usePremium } from "@/lib/iap";
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

export default function NewGoalScreen() {
  const params = useLocalSearchParams<{ parent_id?: string }>();
  const initialParentId = params.parent_id ?? null;

  const [name, setName] = useState("");
  const [start, setStart] = useState("0");
  const [target, setTarget] = useState("");
  const [icon, setIcon] = useState<string>(DEFAULT_ICON);
  const [iconManual, setIconManual] = useState(false);
  const [unitId, setUnitId] = useState<string>("none");
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadline, setDeadline] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [kind, setKind] = useState<GoalKind>("simple");
  const [parentId, setParentId] = useState<string | null>(initialParentId);
  const [iconSheetOpen, setIconSheetOpen] = useState(false);
  const [unitSheetOpen, setUnitSheetOpen] = useState(false);
  const [parentSheetOpen, setParentSheetOpen] = useState(false);
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGoal = useCreateGoal();
  const createUnit = useCreateUnit();
  const { isPro } = usePremium();
  const { data: customUnits } = useUnits();
  const { data: allGoals } = useGoals();
  const composites = useMemo(() => getComposites(allGoals ?? []), [allGoals]);
  const parentGoal = parentId
    ? composites.find((g) => g.id === parentId) ?? null
    : null;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const textColor = isDark ? "#F5F6F4" : "#0e0f0c";
  const dimColor = isDark ? "#A6ABA4" : "#454745";
  const muteColor = isDark ? "#6E726B" : "#868685";

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
    if (iconManual) return;
    const s = suggestIcon(name);
    if (s) setIcon(s);
  }, [name, iconManual]);

  const startNumber = parseFloat(start) || 0;
  const targetNumber = parseFloat(target);
  const targetValid =
    target.trim().length > 0 &&
    !Number.isNaN(targetNumber) &&
    targetNumber >= 0 &&
    targetNumber !== startNumber;
  const decreasing =
    !Number.isNaN(targetNumber) && targetNumber < startNumber;
  const canSubmit =
    name.trim().length > 0 &&
    (kind === "composite" || targetValid) &&
    !createGoal.isPending &&
    !isSaving;

  const currentUnit = allUnits.find((u) => u.id === unitId) ?? allUnits[0];
  const unitForSave = unitId === "none" ? "" : currentUnit.label;
  const isCustomLabel =
    unitForSave !== "" &&
    !PRESET_UNIT_OPTIONS.some((p) => p.label === unitForSave);

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

  async function handleCreate() {
    if (!canSubmit) return;
    setError(null);
    setIsSaving(true);
    try {
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadGoalLogImages(images);
      }
      const notesValue = showNotes && notes.trim() ? notes.trim() : null;
      if (kind === "composite") {
        const goal = await createGoal.mutateAsync({
          kind: "composite",
          name: name.trim(),
          icon,
          deadline: hasDeadline ? deadlineToISODate(deadline) : null,
          notes: notesValue,
          parent_id: parentId,
        });
        if (imageUrls.length > 0) await insertInitialGoalLog(goal.id, imageUrls);
      } else {
        const goal = await createGoal.mutateAsync({
          kind: "simple",
          name: name.trim(),
          total: targetNumber,
          start: startNumber,
          unit: unitForSave,
          icon,
          deadline: hasDeadline ? deadlineToISODate(deadline) : null,
          notes: notesValue,
          parent_id: parentId,
        });
        if (isCustomLabel) createUnit.mutate(unitForSave);
        if (imageUrls.length > 0) await insertInitialGoalLog(goal.id, imageUrls);
      }
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create goal.");
    } finally {
      setIsSaving(false);
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
            New goal
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView
          contentContainerClassName="px-5 pb-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row p-1 mb-3.5 rounded-pill bg-neutral-lightSurface dark:bg-[#161816]">
            {(["simple", "composite"] as const).map((k) => {
              const active = kind === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => setKind(k)}
                  className={`flex-1 h-10 rounded-pill items-center justify-center flex-row gap-1.5 ${
                    active ? "bg-brand-green" : ""
                  }`}
                >
                  <Ionicons
                    name={k === "simple" ? "flag-outline" : "git-branch-outline"}
                    size={14}
                    color={active ? "#163300" : muteColor}
                  />
                  <Text
                    className={`text-sm font-semibold ${
                      active
                        ? "text-brand-greenDark"
                        : "text-neutral-warmDark dark:text-[#A6ABA4]"
                    }`}
                  >
                    {k === "simple" ? "Simple" : "Composite"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

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
                onChangeText={(t) => {
                  setName(t);
                  setIconManual(false);
                }}
                placeholder="Goal name"
                placeholderTextColor={muteColor}
                className="flex-1 text-brand-black dark:text-[#F5F6F4] text-[19px] font-semibold"
                style={{ padding: 0, lineHeight: 23 }}
              />
            </View>

            {kind === "simple" ? (
              <>
                <View className="h-px bg-brand-black/10 dark:bg-white/[0.08]" />
                <View className="gap-2.5">
                  <Text className="text-neutral-gray dark:text-[#6E726B] text-[13px] font-semibold">
                    Target
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View className="flex-1 px-3 py-2 rounded-token-md border border-brand-black/10 dark:border-white/[0.08] bg-neutral-lightSurface dark:bg-[#161816]">
                      <Text className="text-neutral-gray text-[10px] font-semibold uppercase tracking-wider">
                        From
                      </Text>
                      <TextInput
                        value={start}
                        onChangeText={(t) =>
                          setStart(sanitizeDecimalInput(t))
                        }
                        placeholder="0"
                        placeholderTextColor={muteColor}
                        keyboardType="decimal-pad"
                        className="text-brand-black dark:text-[#F5F6F4] text-[22px] font-semibold"
                        style={{ padding: 0 }}
                      />
                    </View>
                    <Text
                      className={`text-[22px] font-semibold w-7 text-center ${
                        decreasing
                          ? "text-semantic-danger"
                          : "text-brand-greenDark dark:text-brand-green"
                      }`}
                    >
                      {decreasing ? "↓" : "→"}
                    </Text>
                    <View
                      className={`flex-1 px-3 py-2 rounded-token-md border bg-neutral-lightSurface dark:bg-[#161816] ${
                        targetValid
                          ? "border-brand-black/20 dark:border-white/[0.16]"
                          : "border-brand-black/10 dark:border-white/[0.08]"
                      }`}
                    >
                      <Text className="text-neutral-gray text-[10px] font-semibold uppercase tracking-wider">
                        Target
                      </Text>
                      <TextInput
                        value={target}
                        onChangeText={(t) =>
                          setTarget(sanitizeDecimalInput(t))
                        }
                        placeholder="0"
                        placeholderTextColor={muteColor}
                        keyboardType="decimal-pad"
                        className="text-brand-black dark:text-[#F5F6F4] text-[22px] font-semibold"
                        style={{ padding: 0 }}
                      />
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="text-neutral-gray dark:text-[#6E726B] text-[12px] font-semibold flex-1">
                      {decreasing
                        ? `Reduce by ${formatNumber(startNumber - targetNumber)}`
                        : !Number.isNaN(targetNumber) && targetNumber > startNumber
                          ? `Build up ${formatNumber(targetNumber - startNumber)}`
                          : " "}
                    </Text>
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
                </View>
              </>
            ) : (
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
            )}
          </View>

          <Pressable
            onPress={() => setParentSheetOpen(true)}
            className="mt-3.5 px-4 py-3.5 rounded-token-lg bg-white dark:bg-[#0E0F0E] border border-brand-black/10 dark:border-white/[0.08] flex-row items-center justify-between active:scale-[0.98]"
          >
            <View className="flex-row items-center gap-2.5 flex-1">
              <Ionicons
                name="git-branch-outline"
                size={18}
                color={parentGoal ? "#163300" : dimColor}
              />
              <Text
                className="text-brand-black dark:text-[#F5F6F4] text-[15px] font-semibold flex-1"
                numberOfLines={1}
              >
                {parentGoal ? `Parent: ${parentGoal.name}` : "Parent goal"}
              </Text>
            </View>
            <Text className="text-neutral-gray dark:text-[#6E726B] text-[13px] font-semibold">
              {parentGoal ? "Change" : "Optional"}
            </Text>
          </Pressable>

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
                      minimumDate={new Date()}
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

          {/* images section */}
          <View className="mt-3.5">
            {images.length === 0 ? (
              <Pressable
                onPress={pickImages}
                className="px-4 py-3.5 rounded-token-lg bg-white dark:bg-[#0E0F0E] border border-dashed border-brand-black/20 dark:border-white/[0.16] flex-row items-center justify-between active:scale-[0.98]"
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
              <View className="bg-white dark:bg-[#0E0F0E] border border-brand-black/10 dark:border-white/[0.08] rounded-[24px] overflow-hidden">
                <View className="flex-row items-center justify-between px-4 py-3.5">
                  <View className="flex-row items-center gap-2.5">
                    <Ionicons name="image-outline" size={18} color={dimColor} />
                    <Text className="text-brand-black dark:text-[#F5F6F4] text-[15px] font-semibold">
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
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}
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
          </View>

          {/* notes section */}
          <View className="mt-3.5">
            {!showNotes ? (
              <Pressable
                onPress={() => setShowNotes(true)}
                className="px-4 py-3.5 rounded-token-lg bg-white dark:bg-[#0E0F0E] border border-dashed border-brand-black/20 dark:border-white/[0.16] flex-row items-center justify-between active:scale-[0.98]"
              >
                <View className="flex-row items-center gap-2.5">
                  <Ionicons name="document-text-outline" size={18} color={dimColor} />
                  <Text className="text-neutral-warmDark dark:text-[#A6ABA4] text-[15px] font-semibold">
                    Add note
                  </Text>
                </View>
                <Text className="text-neutral-gray dark:text-[#6E726B] text-[13px] font-semibold">
                  Optional
                </Text>
              </Pressable>
            ) : (
              <View className="bg-white dark:bg-[#0E0F0E] border border-brand-black/10 dark:border-white/[0.08] rounded-[24px]">
                <View className="flex-row items-center justify-between px-4 py-3.5">
                  <View className="flex-row items-center gap-2.5">
                    <Ionicons name="document-text-outline" size={18} color={dimColor} />
                    <Text className="text-brand-black dark:text-[#F5F6F4] text-[15px] font-semibold">
                      Note
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2.5">
                    <Text className="text-neutral-gray dark:text-[#6E726B] text-[12px] font-semibold">
                      {notes.length}/500
                    </Text>
                    <Pressable
                      onPress={() => { setNotes(""); setShowNotes(false); }}
                      hitSlop={6}
                      className="active:opacity-60"
                    >
                      <Ionicons name="close" size={16} color={muteColor} />
                    </Pressable>
                  </View>
                </View>
                <View className="px-4 pb-4">
                  <TextInput
                    value={notes}
                    onChangeText={(t) => setNotes(t.slice(0, 500))}
                    placeholder="Context, reminders, links…"
                    placeholderTextColor={muteColor}
                    multiline
                    textAlignVertical="top"
                    autoFocus
                    className="text-brand-black dark:text-[#F5F6F4] text-[15px] font-semibold"
                    style={{ minHeight: 96, padding: 0, lineHeight: 22 }}
                  />
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
            onPress={handleCreate}
            disabled={!canSubmit}
            className="h-[54px] rounded-pill bg-brand-green items-center justify-center active:scale-95 disabled:opacity-40"
          >
            <Text className="text-brand-greenDark text-[17px] font-semibold">
              {isSaving
                ? images.length > 0 && !createGoal.isPending
                  ? "Uploading…"
                  : "Creating…"
                : "Create goal"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <IconSheet
        open={iconSheetOpen}
        value={icon}
        onPick={(id) => {
          setIcon(id);
          setIconManual(true);
        }}
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
        customLocked={!isPro}
        onLockedCreateTap={() => {
          setUnitSheetOpen(false);
          router.push("/premium");
        }}
      />
      <ParentSheet
        open={parentSheetOpen}
        value={parentId}
        composites={composites}
        onPick={setParentId}
        onClose={() => setParentSheetOpen(false)}
      />
    </SafeAreaView>
  );
}
