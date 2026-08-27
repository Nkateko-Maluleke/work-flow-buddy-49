import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";

import { PageHeader } from "@/components/app/app-shell";
import { AIDisclaimer } from "@/components/ai/ai-output";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { firstName, useProfile, useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { listOutputs } from "@/lib/outputs";
import { OUTPUT_KINDS, priorityClasses, type Priority } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Workplace AI" },
      {
        name: "description",
        content: "Your personalized AI productivity overview: tasks, saved outputs and quick actions.",
      },
      { property: "og:title", content: "Dashboard — Workplace AI" },
      { property: "og:description", content: "Your AI productivity overview and quick actions." },
    ],
  }),
  component: DashboardPage,
});

const quickActions = [
  { to: "/email", label: "Write an email", icon: Mail },
  { to: "/meetings", label: "Summarize meeting notes", icon: Notebook },
  { to: "/tasks", label: "Plan my day", icon: CalendarClock },
  { to: "/research", label: "Research a topic", icon: Search },
  { to: "/chat", label: "Ask the assistant", icon: MessagesSquare },
] as const;

type TaskRow = {
  id: string;
  name: string;
  due_date: string | null;
  priority: Priority;
  category: string;
  completed: boolean;
};

function DashboardPage() {
  const { user } = useSession();
  const { data: profile } = useProfile();

  const tasksQuery = useQuery({
    queryKey: ["tasks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, name, due_date, priority, category, completed")
        .order("completed")
        .order("due_date", { nullsFirst: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as TaskRow[];
    },
  });

  const outputsQuery = useQuery({
    queryKey: ["outputs", user?.id],
    enabled: !!user,
    queryFn: listOutputs,
  });

  const tasks = tasksQuery.data ?? [];
  const open = tasks.filter((task) => !task.completed);
  const done = tasks.filter((task) => task.completed);
  const urgent = open.filter((task) => task.priority === "Urgent" || task.priority === "High");
  const outputs = outputsQuery.data ?? [];

  const stats = [
    { label: "Open tasks", value: open.length },
    { label: "High priority", value: urgent.length },
    { label: "Completed", value: done.length },
    { label: "Saved outputs", value: outputs.length },
  ];

  return (
    <>
      <PageHeader
        title={`Good to see you, ${firstName(profile?.full_name)}`}
        description="Here's your workspace at a glance. Pick a tool and let AI take the first pass."
      />

      <section aria-label="Overview" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            {tasksQuery.isLoading || outputsQuery.isLoading ? (
              <Skeleton className="mt-2 h-7 w-12" />
            ) : (
              <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
            )}
          </div>
        ))}
      </section>

      <section aria-label="Quick actions" className="mt-8">
        <h2 className="text-lg font-semibold tracking-tight">Quick actions</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-elevated"
            >
              <span className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium">{label}</span>
              </span>
              <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section aria-label="Today's focus">
          <h2 className="text-lg font-semibold tracking-tight">Today's focus</h2>
          {tasksQuery.isError ? (
            <ErrorState className="mt-3" message="Your tasks could not be loaded." onRetry={() => tasksQuery.refetch()} />
          ) : open.length === 0 ? (
            <EmptyState
              className="mt-3"
              icon={<CheckCircle2 className="size-5" aria-hidden="true" />}
              title="No open tasks"
              description="Add tasks in the Task Planner and let AI build a realistic daily schedule."
              action={
                <Button asChild size="sm">
                  <Link to="/tasks">Open Task Planner</Link>
                </Button>
              }
            />
          ) : (
            <ul className="mt-3 space-y-2">
              {open.slice(0, 6).map((task) => (
                <li
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 shadow-card"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{task.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {task.category}
                      {task.due_date ? ` · due ${task.due_date}` : ""}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-xs font-medium",
                      priorityClasses[task.priority] ?? priorityClasses.Medium,
                    )}
                  >
                    {task.priority}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Recent saved outputs">
          <h2 className="text-lg font-semibold tracking-tight">Recent saved outputs</h2>
          {outputsQuery.isError ? (
            <ErrorState className="mt-3" message="Your saved outputs could not be loaded." onRetry={() => outputsQuery.refetch()} />
          ) : outputs.length === 0 ? (
            <EmptyState
              className="mt-3"
              icon={<BookmarkCheck className="size-5" aria-hidden="true" />}
              title="Nothing saved yet"
              description="Anything you generate and save will appear here for quick reuse."
            />
          ) : (
            <ul className="mt-3 space-y-2">
              {outputs.slice(0, 6).map((output) => (
                <li
                  key={output.id}
                  className="rounded-lg border border-border bg-card px-4 py-3 shadow-card"
                >
                  <p className="truncate text-sm font-medium">{output.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {OUTPUT_KINDS[output.kind] ?? "Output"} ·{" "}
                    {new Date(output.updated_at).toLocaleDateString()}
                  </p>
                </li>
              ))}
              <li>
                <Button asChild variant="outline" size="sm">
                  <Link to="/saved">View all saved outputs</Link>
                </Button>
              </li>
            </ul>
          )}
        </section>
      </div>

      <div className="mt-8">
        <AIDisclaimer />
      </div>
    </>
  );
}
