import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { extractDocument, transcribeAudio } from "./files.server";

const DocumentInput = z.object({
  name: z.string().min(1),
  mimeType: z.string().default("application/octet-stream"),
  dataBase64: z.string().min(1),
});

export const extractDocumentText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DocumentInput.parse(input))
  .handler(async ({ data }) => extractDocument(data));

const AudioInput = z.object({
  dataBase64: z.string().min(1),
  mimeType: z.string().default("audio/webm"),
  fileName: z.string().optional(),
});

export const transcribeRecording = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AudioInput.parse(input))
  .handler(async ({ data }) => transcribeAudio(data));
