/**
 * Shared content-safety guard for visual generation.
 * Used on the client (instant feedback) and on the server (authoritative).
 */

const BLOCKED_PATTERNS: RegExp[] = [
  /\b(porn|pornographic|pornography|xxx|hardcore)\b/i,
  /\b(nude|nudes|nudity|naked|topless|bottomless)\b/i,
  /\b(nsfw|erotic|erotica|explicit\s+(sex|sexual|content)|sexually\s+explicit)\b/i,
  /\b(sex\s*(scene|act|acts|position|positions)|sexting|orgy|orgasm|masturbat\w*)\b/i,
  /\b(genital\w*|penis|vagina|vulva|breasts\s+exposed|nipples)\b/i,
  /\b(fetish|bdsm|bondage|hentai|lingerie\s+shoot|strip(per|tease))\b/i,
  /\b(escort|brothel|onlyfans)\b/i,
  /\b(child|minor|teen|underage|kid|kids)\b[^.]{0,30}\b(sexual|nude|naked|erotic)\b/i,
  /\b(gore|beheading|mutilat\w*|dismember\w*)\b/i,
];

export const SAFETY_MESSAGE =
  "That request looks like it asks for explicit or unsafe content. ALLORAXIA only generates professional, workplace-safe visuals — please rephrase your prompt.";

/** Returns true when the prompt requests explicit or unsafe content. */
export function isUnsafePrompt(prompt: string): boolean {
  const text = prompt.replace(/[_*~`]/g, " ");
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(text));
}

/** Appended to every image prompt so the model stays workplace-appropriate. */
export const SAFETY_SUFFIX =
  "Strict content policy: the image must be entirely safe for work and appropriate for a professional business audience. No nudity, no sexual or suggestive content, no gore or graphic violence, no hate symbols, no real identifiable people or copyrighted characters, no explicit or adult themes of any kind. Keep it clean, tasteful and professional.";
