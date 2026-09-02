import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookmarkCheck, Download, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { MarkdownView } from "@/components/ai/ai-output";
import { PageHeader } from "@/components/app/app-shell";
import { CopyButton } from "@/components/common/copy-button";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { OUTPUT_KINDS, type OutputKind } from "@/lib/constants";
import { downloadText, listOutputs, slugify, type SavedOutput } from "@/lib/outputs";
import { signedVisualUrl } from "@/lib/visuals";
import { cn } from "@/lib/utils";
import { SelectField } from "./email";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({
    meta: [
      { title: "Saved Outputs — ALLORAXIA" },
      {
        name: "description",
        content:
          "Search, filter, edit and export every AI output you saved: emails, meeting summaries, research briefings and plans.",
      },
      { property: "og:title", content: "Saved Outputs — ALLORAXIA" },
      { property: "og:description", content: "Your searchable library of saved AI outputs." },
    ],
  }),
  component: SavedPage,
});

const FILTERS = ["All", ...Object.values(OUTPUT_KINDS)];
const kindByLabel = Object.fromEntries(
  Object.entries(OUTPUT_KINDS).map(([key, label]) => [label, key as OutputKind]),
);

function VisualPreview({ path, title }: { path: string; title: string }) {
  const urlQuery = useQuery({
    queryKey: ["visual-url", path],
    queryFn: () => signedVisualUrl(path),
    staleTime: 50 * 60 * 1000,
  });
  if (!urlQuery.data) return null;
  return (
    <img
      src={urlQuery.data}
      alt={title}
      className="mb-3 w-full max-w-md rounded-lg border border-border"
      loading="lazy"
    />
  );
}

function SavedPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [editing, setEditing] = useState<SavedOutput | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");

  const outputsQuery = useQuery({
    queryKey: ["outputs", user?.id],
    enabled: !!user,
    queryFn: listOutputs,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_outputs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outputs"] });
      toast.success("Deleted");
    },
    onError: (caught: Error) => toast.error(caught.message),
  });

  const update = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await supabase
        .from("saved_outputs")
        .update({ title: draftTitle || "Untitled", content: draftContent })
        .eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["outputs"] });
      toast.success("Changes saved");
    },
    onError: (caught: Error) => toast.error(caught.message),
  });

  const items = useMemo(() => {
    const all = outputsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    return all.filter((item) => {
      const matchesKind = filter === "All" || item.kind === kindByLabel[filter];
      const matchesTerm =
        !term ||
        item.title.toLowerCase().includes(term) ||
        item.content.toLowerCase().includes(term);
      return matchesKind && matchesTerm;
    });
  }, [outputsQuery.data, search, filter]);

  return (
    <>
      <PageHeader
        title="Saved Outputs"
        description="Everything you kept, in one searchable library. Edit, copy, export or delete."
      />

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,220px)]">
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search titles and content"
          />
        </div>
        <SelectField label="Type" value={filter} onChange={setFilter} options={FILTERS} />
      </div>

      <div className="mt-6">
        {outputsQuery.isLoading ? (
          <LoadingState message="Loading your library…" />
        ) : outputsQuery.isError ? (
          <ErrorState
            message="Your saved outputs could not be loaded."
            onRetry={() => outputsQuery.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<BookmarkCheck className="size-5" aria-hidden="true" />}
            title="Nothing here yet"
            description="Generate something with any tool and press Save to keep it in your library."
          />
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-border bg-card p-4 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold">{item.title}</h2>
                    <p className="text-xs text-muted-foreground">
                      {OUTPUT_KINDS[item.kind] ?? "Output"} ·{" "}
                      {new Date(item.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <CopyButton value={item.content} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        downloadText(`${slugify(item.title)}.txt`, item.content)
                      }
                    >
                      <Download className="size-4" aria-hidden="true" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(item);
                        setDraftTitle(item.title);
                        setDraftContent(item.content);
                      }}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${item.title}`}
                      onClick={() => remove.mutate(item.id)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <div className={cn("mt-3 max-h-96 overflow-y-auto border-t border-border pt-3")}>
                  {typeof item.metadata?.["path"] === "string" ? (
                    <VisualPreview path={item.metadata["path"] as string} title={item.title} />
                  ) : null}
                  <MarkdownView content={item.content} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => (open ? null : setEditing(null))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit saved output</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                rows={14}
                value={draftContent}
                onChange={(event) => setDraftContent(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={() => update.mutate()} disabled={update.isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
