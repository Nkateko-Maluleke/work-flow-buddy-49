import { useServerFn } from "@tanstack/react-start";
import { FileText, Loader2, Paperclip, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { extractDocumentText } from "@/lib/files.functions";
import { ACCEPTED_DOC_TYPES, MAX_UPLOAD_BYTES, blobToBase64, formatBytes } from "@/lib/media";

export type Attachment = { name: string; size: number; text: string };

export function attachmentsToContext(attachments: Attachment[]) {
  if (attachments.length === 0) return "";
  return attachments
    .map((item) => `--- Attached document: ${item.name} ---\n${item.text}`)
    .join("\n\n");
}

export function DocumentUpload({
  attachments,
  onChange,
  label = "Attach documents",
  disabled,
}: {
  attachments: Attachment[];
  onChange: (next: Attachment[]) => void;
  label?: string;
  disabled?: boolean | undefined;
}) {
  const extract = useServerFn(extractDocumentText);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    const added: Attachment[] = [];
    for (const file of Array.from(files).slice(0, 10)) {
      try {
        if (file.size > MAX_UPLOAD_BYTES) {
          throw new Error(`${file.name} is larger than 20MB.`);
        }
        const dataBase64 = await blobToBase64(file);
        const result = await extract({
          data: {
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            dataBase64,
          },
        });
        if (!result.text.trim()) throw new Error(`No text was found in ${file.name}.`);
        added.push({ name: file.name, size: file.size, text: result.text });
      } catch (caught) {
        toast.error(caught instanceof Error ? caught.message : `Could not read ${file.name}.`);
      }
    }
    if (added.length > 0) {
      onChange([...attachments, ...added]);
      toast.success(`${added.length} document${added.length > 1 ? "s" : ""} attached`);
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_DOC_TYPES}
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy || disabled}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Paperclip className="size-4" aria-hidden="true" />
        )}
        {busy ? "Reading…" : label}
      </Button>
      <p className="text-xs text-muted-foreground">
        PDF, Word (.docx), PowerPoint (.pptx), Excel (.xlsx), text, CSV or images. Max 20MB each.
      </p>
      {attachments.length > 0 ? (
        <ul className="space-y-1.5">
          {attachments.map((item, index) => (
            <li
              key={`${item.name}-${index}`}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs"
            >
              <FileText className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
              <span className="shrink-0 text-muted-foreground">{formatBytes(item.size)}</span>
              <button
                type="button"
                aria-label={`Remove ${item.name}`}
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                onClick={() => onChange(attachments.filter((_, i) => i !== index))}
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
