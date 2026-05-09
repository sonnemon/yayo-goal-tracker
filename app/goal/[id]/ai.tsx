import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/components/theme/ThemeProvider";
import {
  type AiChatMessage,
  type AiProposal,
  type AiProposedGoal,
  useAiChat,
  useAiGenerate,
} from "@/lib/ai";
import { useCreateGoalsBatch, useGoal } from "@/lib/goals";

export default function GoalAiScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: goal } = useGoal(id);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const iconColor = isDark ? "#ffffff" : "#0e0f0c";
  const placeholderColor = isDark ? "#5a5c59" : "#868685";

  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<AiProposal | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const chatMutation = useAiChat();
  const generateMutation = useAiGenerate();
  const createBatch = useCreateGoalsBatch();
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (messages.length === 0 && goal) {
      setMessages([
        {
          role: "assistant",
          content: `Let's break down "${goal.name}" into actionable sub-goals. Tell me your timeframe, scope, or anything specific you want to focus on. When you're ready, tap "Generate sub-goals".`,
        },
      ]);
    }
  }, [goal, messages.length]);

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [messages.length, chatMutation.isPending]);

  const canSend = input.trim().length > 0 && !chatMutation.isPending;
  const userTurns = messages.filter((m) => m.role === "user").length;
  const canGenerate =
    userTurns > 0 && !generateMutation.isPending && !chatMutation.isPending;

  async function handleSend() {
    if (!canSend) return;
    setError(null);
    const userMsg: AiChatMessage = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    try {
      const reply = await chatMutation.mutateAsync({
        messages: next,
        parentName: goal?.name,
        parentDeadline: goal?.deadline ?? null,
      });
      setMessages((curr) => [...curr, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the AI.");
    }
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    setError(null);
    try {
      const result = await generateMutation.mutateAsync({
        messages,
        parentName: goal?.name,
        parentDeadline: goal?.deadline ?? null,
      });
      setProposal(result);
      setSelected(new Set(result.goals.map((_, i) => i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate goals.");
    }
  }

  function toggleSelected(i: number) {
    setSelected((curr) => {
      const next = new Set(curr);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function handleCreateAll() {
    if (!proposal || !goal) return;
    setError(null);
    const picks = proposal.goals.filter((_, i) => selected.has(i));
    if (picks.length === 0) {
      setProposal(null);
      return;
    }
    try {
      await createBatch.mutateAsync(
        picks.map((p) => ({
          name: p.name,
          icon: "flag",
          deadline: p.deadline ?? null,
          kind: p.kind,
          parent_id: goal.id,
          total: p.kind === "simple" ? p.total ?? 1 : null,
          unit: p.kind === "simple" ? p.unit ?? "" : "",
        }))
      );
      setProposal(null);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create goals.");
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
        <View className="flex-row items-center justify-between px-6 py-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-token-md active:bg-brand-black/5 dark:active:bg-white/5"
          >
            <Ionicons name="close" size={22} color={iconColor} />
          </Pressable>
          <View className="flex-row items-center gap-2">
            <Ionicons
              name="sparkles"
              size={16}
              color={isDark ? "#9fe870" : "#163300"}
            />
            <Text className="font-semibold text-brand-black dark:text-white text-base">
              AI assistant
            </Text>
          </View>
          <View className="w-10" />
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerClassName="px-5 pt-2 pb-4 gap-3"
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} isDark={isDark} />
          ))}
          {chatMutation.isPending ? (
            <View className="self-start max-w-[85%] px-4 py-3 rounded-[20px] bg-neutral-lightSurface dark:bg-[#161816]">
              <ActivityIndicator color={isDark ? "#9fe870" : "#163300"} />
            </View>
          ) : null}
          {error ? (
            <View className="rounded-token-md bg-semantic-danger/10 px-4 py-3">
              <Text className="text-semantic-danger text-sm font-semibold">
                {error}
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View className="px-5 pt-2 pb-2">
          <Pressable
            onPress={handleGenerate}
            disabled={!canGenerate}
            className="h-11 rounded-pill bg-brand-green flex-row items-center justify-center gap-2 active:scale-95 disabled:opacity-40"
          >
            {generateMutation.isPending ? (
              <ActivityIndicator color="#163300" />
            ) : (
              <>
                <Ionicons name="sparkles" size={16} color="#163300" />
                <Text className="text-brand-greenDark text-sm font-semibold">
                  Generate sub-goals
                </Text>
              </>
            )}
          </Pressable>
        </View>

        <View className="px-5 pb-3 pt-1 flex-row items-end gap-2">
          <View className="flex-1 rounded-[24px] bg-neutral-lightSurface dark:bg-[#161816] border border-brand-black/10 dark:border-white/[0.08] px-4 py-2.5">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Message the AI…"
              placeholderTextColor={placeholderColor}
              multiline
              className="text-brand-black dark:text-white text-[15px] font-semibold"
              style={{ padding: 0, maxHeight: 120 }}
            />
          </View>
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            className="w-11 h-11 rounded-pill bg-brand-green items-center justify-center active:scale-95 disabled:opacity-40"
          >
            <Ionicons name="arrow-up" size={20} color="#163300" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ProposalSheet
        proposal={proposal}
        selected={selected}
        onToggle={toggleSelected}
        onCreate={handleCreateAll}
        onClose={() => setProposal(null)}
        isCreating={createBatch.isPending}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}

function MessageBubble({
  message,
  isDark,
}: {
  message: AiChatMessage;
  isDark: boolean;
}) {
  const isUser = message.role === "user";
  return (
    <View
      className={`max-w-[85%] px-4 py-3 rounded-[20px] ${
        isUser
          ? "self-end bg-brand-green"
          : "self-start bg-neutral-lightSurface dark:bg-[#161816]"
      }`}
    >
      <Text
        className={`text-[15px] font-semibold ${
          isUser
            ? "text-brand-greenDark"
            : "text-brand-black dark:text-[#F5F6F4]"
        }`}
        style={{ lineHeight: 21 }}
      >
        {message.content}
      </Text>
    </View>
  );
}

function ProposalSheet({
  proposal,
  selected,
  onToggle,
  onCreate,
  onClose,
  isCreating,
  isDark,
}: {
  proposal: AiProposal | null;
  selected: Set<number>;
  onToggle: (i: number) => void;
  onCreate: () => void;
  onClose: () => void;
  isCreating: boolean;
  isDark: boolean;
}) {
  const accent = isDark ? "#9fe870" : "#163300";
  const open = !!proposal;
  const count = selected.size;

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable onPress={onClose} className="flex-1 bg-black/55" />
        <View className="bg-white dark:bg-[#0E0F0E] border-t border-brand-black/10 dark:border-white/[0.08] rounded-t-[28px] max-h-[85%]">
          <View className="self-center w-9 h-1 bg-brand-black/20 dark:bg-white/[0.16] rounded-sm mt-2 mb-1.5" />
          <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
            <View>
              <Text className="text-brand-black dark:text-[#F5F6F4] text-[17px] font-semibold">
                Proposed sub-goals
              </Text>
              <Text className="text-neutral-gray dark:text-[#6E726B] text-[13px]">
                Tap to include or skip.
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={accent} />
            </Pressable>
          </View>

          <ScrollView contentContainerClassName="px-5 pb-3 gap-2">
            {(proposal?.goals ?? []).map((g, i) => (
              <ProposedRow
                key={i}
                goal={g}
                checked={selected.has(i)}
                onToggle={() => onToggle(i)}
                isDark={isDark}
              />
            ))}
          </ScrollView>

          <View className="px-5 pt-2 pb-5 border-t border-brand-black/10 dark:border-white/[0.08]">
            <Pressable
              onPress={onCreate}
              disabled={count === 0 || isCreating}
              className="h-[54px] rounded-pill bg-brand-green items-center justify-center active:scale-95 disabled:opacity-40"
            >
              <Text className="text-brand-greenDark text-[17px] font-semibold">
                {isCreating
                  ? "Creating…"
                  : count === 0
                    ? "Pick at least one"
                    : `Create ${count} sub-goal${count === 1 ? "" : "s"}`}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ProposedRow({
  goal,
  checked,
  onToggle,
  isDark,
}: {
  goal: AiProposedGoal;
  checked: boolean;
  onToggle: () => void;
  isDark: boolean;
}) {
  const accent = isDark ? "#9fe870" : "#163300";
  const isComposite = goal.kind === "composite";
  const subline = isComposite
    ? "Composite (container)"
    : `Target ${goal.total ?? 0}${goal.unit ? ` ${goal.unit}` : ""}`;

  return (
    <Pressable
      onPress={onToggle}
      className={`flex-row items-center gap-3 px-4 py-3 rounded-token-lg border active:scale-[0.98] ${
        checked
          ? "bg-brand-green/10 border-brand-green"
          : "bg-neutral-lightSurface dark:bg-[#161816] border-brand-black/10 dark:border-white/[0.08]"
      }`}
    >
      <View
        className={`w-6 h-6 rounded-pill items-center justify-center border-2 ${
          checked
            ? "bg-brand-green border-brand-green"
            : "border-brand-black/25 dark:border-white/25"
        }`}
      >
        {checked ? (
          <Ionicons name="checkmark" size={14} color="#163300" />
        ) : null}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          {isComposite ? (
            <Ionicons name="git-branch-outline" size={13} color={accent} />
          ) : null}
          <Text
            className="font-semibold text-brand-black dark:text-[#F5F6F4] text-[15px] flex-1"
            numberOfLines={2}
          >
            {goal.name}
          </Text>
        </View>
        <Text className="font-semibold text-neutral-warmDark dark:text-[#A6ABA4] text-xs mt-1">
          {subline}
          {goal.deadline ? ` · by ${goal.deadline}` : ""}
        </Text>
      </View>
    </Pressable>
  );
}
