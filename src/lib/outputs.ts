import { supabase } from "@/integrations/supabase/client";
import type { OutputKind } from "./constants";

export type SavedOutput = {
  id: string;
  kind: OutputKind;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export async function saveOutput(input: {
  kind: OutputKind;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("You need to be signed in to save outputs.");
  const { error } = await supabase.from("saved_outputs").insert({
    user_id: auth.user.id,
    kind: input.kind,
    title: input.title.slice(0, 160) || "Untitled",
    content: input.content,
    metadata: (input.metadata ?? {}) as never,
  });
  if (error) throw error;
}

export async function listOutputs() {
  const { data, error } = await supabase
    .from("saved_outputs")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as SavedOutput[];
}

export function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "output"
  );
}
