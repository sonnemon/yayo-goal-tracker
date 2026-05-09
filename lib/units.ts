import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export type Unit = {
  id: string;
  user_id: string;
  value: string;
  created_at: string;
};

const UNITS_KEY = ["units"] as const;

async function fetchUnits(): Promise<Unit[]> {
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Unit[]) ?? [];
}

async function insertUnit(value: string): Promise<void> {
  const trimmed = value.trim();
  if (!trimmed) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("units")
    .upsert(
      { user_id: user.id, value: trimmed },
      { onConflict: "user_id,value", ignoreDuplicates: true }
    );
  if (error) throw error;
}

export function useUnits() {
  return useQuery({ queryKey: UNITS_KEY, queryFn: fetchUnits });
}

export function useCreateUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: insertUnit,
    onSuccess: () => qc.invalidateQueries({ queryKey: UNITS_KEY }),
  });
}
