import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookmarkCheck,
  CalendarClock,
  CheckCircle2,
  Mail,
  MessagesSquare,
  Notebook,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AI_DISCLAIMER } from "@/lib/constants";
import heroVisual from "@/assets/hero-visual.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ALLORAXIA — Work Smarter, Let AI Handle the Busywork" },
      {
        name: "description",
        content:
          "An intelligent workplace productivity assistant for writing, planning, research, meetings and everyday tasks. Draft emails, summarize meetings and plan your day with AI.",
      },
      { property: "og:title", content: "ALLORAXIA — Work Smarter, Let AI Handle the Busywork" },
      {
        property: "og:description",
        content:
          "AI productivity assistant for emails, meeting summaries, task planning, research and chat.",
      },
    ],
  }),
  component: LandingPage,
});

const features = [
  {
    icon: Mail,
    title: "Smart Email Generator",
    body: "Draft emails in any tone and length, then edit, shorten, expand or export. Nothing is ever sent automatically.",
  },
  {
    icon: Notebook,
    title: "Meeting Summarizer",
    body: "Turn messy notes into a clean summary with decisions, action items, owners and deadlines.",
  },
  {
    icon: CalendarClock,
    title: "AI Task Planner",
    body: "Capture tasks with priority, duration and deadlines — then let AI build a realistic daily schedule.",
  },
  {
    icon: Search,
    title: "Research Assistant",
    body: "Structured briefings with insights, arguments and recommendations. Never invented citations.",
  },
  {
    icon: MessagesSquare,
    title: "AI Chat",
    body: "A workplace assistant for writing, planning, brainstorming and summarizing, with saved history.",
  },
  {
    icon: BookmarkCheck,
    title: "Saved Outputs",
    body: "Every result you keep is searchable, filterable and editable in one library.",
  },
];

const steps = [
  { title: "Input", body: "Describe the task, paste your notes or add your tasks." },
  { title: "AI Processing", body: "A purpose-built prompt runs securely on the server." },
  { title: "Review & Edit", body: "Everything is editable — you stay in control of the wording." },
  { title: "Save or Act", body: "Copy, save to your library or export the final version." },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="gradient-ai flex size-8 items-center justify-center rounded-lg shadow-ai">
              <Sparkles className="size-4 text-primary-foreground" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold">ALLORAXIA</span>
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              <Sparkles className="size-3" aria-hidden="true" />
              AI productivity for modern teams
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Work Smarter.{" "}
              <span className="gradient-ai-text">Let AI Handle the Busywork.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              An intelligent workplace productivity assistant for writing, planning, research,
              meetings and everyday tasks.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/signup">
                  Get Started
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#features">Explore Features</a>
              </Button>
            </div>
            <ul className="mt-7 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {["Editable AI outputs", "Your data stays private", "Works on any device", "No credit card needed"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
          <div className="relative">
            <img
              src={heroVisual}
              alt="Illustration of an AI productivity dashboard with charts and task panels"
              width={1280}
              height={960}
              className="w-full rounded-2xl border border-border shadow-elevated"
            />
          </div>
        </section>

        <section id="features" className="border-y border-border bg-card/60 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything you need in one workspace
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Six focused tools that share the same library, preferences and AI quality bar.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, body }) => (
                <article
                  key={title}
                  className="rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-elevated"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <article key={step.title} className="rounded-xl border border-border bg-card p-5">
                  <span className="gradient-ai inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card/60 py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Responsible AI by design</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              You review and approve every output. Emails are never sent automatically, references
              are never invented, and anything that needs checking is flagged. {AI_DISCLAIMER}
            </p>
            <Button asChild className="mt-7" size="lg">
              <Link to="/signup">
                Start free
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:px-6">
          <p>© {new Date().getFullYear()} ALLORAXIA. AI productivity assistant.</p>
          <nav aria-label="Footer" className="flex gap-4">
            <Link to="/login" className="hover:text-foreground">
              Log in
            </Link>
            <Link to="/signup" className="hover:text-foreground">
              Sign up
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
