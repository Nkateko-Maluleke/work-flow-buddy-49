# AI Workplace Companion

Build a complete, modern, responsive full-stack SaaS web application called ALLORAXIA.

The product is an AI-powered productivity platform for professionals, students, researchers, entrepreneurs and workplace teams. It should help users automate writing, meetings, planning, research and everyday workplace tasks.

Build it as one cohesive product, not disconnected demo pages.

1. CORE FEATURES

Create these main sections:

Dashboard

A personalized productivity overview with:

“Good morning, [Name]”

Global AI prompt: “What would you like to accomplish today?”

Quick actions for Email, Meetings, Tasks, Research and AI Chat

Productivity statistics

Tasks due today

Recent AI activity

Smart Email Generator

Inputs:

Email purpose

Recipient/context

Key points

Tone: Formal, Professional, Friendly, Persuasive, Concise, Empathetic, Assertive

Length: Short, Medium, Detailed

Language

Generate an editable:

Subject

Email body

Actions:

Copy

Save

Regenerate

Shorten

Expand

Change tone

Improve clarity

Export

Never automatically send emails.

Meeting Notes Summarizer

Allow users to paste/upload notes.

Generate editable:

Meeting summary

Key discussion points

Decisions

Action items

Responsible people

Deadlines

Follow-up items

Include Copy, Save, Regenerate and Export.

AI Task Planner

Users can create tasks with:

Name

Description

Due date

Estimated duration

Priority

Category

Priorities:
Urgent, High, Medium, Low.

Include:

Today

This Week

All Tasks

Completed

Users can add, edit, delete, complete and reorder tasks.

Add Optimize My Schedule, where AI prioritizes tasks using deadlines, priority, duration and available time, then creates a practical daily/weekly schedule.

AI Research Assistant

Users enter a topic/question.

Generate:

Overview

Key insights

Main arguments

Advantages/disadvantages where relevant

Recommendations

Summary

Support referencing styles:

APA 7

Harvard

MLA

Chicago

IEEE

Vancouver

Never invent citations, sources, authors, dates or URLs. Clearly identify information that requires verification.

AI Chat

Create a modern AI chatbot interface with:

Conversation history

New conversation

Message input

Clear conversation

Rename/delete conversations

Copy responses

Save responses

The assistant should help with writing, planning, summarization, research, brainstorming, productivity and workplace communication.

Saved Outputs

Allow users to save and manage:

Emails

Meeting summaries

Research

Task plans

Chat responses

Include filtering, search, edit, rename, copy and delete.

Settings

Include:

Profile

Language

Time zone

Default email tone

Default reference style

AI response length

Theme

Notifications

2. NAVIGATION

Use a professional sidebar:

Dashboard

AI Chat

Email Generator

Meeting Summarizer

Task Planner

Research Assistant

Saved Outputs

Settings

Bottom:

User profile

Theme toggle

Help

Sidebar collapses into mobile navigation on smaller screens.

3. LANDING PAGE + AUTHENTICATION

Create a polished public landing page.

Hero:

Everything. Connected.

Subheading:

“An intelligent workplace productivity assistant for writing, planning, research, meetings and everyday tasks.”

Buttons:

Get Started

Explore Features

Include feature cards and a simple:
Input → AI Processing → Review/Edit → Save/Take Action

section.

Include responsible-AI messaging.

Create Login and Sign Up pages with email/password authentication. Google authentication may be included if easily supported.

After login, send users to Dashboard.

4. AI EXPERIENCE

All AI outputs must be:

Editable

Copyable

Saveable

Regeneratable

Exportable where appropriate

Provide contextual actions such as:

Improve

Shorten

Expand

Simplify

Change tone

Regenerate

Create structured AI prompts for each feature instead of one generic AI prompt.

Use secure server-side AI integration. Never expose API keys in frontend code.

If AI credentials are unavailable, create a clearly labelled Demo Mode using realistic sample responses while keeping the architecture ready for a real AI API.

5. DESIGN SYSTEM

The application must look like a premium, modern AI SaaS product.

Design characteristics:

Clean + Professional + Innovative + Eye-catching + Easy to use

Do not use a generic corporate-blue template.

Colour palette

Primary:

Deep Navy #0F172A

Indigo #6366F1

Violet #8B5CF6

Sky Blue #38BDF8

Neutrals:

Background #F8FAFC

White #FFFFFF

Text #1E293B

Secondary text #64748B

Border #E2E8F0

Semantic:

Success #10B981

Warning #F59E0B

Error #EF4444

Use the neutral colours predominantly and accents strategically.

Create a recognizable Indigo → Violet → Sky Blue AI gradient for selected AI elements, hero accents, AI badges and important CTAs. Do not overuse gradients.

Visual style

Use:

Inter or similar modern sans-serif

Lucide or consistent modern icons

Rounded cards

Subtle shadows

Clean borders

Generous whitespace

Clear typography hierarchy

Smooth micro-interactions

Professional loading/error/empty states

The desktop sidebar can use Deep Navy with light text and Indigo/Violet active states.

The dashboard should primarily use a clean light background with white cards.

AI-generated content should have subtle Indigo/Violet visual indicators so users can distinguish AI features without creating visual clutter.

Include polished dark mode.

Avoid excessive:

Neon colours

Glassmorphism

Gradients

Animations

Shadows

Clutter

The result should feel premium, memorable and trustworthy.

6. RESPONSIVENESS & ACCESSIBILITY

The application must work properly on:

Desktop

Laptop

Tablet

Mobile

No horizontal scrolling.

Use accessible:

Labels

Buttons

Forms

Contrast

Focus states

Keyboard navigation

Semantic HTML

7. DATA & BACKEND

Use Supabase or an appropriate backend for authentication and persistence.

Create user-specific data for:

Tasks

Conversations

Messages

Saved outputs

Meeting summaries

Research sessions

Generated emails

Preferences

Users must only access their own data. Use appropriate security/RLS policies.

Create reusable components such as:

Sidebar

Header

AIInput

AIOutput

TaskCard

OutputCard

SaveButton

CopyButton

LoadingState

ErrorState

EmptyState

Toast/Notification

8. ERROR & LOADING STATES

Include polished states for:

AI generation

Network errors

Empty inputs

Failed generation

Empty pages

Use contextual loading messages such as:
“Generating your email…”
“Analyzing your notes…”
“Prioritizing your tasks…”
“Researching your topic…”

9. RESPONSIBLE AI

Include a subtle disclaimer:

“AI-generated content may contain errors. Review important information and verify sources before relying on it.”

For research:

“References and factual claims should be independently verified before academic, professional or publication use.”

Never claim AI outputs are guaranteed accurate.

10. FINAL BUILD REQUIREMENT

Build the application end-to-end with a polished, production-quality SaaS experience.

Prioritize:

Functional navigation

Excellent UX

Strong visual identity

Working AI workflows

Editable outputs

Authentication

Data persistence

Responsive design

Accessibility

Professional error/loading states

Make sensible implementation decisions without asking unnecessary clarification questions.

Do not create a basic mockup. Build the complete application structure and functionality in this initial generation.

Where a real external AI service is unavailable, use clearly labelled Demo Mode and keep the architecture ready for production API integration.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/917db427-2ff8-4582-b8e4-dcd4324057a8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
