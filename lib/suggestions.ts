import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export type SuggestionType = "bug" | "feature" | "feedback";

export type NewSuggestionInput = {
  title?: string;
  message: string;
  type: SuggestionType;
};

async function insertSuggestion(input: NewSuggestionInput): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const trimmedTitle = input.title?.trim();
  const { error } = await supabase.from("suggestions").insert({
    user_id: user.id,
    title: trimmedTitle ? trimmedTitle : null,
    message: input.message.trim(),
    type: input.type,
  });
  if (error) throw error;
}

export function useCreateSuggestion() {
  return useMutation({ mutationFn: insertSuggestion });
}
