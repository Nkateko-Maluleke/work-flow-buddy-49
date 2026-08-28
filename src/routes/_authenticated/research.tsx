import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AIOutput, type RefineAction } from "@/components/ai/ai-output";
import { PageHeader } from "@/components/app/app-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/hooks/use-auth";
import { refineText, researchTopic } from "@/lib/ai.functions";
import { LANGUAGES, REFERENCE_STYLES, RESEARCH_DISCLAIMER } from "@/lib/constants";
import { saveOutput, slugify } from "@/lib/outputs";
import { SelectField } from "./email";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({
    meta: [
      { title: "Research Assistant — ALLORAXIA" },
      {
        name: "description",
        content:
          "Get structured research briefings with key insights, arguments and recommendations in your preferred reference style.",
      },
      { property: "og:title", content: "Research Assistant — ALLORAXIA" },
      {
        property: "og:description",
        content: "Structured AI research briefings that never invent citations.",
      },
    ],
  }),
  component: ResearchPage,
});

const DEPTHS = ["Short", "Medium", "Detailed"];

function ResearchPage() {
  const { data: profile } = useProfile();
  const research = useServerFn(researchTopic);
  const refine = useServerFn(refineText);

  const [topic, setTopic] = useState("");
  const [referenceStyle, setReferenceStyle] = useState(profile?.default_reference_style ?? "APA 7");
  const [depth, setDepth] = useState("Medium");
  const [language, setLanguage] = useState(profile?.language ?? "English");
  const [output, setOutput] = useState("");
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!topic.trim()) {
      setError("Enter a topic or question to research.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const result = await research({ data: { topic, referenceStyle, language, depth } });
      setOutput(result.text);
      setDemo(result.demo);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The briefing could not be generated.");
    } finally {
      setBusy(false);
    }
  };

  const applyRefine = async (action: RefineAction) => {
    setBusy(true);
    setError(null);
    try {
      const result = await refine({ data: { text: output, action } });
      setOutput(result.text);
      setDemo(result.demo);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The briefing could not be refined.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    try {
      await saveOutput({
        kind: "research",
        title: topic.slice(0, 120),
        content: output,
        metadata: { referenceStyle, depth, language },
      });
      toast.success("Saved to your library");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save this briefing.");
    }
  };

  return (
    <>
      <PageHeader
        title="Research Assistant"
        description="Structured briefings for reports and decisions. Sources are suggested, never fabricated."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <section
          aria-label="Research request"
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-card"
        >
          <div className="space-y-2">
            <Label htmlFor="topic">Topic or question</Label>
            <Textarea
              id="topic"
              rows={5}
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="How does hybrid work affect employee productivity in professional services?"
            />
          </div>
          <SelectField
            label="Reference style"
            value={referenceStyle}
            onChange={setReferenceStyle}
            options={[...REFERENCE_STYLES]}
          />
          <SelectField label="Depth" value={depth} onChange={setDepth} options={DEPTHS} />
          <SelectField
            label="Language"
            value={language}
            onChange={setLanguage}
            options={[...LANGUAGES]}
          />
          <Button onClick={run} disabled={busy} className="w-full">
            <Sparkles className="size-4" aria-hidden="true" />
            {busy ? "Researching…" : "Research topic"}
          </Button>
        </section>

        <div className="space-y-4">
          {error ? <ErrorState message={error} onRetry={run} /> : null}
          {busy && !output ? <LoadingState message="Building your briefing…" /> : null}
          {!busy && !output && !error ? (
            <EmptyState
              icon={<Search className="size-5" aria-hidden="true" />}
              title="Your briefing will appear here"
              description="Overview, key insights, opposing views, recommendations and suggested reading."
            />
          ) : null}
          {output ? (
            <AIOutput
              title="Research briefing"
              value={output}
              onChange={setOutput}
              demo={demo}
              busy={busy}
              onRegenerate={run}
              onRefine={applyRefine}
              onSave={save}
              exportName={`${slugify(topic)}-research.txt`}
              disclaimerExtra={RESEARCH_DISCLAIMER}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
