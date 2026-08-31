export type Quip = { label: string; text: string };

export const REMINDER_QUIPS: Quip[] = [
  { label: "Science fact", text: "Octopuses have three hearts. You have one task list. Statistically, you've got this." },
  { label: "Tech fact", text: "The first computer bug was a literal moth. Yours is probably just an unstarted task." },
  { label: "Fun fact", text: "Honey never spoils. Your deadline, unfortunately, does." },
  { label: "Joke", text: "I told my to-do list I'd deal with it later. It's now my to-do legacy." },
  { label: "Science fact", text: "Light from the Sun takes 8 minutes to reach you. That task takes 15. Beat the Sun." },
  { label: "Tech fact", text: "'Debugging' is just talking to yourself until the computer agrees. Same goes for planning your day." },
  { label: "Fun fact", text: "A group of flamingos is called a flamboyance. A group of overdue tasks is called Tuesday." },
  { label: "Joke", text: "Procrastination is just time travel where you arrive stressed." },
  { label: "Science fact", text: "Your brain uses about 20% of your energy. Give it one clear next step and it stops burning fuel on worry." },
  { label: "Tech fact", text: "Wi-Fi doesn't stand for anything. Neither does 'I'll do it tomorrow'." },
  { label: "Fun fact", text: "Bananas are berries, strawberries aren't, and a 5-minute task is never 5 minutes." },
  { label: "Joke", text: "My productivity system is excellent. It's the me part that needs patching." },
  { label: "Science fact", text: "Sharks existed before trees. Your task has been open a while, but not that long." },
  { label: "Tech fact", text: "The first 1GB hard drive weighed 250kg. Your mental load feels similar — offload it, tick something off." },
  { label: "Fun fact", text: "Sea otters hold hands so they don't drift apart. Your deadlines are drifting. Hold one." },
  { label: "Joke", text: "Two tasks walk into a bar. Only one gets done. The other is 'refactor later'." },
];

export function pickQuip(seed = Date.now()): Quip {
  return REMINDER_QUIPS[seed % REMINDER_QUIPS.length]!;
}

export const NUDGE_HEADLINES = [
  "Psst — your day is waiting",
  "A gentle, well-dressed nudge",
  "Friendly reminder, zero judgement",
  "Your future self sent this",
  "Small push, big momentum",
];

export function pickHeadline(seed = Date.now()): string {
  return NUDGE_HEADLINES[seed % NUDGE_HEADLINES.length]!;
}
