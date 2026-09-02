import { createParser } from "eventsource-parser";
import { flushSync } from "react-dom";

import { supabase } from "@/integrations/supabase/client";

export const VISUAL_TYPES = [
  "Image",
  "Slide",
  "Infographic",
  "Chart / Graph",
  "Diagram",
  "Poster",
] as const;
export type VisualType = (typeof VISUAL_TYPES)[number];

export const VISUAL_STYLES = [
  "Clean corporate",
  "Modern minimal",
  "Bold and colourful",
  "Flat illustration",
  "Hand-drawn sketch",
  "3D render",
  "Photographic",
] as const;

export const ASPECT_RATIOS = ["Square (1:1)", "Landscape (16:9)", "Portrait (4:5)"] as const;

const TYPE_INSTRUCTIONS: Record<VisualType, string> = {
  Image: "Create a single polished illustration or visual.",
  Slide:
    "Design a presentation slide: a short headline, a few concise bullet points with icons, generous whitespace and a clear visual hierarchy. All text must be spelled correctly and legible.",
  Infographic:
    "Design an infographic: a clear title, 3-5 labelled sections with icons, simple supporting statistics or steps, and a consistent colour palette. All text must be legible and correctly spelled.",
  "Chart / Graph":
    "Design a clean data chart (bar, line, pie or comparison as most appropriate) with axis labels, a legend, a title and readable value labels. Only use the data provided; if no data is given, use clearly generic placeholder values.",
  Diagram:
    "Design a diagram: labelled boxes or nodes connected with arrows showing flow or relationships, with a title and a simple legend if needed.",
  Poster:
    "Design a professional poster: strong headline, supporting subheading, one focal visual and balanced layout.",
};

export function buildVisualPrompt(input: {
  type: VisualType;
  prompt: string;
  style: string;
  aspect: string;
  notes?: string;
}) {
  const ratio = input.aspect.includes("16:9")
    ? "16:9 landscape composition"
    : input.aspect.includes("4:5")
      ? "4:5 portrait composition"
      : "1:1 square composition";
  return [
    TYPE_INSTRUCTIONS[input.type],
    `Subject / brief: ${input.prompt.trim()}`,
    input.notes?.trim() ? `Data or details to include: ${input.notes.trim()}` : "",
    `Visual style: ${input.style}. Format: ${ratio}.`,
    "Audience: professional workplace. Avoid gibberish text, watermarks and logos.",
  ]
    .filter(Boolean)
    .join("\n");
}

type ImageEventPayload =
  | { type: "image_generation.partial_image"; b64_json: string; partial_image_index: number }
  | { type: "image_generation.completed"; b64_json: string }
  | { type: "error"; error: { message: string } };

async function errorMessage(res: Response) {
  const raw = await res.text().catch(() => "");
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    /* keep raw */
  }
  if (res.status === 429) return "The image service is busy. Please wait a moment and try again.";
  if (res.status === 402) return "AI credits are exhausted. Add credits to keep generating visuals.";
  return raw || `Visual generation failed (${res.status}).`;
}

/** Streams a generated visual, calling onFrame for each preview frame and the final image. */
export async function streamVisual(
  prompt: string,
  onFrame: (dataUrl: string, isFinal: boolean) => void,
): Promise<void> {
  const res = await fetch("/api/generate-visual", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok || !res.body) throw new Error(await errorMessage(res));

  let sawAnyEvent = false;
  let sawCompleted = false;
  let streamError: string | undefined;

  const parser = createParser({
    onEvent(event) {
      let payload: ImageEventPayload | undefined;
      try {
        payload = JSON.parse(event.data) as ImageEventPayload;
      } catch {
        /* ignore */
      }
      if (event.event === "error" || payload?.type === "error") {
        sawAnyEvent = true;
        streamError =
          (payload as { error?: { message?: string } } | undefined)?.error?.message ??
          "Visual generation failed.";
        return;
      }
      if (
        event.event !== "image_generation.partial_image" &&
        event.event !== "image_generation.completed"
      )
        return;
      if (!payload) return;
      sawAnyEvent = true;
      const isFinal = event.event === "image_generation.completed";
      flushSync(() => {
        onFrame(`data:image/png;base64,${(payload as { b64_json: string }).b64_json}`, isFinal);
      });
      if (isFinal) sawCompleted = true;
    },
  });

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      parser.feed(value);
    }
  } finally {
    reader.cancel().catch(() => {});
  }

  if (streamError) throw new Error(streamError);

  if (!sawAnyEvent) {
    const replay = await fetch("/api/generate-visual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, stream: false }),
    });
    if (!replay.ok) throw new Error(await errorMessage(replay));
    const json = (await replay.json()) as { data?: { b64_json?: string }[] };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("The visual could not be generated. Please try again.");
    onFrame(`data:image/png;base64,${b64}`, true);
    return;
  }

  if (!sawCompleted) throw new Error("The visual did not finish generating. Please try again.");
}

function dataUrlToBlob(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: "image/png" });
}

/** Uploads a generated visual into the private per-user bucket and returns its path. */
export async function uploadVisual(dataUrl: string, slug: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("You need to be signed in to save visuals.");
  const path = `${auth.user.id}/${Date.now()}-${slug || "visual"}.png`;
  const { error } = await supabase.storage
    .from("visuals")
    .upload(path, dataUrlToBlob(dataUrl), { contentType: "image/png" });
  if (error) throw error;
  return path;
}

export async function signedVisualUrl(path: string) {
  const { data, error } = await supabase.storage.from("visuals").createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

export function downloadDataUrl(filename: string, dataUrl: string) {
  const url = URL.createObjectURL(dataUrlToBlob(dataUrl));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
