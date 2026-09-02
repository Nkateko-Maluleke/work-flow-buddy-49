import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Download, Image as ImageIcon, Save, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { VoiceInput } from "@/components/ai/voice-input";
import { PageHeader } from "@/components/app/app-shell";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isUnsafePrompt, SAFETY_MESSAGE } from "@/lib/safety";
import { saveOutput, slugify } from "@/lib/outputs";
import {
  ASPECT_RATIOS,
  buildVisualPrompt,
  downloadDataUrl,
  streamVisual,
  uploadVisual,
  VISUAL_STYLES,
  VISUAL_TYPES,
  type VisualType,
} from "@/lib/visuals";
import { cn } from "@/lib/utils";
import { SelectField } from "./email";

export const Route = createFileRoute("/_authenticated/visuals")({
  head: () => ({
    meta: [
      { title: "Visual Studio — ALLORAXIA" },
      {
        name: "description",
        content:
          "Generate workplace-safe images, slides, infographics, charts and diagrams from a short brief, then export or save them to your library.",
      },
      { property: "og:title", content: "Visual Studio — ALLORAXIA" },
      {
        property: "og:description",
        content: "Create professional slides, infographics, charts and images with AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VisualsPage,
});

function VisualsPage() {
  const queryClient = useQueryClient();

  const [type, setType] = useState<VisualType>("Infographic");
  const [style, setStyle] = useState<string>(VISUAL_STYLES[0]);
  const [aspect, setAspect] = useState<string>(ASPECT_RATIOS[1]);
  const [brief, setBrief] = useState("");
  const [details, setDetails] = useState("");

  const [image, setImage] = useState<string | null>(null);
  const [isFinal, setIsFinal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!brief.trim() || busy) return;
    if (isUnsafePrompt(`${brief} ${details}`)) {
      setError(SAFETY_MESSAGE);
      return;
    }
    setError(null);
    setImage(null);
    setIsFinal(false);
    setBusy(true);
    try {
      const prompt = buildVisualPrompt({ type, prompt: brief, style, aspect, notes: details });
      await streamVisual(prompt, (dataUrl, final) => {
        setImage(dataUrl);
        if (final) setIsFinal(true);
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The visual could not be generated.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!image) return;
    setSaving(true);
    try {
      const title = `${type}: ${brief.trim().slice(0, 80)}`;
      const path = await uploadVisual(image, slugify(brief.slice(0, 40)));
      await saveOutput({
        kind: "visual",
        title,
        content: `**${type}** — ${brief.trim()}${details.trim() ? `\n\n${details.trim()}` : ""}`,
        metadata: { path, type, style, aspect },
      });
      await queryClient.invalidateQueries({ queryKey: ["outputs"] });
      toast.success("Saved to your library");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save the visual.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Visual Studio"
        description="Turn a short brief into slides, infographics, charts, diagrams or images — always workplace-safe."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-label="Visual brief" className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {VISUAL_TYPES.map((option) => (
              <Button
                key={option}
                type="button"
                variant={type === option ? "default" : "outline"}
                size="sm"
                onClick={() => setType(option)}
              >
                {option}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="brief">What should it show?</Label>
            <div className="flex items-start gap-2">
              <Textarea
                id="brief"
                rows={4}
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
                placeholder="e.g. An infographic explaining our four-step client onboarding process"
              />
              <VoiceInput
                size="icon"
                disabled={busy}
                onTranscript={(text) =>
                  setBrief((current) => (current ? `${current.trimEnd()} ${text}` : text))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Data, labels or extra detail (optional)</Label>
            <Textarea
              id="details"
              rows={4}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="e.g. Q1 42%, Q2 55%, Q3 61%, Q4 70% — brand colours navy and violet"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Style"
              value={style}
              onChange={setStyle}
              options={[...VISUAL_STYLES]}
            />
            <SelectField
              label="Format"
              value={aspect}
              onChange={setAspect}
              options={[...ASPECT_RATIOS]}
            />
          </div>

          <Button onClick={generate} disabled={busy || !brief.trim()} className="w-full sm:w-auto">
            <Sparkles className="size-4" aria-hidden="true" />
            {busy ? "Generating…" : "Generate visual"}
          </Button>

          <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            ALLORAXIA generates professional, workplace-safe visuals only. Requests for explicit,
            adult or graphic content are blocked. Always review generated text and figures before
            sharing.
          </p>
        </section>

        <section
          aria-label="Generated visual"
          className="rounded-xl border border-border bg-card p-4 shadow-card"
        >
          {error ? (
            <ErrorState message={error} onRetry={() => void generate()} />
          ) : image ? (
            <div className="space-y-3">
              <img
                src={image}
                alt={`${type} generated from your brief: ${brief.slice(0, 100)}`}
                className={cn(
                  "w-full rounded-lg border border-border transition-[filter] duration-500",
                  isFinal ? "blur-0" : "blur-xl",
                )}
              />
              {!isFinal ? (
                <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                  Rendering your visual…
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadDataUrl(`${slugify(brief.slice(0, 40)) || "visual"}.png`, image)
                    }
                  >
                    <Download className="size-4" aria-hidden="true" />
                    Download PNG
                  </Button>
                  <Button variant="outline" size="sm" onClick={save} disabled={saving}>
                    <Save className="size-4" aria-hidden="true" />
                    {saving ? "Saving…" : "Save to library"}
                  </Button>
                </div>
              )}
            </div>
          ) : busy ? (
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
              Preparing your visual — previews appear as it renders.
            </p>
          ) : (
            <EmptyState
              icon={<ImageIcon className="size-5" aria-hidden="true" />}
              title="Nothing generated yet"
              description="Pick a type, describe what you need, then press Generate visual."
            />
          )}
        </section>
      </div>
    </>
  );
}
