import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export type AiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AiProposedGoal = {
  name: string;
  kind: "simple" | "composite";
  total: number | null;
  unit: string | null;
  deadline: string | null;
};

export type AiProposal = {
  goals: AiProposedGoal[];
};

type AiContext = {
  parentName?: string;
  parentDeadline?: string | null;
};

async function invokeAi<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("ai-goals", { body });
  if (error) throw error;
  if (!data) throw new Error("Empty response from AI");
  if ((data as { error?: string }).error) {
    throw new Error((data as { error: string }).error);
  }
  return data as T;
}

export function useAiChat() {
  return useMutation({
    mutationFn: async (input: { messages: AiChatMessage[] } & AiContext) => {
      const res = await invokeAi<{ message: string }>({
        mode: "chat",
        messages: input.messages,
        parentName: input.parentName,
        parentDeadline: input.parentDeadline,
      });
      return res.message;
    },
  });
}

export function useAiGenerate() {
  return useMutation({
    mutationFn: async (input: { messages: AiChatMessage[] } & AiContext) => {
      const res = await invokeAi<{ proposal: AiProposal }>({
        mode: "generate",
        messages: input.messages,
        parentName: input.parentName,
        parentDeadline: input.parentDeadline,
      });
      return res.proposal;
    },
  });
}
