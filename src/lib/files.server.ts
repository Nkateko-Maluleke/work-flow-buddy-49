/**
 * Server-only document + audio extraction helpers.
 * Office formats are unzipped and parsed as XML (pure JS, edge safe).
 * PDFs and images go through the Lovable AI Gateway for text extraction / OCR.
 */
import { unzipSync, strFromU8 } from "fflate";

import { AiError } from "./ai.server";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const VISION_MODEL = "google/gemini-3.7-flash";
const TRANSCRIBE_MODEL = "openai/gpt-4o-transcribe";

export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export type ExtractResult = { name: string; text: string; demo: boolean };

function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.includes(",") ? base64.slice(base64.indexOf(",") + 1) : base64;
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function xmlText(xml: string, blockEnd: RegExp) {
  return xml
    .replace(blockEnd, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractOffice(bytes: Uint8Array, kind: "docx" | "pptx" | "xlsx") {
  const files = unzipSync(bytes);
  if (kind === "docx") {
    const doc = files["word/document.xml"];
    if (!doc) throw new AiError("This Word file could not be read.", 400);
    return xmlText(strFromU8(doc), /<\/w:p>/g);
  }
  if (kind === "pptx") {
    const slides = Object.keys(files)
      .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
      .sort(
        (a, b) =>
          Number(a.match(/\d+/)?.[0] ?? 0) - Number(b.match(/\d+/)?.[0] ?? 0),
      );
    return slides
      .map((path, index) => {
        const raw = strFromU8(files[path]!);
        const texts = [...raw.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) =>
          xmlText(match[1] ?? "", /$^/),
        );
        return `## Slide ${index + 1}\n${texts.filter(Boolean).join("\n")}`;
      })
      .join("\n\n")
      .trim();
  }
  const shared = files["xl/sharedStrings.xml"];
  const strings = shared
    ? [...strFromU8(shared).matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) =>
        xmlText(m[1] ?? "", /$^/),
      )
    : [];
  const sheets = Object.keys(files)
    .filter((path) => /^xl\/worksheets\/sheet\d+\.xml$/.test(path))
    .sort();
  const rows: string[] = [];
  for (const path of sheets) {
    const raw = strFromU8(files[path]!);
    for (const row of raw.match(/<row[\s\S]*?<\/row>/g) ?? []) {
      const cells = [...row.matchAll(/<c[^>]*?(t="[^"]*")?[^>]*>([\s\S]*?)<\/c>/g)].map(
        (match) => {
          const inner = match[2] ?? "";
          const value = inner.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
          if (match[1]?.includes('t="s"')) return strings[Number(value)] ?? "";
          const inline = inner.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1];
          return inline ? xmlText(inline, /$^/) : value;
        },
      );
      if (cells.some((cell) => cell !== "")) rows.push(cells.join(" | "));
    }
  }
  return rows.join("\n").trim();
}

async function extractWithAi(name: string, mimeType: string, dataBase64: string) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) {
    return {
      name,
      demo: true,
      text: `[Demo Mode] Text extraction for "${name}" is unavailable without AI credentials. You can still paste the content manually.`,
    };
  }
  const dataUrl = dataBase64.startsWith("data:")
    ? dataBase64
    : `data:${mimeType};base64,${dataBase64}`;
  const block = mimeType.startsWith("image/")
    ? { type: "image_url", image_url: { url: dataUrl } }
    : { type: "file", file: { filename: name, file_data: dataUrl } };

  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You extract the readable text content of documents. Return the text as clean markdown, preserving headings, lists and tables. Do not summarize, comment or add anything that is not in the document.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Extract all text from this file: ${name}` },
            block,
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429)
      throw new AiError("The AI service is busy. Please try again shortly.", 429);
    if (res.status === 402)
      throw new AiError(
        "AI credits are exhausted. Add credits to keep reading documents.",
        402,
      );
    throw new AiError(body || `Could not read "${name}".`, res.status);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new AiError(`No text could be extracted from "${name}".`, 422);
  return { name, text, demo: false };
}

export async function extractDocument(input: {
  name: string;
  mimeType: string;
  dataBase64: string;
}): Promise<ExtractResult> {
  const { name, mimeType, dataBase64 } = input;
  const lower = name.toLowerCase();
  const bytes = base64ToBytes(dataBase64);
  if (bytes.byteLength > MAX_FILE_BYTES) {
    throw new AiError(`"${name}" is larger than 20MB.`, 413);
  }

  if (/\.(txt|md|markdown|csv|json|log|rtf|html?)$/.test(lower)) {
    return { name, text: strFromU8(bytes).trim(), demo: false };
  }
  if (lower.endsWith(".docx")) return { name, text: extractOffice(bytes, "docx"), demo: false };
  if (lower.endsWith(".pptx")) return { name, text: extractOffice(bytes, "pptx"), demo: false };
  if (lower.endsWith(".xlsx")) return { name, text: extractOffice(bytes, "xlsx"), demo: false };
  if (lower.endsWith(".pdf") || mimeType.startsWith("image/")) {
    return extractWithAi(name, lower.endsWith(".pdf") ? "application/pdf" : mimeType, dataBase64);
  }
  if (/\.(doc|ppt|xls)$/.test(lower)) {
    throw new AiError(
      `Legacy Office files (${lower.slice(lower.lastIndexOf("."))}) are not supported. Please save as .docx, .pptx, .xlsx or PDF.`,
      415,
    );
  }
  throw new AiError(`"${name}" is not a supported file type.`, 415);
}

export async function transcribeAudio(input: {
  dataBase64: string;
  mimeType: string;
  fileName?: string | undefined;
}): Promise<{ text: string; demo: boolean }> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) {
    return {
      demo: true,
      text: "[Demo Mode] Voice transcription is unavailable without AI credentials.",
    };
  }
  const bytes = base64ToBytes(input.dataBase64);
  if (bytes.byteLength > MAX_FILE_BYTES) {
    throw new AiError("That recording is larger than 20MB.", 413);
  }
  const form = new FormData();
  form.append("model", TRANSCRIBE_MODEL);
  form.append(
    "file",
    new Blob([bytes as unknown as BlobPart], { type: input.mimeType }),
    input.fileName ?? `audio.${input.mimeType.includes("mp4") ? "m4a" : "webm"}`,
  );

  const res = await fetch(`${GATEWAY}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429)
      throw new AiError("The AI service is busy. Please try again shortly.", 429);
    if (res.status === 402)
      throw new AiError("AI credits are exhausted. Add credits to keep using voice.", 402);
    throw new AiError(body || "The recording could not be transcribed.", res.status);
  }
  const data = (await res.json()) as { text?: string };
  const text = data.text?.trim();
  if (!text) throw new AiError("No speech was detected in that recording.", 422);
  return { text, demo: false };
}
