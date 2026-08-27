export const TONES = [
  "Formal",
  "Professional",
  "Friendly",
  "Persuasive",
  "Concise",
  "Empathetic",
  "Assertive",
] as const;

export const EMAIL_LENGTHS = ["Short", "Medium", "Detailed"] as const;

export const RESPONSE_LENGTHS = ["Short", "Medium", "Detailed"] as const;

export const LANGUAGES = [
  "English",
  "Afrikaans",
  "French",
  "German",
  "Spanish",
  "Portuguese",
  "Dutch",
  "Zulu",
  "Arabic",
  "Hindi",
  "Mandarin Chinese",
] as const;

export const REFERENCE_STYLES = [
  "APA 7",
  "Harvard",
  "MLA",
  "Chicago",
  "IEEE",
  "Vancouver",
] as const;

export const PRIORITIES = ["Urgent", "High", "Medium", "Low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const TASK_CATEGORIES = [
  "General",
  "Work",
  "Admin",
  "Meetings",
  "Writing",
  "Research",
  "Personal",
  "Study",
] as const;

export const TIME_ZONES = [
  "UTC",
  "Africa/Johannesburg",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Singapore",
  "Australia/Sydney",
] as const;

export const OUTPUT_KINDS = {
  email: "Email",
  meeting: "Meeting Summary",
  research: "Research",
  plan: "Task Plan",
  chat: "Chat Response",
} as const;

export type OutputKind = keyof typeof OUTPUT_KINDS;

export const AI_DISCLAIMER =
  "AI-generated content may contain errors. Review important information and verify sources before relying on it.";

export const RESEARCH_DISCLAIMER =
  "References and factual claims should be independently verified before academic, professional or publication use.";

export const priorityClasses: Record<Priority, string> = {
  Urgent: "bg-destructive/10 text-destructive border-destructive/25",
  High: "bg-warning/15 text-warning-foreground border-warning/30 dark:text-warning",
  Medium: "bg-accent text-accent-foreground border-primary/20",
  Low: "bg-muted text-muted-foreground border-border",
};
