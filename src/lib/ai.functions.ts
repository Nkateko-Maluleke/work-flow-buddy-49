import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  chatSystem,
  DEMO_CHAT,
  DEMO_EMAIL,
  DEMO_MEETING,
  DEMO_REFINE,
  DEMO_RESEARCH,
  DEMO_SCHEDULE,
  emailSystem,
  emailUser,
  meetingSystem,
  refineSystem,
  researchSystem,
  scheduleSystem,
} from "./ai-prompts";
import { runAi, runChat } from "./ai.server";

const EmailInput = z.object({
  purpose: z.string().min(1),
  recipient: z.string().default(""),
  keyPoints: z.string().default(""),
  tone: z.string().default("Professional"),
  length: z.string().default("Medium"),
  language: z.string().default("English"),
});

export const generateEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EmailInput.parse(input))
  .handler(async ({ data }) => {
    const result = await runAi(
      emailSystem(data.length, data.language),
      emailUser(data),
      DEMO_EMAIL,
    );
    const lines = result.text.split("\n");
    let subject = "";
    let body = result.text;
    const first = lines[0] ?? "";
    if (/^subject\s*:/i.test(first)) {
      subject = first.replace(/^subject\s*:/i, "").trim();
      body = lines.slice(1).join("\n").trim();
    }
    return { subject, body, demo: result.demo };
  });

const MeetingInput = z.object({
  notes: z.string().min(1),
  language: z.string().default("English"),
});

export const summarizeMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => MeetingInput.parse(input))
  .handler(async ({ data }) =>
    runAi(
      meetingSystem(data.language),
      `Meeting notes / transcript:\n\n${data.notes}`,
      DEMO_MEETING,
    ),
  );

const ResearchInput = z.object({
  topic: z.string().min(1),
  referenceStyle: z.string().default("APA 7"),
  language: z.string().default("English"),
  depth: z.string().default("Medium"),
});

export const researchTopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ResearchInput.parse(input))
  .handler(async ({ data }) =>
    runAi(
      researchSystem(data.referenceStyle, data.language),
      `Research topic or question: ${data.topic}\nDepth: ${data.depth}`,
      DEMO_RESEARCH,
    ),
  );

const ScheduleInput = z.object({
  tasks: z.string().min(1),
  availableHours: z.string().default("8"),
  language: z.string().default("English"),
});

export const optimizeSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ScheduleInput.parse(input))
  .handler(async ({ data }) =>
    runAi(
      scheduleSystem(data.language),
      `Available focus hours per day: ${data.availableHours}\nToday is ${new Date().toISOString().slice(0, 10)}.\n\nTasks:\n${data.tasks}`,
      DEMO_SCHEDULE,
    ),
  );

const RefineInput = z.object({
  text: z.string().min(1),
  action: z.enum(["improve", "shorten", "expand", "simplify", "clarity", "tone"]),
  tone: z.string().optional(),
});

export const refineText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RefineInput.parse(input))
  .handler(async ({ data }) =>
    runAi(
      refineSystem(data.action, data.tone),
      data.text,
      DEMO_REFINE(data.text),
    ),
  );

const ChatInput = z.object({
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1),
  responseLength: z.string().default("Medium"),
  language: z.string().default("English"),
});

export const chatReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) =>
    runChat(
      chatSystem(data.responseLength, data.language),
      data.history,
      DEMO_CHAT,
    ),
  );
