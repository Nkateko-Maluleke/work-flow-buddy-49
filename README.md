# ALLORAXIA

**Everything. Connected.**

ALLORAXIA is an AI-powered productivity platform for professionals, students, researchers, entrepreneurs, and workplace teams. It brings writing, meetings, planning, and research into one connected workspace — helping you automate everyday workplace tasks without losing control over the output.

> ⚠️ AI-generated content may contain errors. Review important information and verify sources before relying on it.

---

## ✨ Features

- **Dashboard** — A personalized productivity overview with quick actions, task summaries, and recent AI activity.
- **Smart Email Generator** — Generate editable emails with configurable tone, length, and language. Emails are never sent automatically.
- **Meeting Notes Summarizer** — Turn raw meeting notes into structured summaries, decisions, and action items with owners and deadlines.
- **AI Task Planner** — Create, prioritize, and schedule tasks, with an "Optimize My Schedule" feature that builds a practical daily/weekly plan.
- **AI Research Assistant** — Get structured research overviews with support for APA, Harvard, MLA, Chicago, IEEE, and Vancouver referencing styles. Never fabricates sources.
- **AI Chat** — A full-featured assistant for writing, planning, summarization, and brainstorming, with conversation history and management.
- **Saved Outputs** — Centralized library for saved emails, summaries, research, task plans, and chat responses, with search and filtering.
- **Settings** — Manage profile, language, time zone, default tone/reference style, AI response length, theme, and notifications.

All AI outputs are **editable, copyable, saveable, regeneratable, and exportable** where appropriate.

---

## 🛠️ Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router)
- **UI:** React 19, Tailwind CSS 4, shadcn/ui, Radix UI primitives, Lucide icons
- **Data & Forms:** TanStack Query, React Hook Form, Zod
- **Backend:** [Supabase](https://supabase.com/) (authentication & data persistence)
- **Build tooling:** Vite, ESLint, Prettier
- **Package manager:** [Bun](https://bun.sh/)

This project was built with [Lovable](https://lovable.dev).

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (or Node.js + npm as an alternative)
- A [Supabase](https://supabase.com/) project for authentication and data storage

### Installation

```bash
git clone https://github.com/Nkateko-Maluleke/work-flow-buddy-49.git
cd work-flow-buddy-49
bun install
```

### Environment Variables

Create a `.env` file in the project root with your Supabase credentials and any AI service keys required:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> Never expose AI provider API keys in frontend code — all AI calls should go through a secure server-side integration.

### Run the development server

```bash
bun run dev
```

The app will be available at `http://localhost:5173` (or the port shown in your terminal).

### Other scripts

```bash
bun run build       # Production build
bun run build:dev   # Development-mode build
bun run preview     # Preview the production build locally
bun run lint         # Lint the codebase
bun run format       # Format the codebase with Prettier
```

---

## 📁 Project Structure

```
work-flow-buddy-49/
├── public/          # Static assets
├── src/              # Application source code
├── supabase/         # Supabase configuration and migrations
├── .lovable/          # Lovable project metadata
├── package.json
└── vite.config.ts
```

---

## 🔒 Security & Data

- Users can only access their own data (tasks, conversations, saved outputs, etc.) via Supabase Row Level Security (RLS) policies.
- AI credentials and provider keys are never exposed in the frontend — all AI calls run through a secure server-side layer.
- If AI credentials are unavailable, the app falls back to a clearly labelled **Demo Mode** with realistic sample responses.

---

## 🎨 Design

ALLORAXIA uses a clean, professional design system built around a Deep Navy / Indigo / Violet / Sky Blue palette, with a signature Indigo → Violet → Sky Blue gradient reserved for AI-related elements and key calls to action. The interface is fully responsive (desktop, tablet, mobile) and includes a polished dark mode.

---

## 🤝 Contributing

Continue developing this project directly in the [Lovable editor](https://lovable.dev/projects/917db427-2ff8-4582-b8e4-dcd4324057a8) — changes made there sync straight back to this repository, and pushes to `main` sync back into Lovable.

For local contributions:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your branch and open a Pull Request

---

## 📄 License

No license specified yet. Add a `LICENSE` file to define how others may use this project.

---

## ⚠️ Responsible AI

AI-generated content — including emails, summaries, task plans, and research — may contain errors or inaccuracies. Always review important information before acting on it. References and factual claims produced by the Research Assistant should be independently verified before academic, professional, or publication use.


