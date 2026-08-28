import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AIOutput, type RefineAction } from "@/components/ai/ai-output";
import { PageHeader } from "@/components/app/app-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/hooks/use-auth";
import { generateEmail, refineText } from "@/lib/ai.functions";
import { EMAIL_LENGTHS, LANGUAGES, TONES } from "@/lib/constants";
import { saveOutput, slugify } from "@/lib/outputs";

export const Route = createFileRoute("/_authenticated/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — ALLORAXIA" },
      {
        name: "description",
        content:
          "Generate professional emails in any tone, length and language, then edit, refine and export the draft.",
      },
      { property: "og:title", content: "Smart Email Generator — ALLORAXIA" },
      { property: "og:description", content: "AI email drafting with full editing control." },
    ],
  }),
  component: EmailPage,
});

function EmailPage() {
  const { data: profile } = useProfile();
  const generate = useServerFn(generateEmail);
  const refine = useServerFn(refineText);

  const [purpose, setPurpose] = useState("");
  const [recipient, setRecipient] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [tone, setTone] = useState(profile?.default_email_tone ?? "Professional");
  const [length, setLength] = useState("Medium");
  const [language, setLanguage] = useState(profile?.language ?? "English");

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!purpose.trim()) {
      setError("Describe what the email is about before generating a draft.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const result = await generate({
        data: { purpose, recipient, keyPoints, tone, length, language },
      });
      setSubject(result.subject);
      setBody(result.body);
      setDemo(result.demo);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The draft could not be generated.");
    } finally {
      setBusy(false);
    }
  };

  const applyRefine = async (action: RefineAction) => {
    setBusy(true);
    setError(null);
    try {
      const result = await refine({ data: { text: body, action } });
      setBody(result.text);
      setDemo(result.demo);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The draft could not be refined.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    try {
      await saveOutput({
        kind: "email",
        title: subject || purpose.slice(0, 80),
        content: subject ? `Subject: ${subject}\n\n${body}` : body,
        metadata: { tone, length, language, recipient },
      });
      toast.success("Saved to your library");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save this draft.");
    }
  };

  return (
    <>
      <PageHeader
        title="Smart Email Generator"
        description="Describe the email, choose a tone, and review the draft. Nothing is ever sent automatically."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <section
          aria-label="Email details"
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-card"
        >
          <div className="space-y-2">
            <Label htmlFor="purpose">What is the email about?</Label>
            <Textarea
              id="purpose"
              rows={3}
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              placeholder="Ask the supplier for an updated delivery date and apologise for the short notice."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient (optional)</Label>
            <Input
              id="recipient"
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="Priya, Operations Manager"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="points">Key points (optional)</Label>
            <Textarea
              id="points"
              rows={3}
              value={keyPoints}
              onChange={(event) => setKeyPoints(event.target.value)}
              placeholder="One point per line"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Tone" value={tone} onChange={setTone} options={[...TONES]} />
            <SelectField
              label="Length"
              value={length}
              onChange={setLength}
              options={[...EMAIL_LENGTHS]}
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
            {busy ? "Generating…" : "Generate email"}
          </Button>
        </section>

        <div className="space-y-4">
          {error ? <ErrorState message={error} onRetry={run} /> : null}
          {busy && !body ? <LoadingState message="Drafting your email…" /> : null}
          {!busy && !body && !error ? (
            <EmptyState
              icon={<Mail className="size-5" aria-hidden="true" />}
              title="Your draft will appear here"
              description="Fill in the details on the left and generate a draft you can edit freely."
            />
          ) : null}

          {body ? (
            <>
              <div className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-card">
                <Label htmlFor="subject">Subject line</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Subject"
                />
              </div>
              <AIOutput
                title="Email draft"
                value={body}
                onChange={setBody}
                demo={demo}
                busy={busy}
                onRegenerate={run}
                onRefine={applyRefine}
                onSave={save}
                exportName={`${slugify(subject || purpose)}-email.txt`}
                disclaimerExtra="This draft is never sent automatically — you send it yourself."
              />
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`field-${label}`}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={`field-${label}`} className="w-full">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
