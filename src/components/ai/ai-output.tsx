import {
  Download,
  Maximize2,
  Minimize2,
  RefreshCw,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import { CopyButton } from "@/components/common/copy-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AI_DISCLAIMER } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function AIBadge({ demo = false }: { demo?: boolean | undefined }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
      <Sparkles className="size-3" aria-hidden="true" />
      {demo ? "Demo Mode output" : "AI generated"}
    </span>
  );
}

export function AIDisclaimer({ extra }: { extra?: string | undefined }) {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      {AI_DISCLAIMER}
      {extra ? ` ${extra}` : ""}
    </p>
  );
}

export type RefineAction = "improve" | "shorten" | "expand" | "simplify" | "clarity";

export function AIOutput({
  title,
  value,
  onChange,
  demo,
  busy,
  onRegenerate,
  onRefine,
  onSave,
  exportName,
  toolbarExtra,
  disclaimerExtra,
}: {
  title: string;
  value: string;
  onChange: (next: string) => void;
  demo?: boolean;
  busy?: boolean;
  onRegenerate?: () => void;
  onRefine?: (action: RefineAction) => void;
  onSave?: () => void | Promise<void>;
  exportName: string;
  toolbarExtra?: ReactNode;
  disclaimerExtra?: string;
}) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };

  const exportFile = () => {
    const blob = new Blob([value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = exportName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Exported as a text file");
  };

  return (
    <section
      aria-label={title}
      className="overflow-hidden rounded-xl border border-primary/20 bg-card shadow-card"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-accent/40 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <AIBadge demo={demo} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {toolbarExtra}
          <CopyButton value={value} />
          {onSave ? (
            <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
              <Save className="size-4" aria-hidden="true" />
              {saving ? "Saving…" : "Save"}
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={exportFile}>
            <Download className="size-4" aria-hidden="true" />
            Export
          </Button>
          {onRegenerate ? (
            <Button size="sm" variant="secondary" onClick={onRegenerate} disabled={busy}>
              <RefreshCw className={cn("size-4", busy && "animate-spin")} aria-hidden="true" />
              Regenerate
            </Button>
          ) : null}
        </div>
      </header>

      <Tabs defaultValue="edit" className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-3">
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          {onRefine ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex">
                <Wand2 className="size-3" aria-hidden="true" /> AI actions
              </span>
              <RefineButton action="improve" label="Improve" onRefine={onRefine} busy={busy} />
              <RefineButton action="shorten" label="Shorten" onRefine={onRefine} busy={busy} />
              <RefineButton action="expand" label="Expand" onRefine={onRefine} busy={busy} />
              <RefineButton action="simplify" label="Simplify" onRefine={onRefine} busy={busy} />
              <RefineButton action="clarity" label="Improve clarity" onRefine={onRefine} busy={busy} />
            </div>
          ) : null}
        </div>

        <TabsContent value="edit" className="px-4 pb-4">
          <label className="sr-only" htmlFor={`${exportName}-editor`}>
            Editable {title}
          </label>
          <Textarea
            id={`${exportName}-editor`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="min-h-72 resize-y font-normal leading-relaxed"
          />
        </TabsContent>
        <TabsContent value="preview" className="px-4 pb-4">
          <MarkdownView content={value} />
        </TabsContent>
      </Tabs>

      <footer className="border-t border-border bg-muted/40 px-4 py-3">
        <AIDisclaimer extra={disclaimerExtra} />
      </footer>
    </section>
  );
}

function RefineButton({
  action,
  label,
  onRefine,
  busy,
}: {
  action: RefineAction;
  label: string;
  onRefine: (action: RefineAction) => void;
  busy?: boolean | undefined;
}) {
  return (
    <Button size="sm" variant="ghost" disabled={busy} onClick={() => onRefine(action)}>
      {action === "shorten" ? (
        <Minimize2 className="size-3.5" aria-hidden="true" />
      ) : action === "expand" ? (
        <Maximize2 className="size-3.5" aria-hidden="true" />
      ) : (
        <Sparkles className="size-3.5" aria-hidden="true" />
      )}
      {label}
    </Button>
  );
}

export function MarkdownView({ content, className }: { content: string; className?: string }) {
  return (
    <div
      className={cn(
        "space-y-3 text-sm leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:ml-1 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_strong]:font-semibold [&_table]:w-full [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2 [&_th]:text-left [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
