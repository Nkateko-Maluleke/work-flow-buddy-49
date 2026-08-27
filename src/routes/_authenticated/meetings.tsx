import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Notebook, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AIOutput, type RefineAction } from "@/components/ai/ai-output";
import { PageHeader } from "@/components/app/app-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/hooks/use-auth";
import { refineText, summarizeMeeting } from "@/lib/ai.functions";
import { LANGUAGES } from "@/lib/constants";
import { saveOutput, slugify } from "@/lib/outputs";
import { SelectField } from "./email";

export const Route = createFileRoute("/_authenticated/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Summarizer — Workplace AI" },
      {
        name: "description",
        content:
          "Turn raw meeting notes or transcripts into a clear summary with decisions, action items, owners and deadlines.",
      },
      { property: "og:title", content: "Meeting Summarizer — Workplace AI" },
      {
        property: "og:description",
        content: "AI meeting summaries with decisions and action items.",
      },
    ],
  }),
  component: MeetingsPage,
});

function MeetingsPage() {
  const { data: profile } = useProfile();
  const summarize = useServerFn(summarizeMeeting);
  const refine = useServerFn(refineText);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [language, setLanguage] = useState(profile?.language ?? "English");
  const [summary, setSummary] = useState("");
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (notes.trim().length < 20) {
      setError("Paste at least a few lines of meeting notes so the summary has something to work with.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const result = await summarize({ data: { notes, language } });
      setSummary(result.text);
      setDemo(result.demo);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The summary could not be generated.");
    } finally {
      setBusy(false);
    }
  };

  const applyRefine = async (action: RefineAction) => {
    setBusy(true);
    setError(null);
    try {
      const result = await refine({ data: { text: summary, action } });
      setSummary(result.text);
      setDemo(result.demo);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The summary could not be refined.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    try {
      await saveOutput({
        kind: "meeting",
        title: title || "Meeting summary",
        content: summary,
        metadata: { language },
      });
      toast.success("Saved to your library");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save this summary.");
    }
  };

  return (
    <>
      <PageHeader
        title="Meeting Summarizer"
        description="Paste messy notes or a transcript. You get a summary, decisions, action items and follow-ups."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <section
          aria-label="Meeting notes"
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-card"
        >
          <div className="space-y-2">
            <Label htmlFor="meeting-title">Meeting title (optional)</Label>
            <Input
              id="meeting-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Weekly product sync"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes or transcript</Label>
            <Textarea
              id="notes"
              rows={14}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Paste anything — bullet points, chat log or a full transcript."
            />
          </div>
          <SelectField
            label="Language"
            value={language}
            onChange={setLanguage}
            options={[...LANGUAGES]}
          />
          <Button onClick={run} disabled={busy} className="w-full">
            <Sparkles className="size-4" aria-hidden="true" />
            {busy ? "Summarizing…" : "Summarize meeting"}
          </Button>
        </section>

        <div className="space-y-4">
          {error ? <ErrorState message={error} onRetry={run} /> : null}
          {busy && !summary ? <LoadingState message="Reading your notes…" /> : null}
          {!busy && !summary && !error ? (
            <EmptyState
              icon={<Notebook className="size-5" aria-hidden="true" />}
              title="Your summary will appear here"
              description="Decisions, action items with owners, deadlines and open questions — all editable."
            />
          ) : null}
          {summary ? (
            <AIOutput
              title="Meeting summary"
              value={summary}
              onChange={setSummary}
              demo={demo}
              busy={busy}
              onRegenerate={run}
              onRefine={applyRefine}
              onSave={save}
              exportName={`${slugify(title || "meeting")}-summary.txt`}
              disclaimerExtra="Confirm owners and deadlines with attendees before sharing."
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
