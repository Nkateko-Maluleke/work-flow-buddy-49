import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarClock, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AIOutput, type RefineAction } from "@/components/ai/ai-output";
import { PageHeader } from "@/components/app/app-shell";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile, useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { optimizeSchedule, refineText } from "@/lib/ai.functions";
import {
  LANGUAGES,
  PRIORITIES,
  TASK_CATEGORIES,
  priorityClasses,
  type Priority,
} from "@/lib/constants";
import { saveOutput } from "@/lib/outputs";
import { cn } from "@/lib/utils";
import { SelectField } from "./email";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — ALLORAXIA" },
      {
        name: "description",
        content:
          "Capture tasks with priority, duration and deadlines, then let AI build a realistic, time-blocked daily schedule.",
      },
      { property: "og:title", content: "AI Task Planner — ALLORAXIA" },
      { property: "og:description", content: "Task management with AI schedule optimization." },
    ],
  }),
  component: TasksPage,
});

type Task = {
  id: string;
  name: string;
  due_date: string | null;
  estimated_minutes: number;
  priority: Priority;
  category: string;
  completed: boolean;
};

function TasksPage() {
  const { user } = useSession();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const optimize = useServerFn(optimizeSchedule);
  const refine = useServerFn(refineText);

  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [priority, setPriority] = useState<string>("Medium");
  const [category, setCategory] = useState<string>("Work");
  const [hours, setHours] = useState("8");
  const [language, setLanguage] = useState(profile?.language ?? "English");
  const [plan, setPlan] = useState("");
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tasksQuery = useQuery({
    queryKey: ["tasks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("tasks")
        .select("id, name, due_date, estimated_minutes, priority, category, completed")
        .order("completed")
        .order("created_at", { ascending: false });
      if (queryError) throw queryError;
      return (data ?? []) as unknown as Task[];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tasks"] });

  const addTask = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You need to be signed in.");
      const { error: insertError } = await supabase.from("tasks").insert({
        user_id: user.id,
        name: name.trim(),
        due_date: dueDate || null,
        estimated_minutes: Math.max(5, Number(minutes) || 30),
        priority,
        category,
      });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      setName("");
      setDueDate("");
      setMinutes("30");
      invalidate();
      toast.success("Task added");
    },
    onError: (caught: Error) => toast.error(caught.message),
  });

  const toggleTask = useMutation({
    mutationFn: async (task: Task) => {
      const { error: updateError } = await supabase
        .from("tasks")
        .update({ completed: !task.completed })
        .eq("id", task.id);
      if (updateError) throw updateError;
    },
    onSuccess: invalidate,
    onError: (caught: Error) => toast.error(caught.message),
  });

  const removeTask = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase.from("tasks").delete().eq("id", id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Task deleted");
    },
    onError: (caught: Error) => toast.error(caught.message),
  });

  const tasks = tasksQuery.data ?? [];
  const openTasks = tasks.filter((task) => !task.completed);

  const run = async () => {
    if (openTasks.length === 0) {
      setError("Add at least one open task before optimizing your schedule.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const list = openTasks
        .map(
          (task) =>
            `- ${task.name} | priority: ${task.priority} | ${task.estimated_minutes} min | category: ${task.category} | due: ${task.due_date ?? "no deadline"}`,
        )
        .join("\n");
      const result = await optimize({ data: { tasks: list, availableHours: hours, language } });
      setPlan(result.text);
      setDemo(result.demo);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The schedule could not be generated.");
    } finally {
      setBusy(false);
    }
  };

  const applyRefine = async (action: RefineAction) => {
    setBusy(true);
    try {
      const result = await refine({ data: { text: plan, action } });
      setPlan(result.text);
      setDemo(result.demo);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The plan could not be refined.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    try {
      await saveOutput({
        kind: "plan",
        title: `Daily plan — ${new Date().toLocaleDateString()}`,
        content: plan,
        metadata: { hours, language, taskCount: openTasks.length },
      });
      toast.success("Saved to your library");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not save this plan.");
    }
  };

  return (
    <>
      <PageHeader
        title="AI Task Planner"
        description="Track what needs doing, then let AI turn it into a realistic day with breaks and buffers."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <section
          aria-label="Add a task"
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-card"
        >
          <h2 className="text-sm font-semibold">Add a task</h2>
          <div className="space-y-2">
            <Label htmlFor="task-name">Task</Label>
            <Input
              id="task-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Draft the Q3 client report"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="due">Deadline</Label>
              <Input
                id="due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minutes">Minutes</Label>
              <Input
                id="minutes"
                type="number"
                min={5}
                step={5}
                value={minutes}
                onChange={(event) => setMinutes(event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Priority"
              value={priority}
              onChange={setPriority}
              options={[...PRIORITIES]}
            />
            <SelectField
              label="Category"
              value={category}
              onChange={setCategory}
              options={[...TASK_CATEGORIES]}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => addTask.mutate()}
            disabled={!name.trim() || addTask.isPending}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add task
          </Button>

          <div className="space-y-4 border-t border-border pt-4">
            <h2 className="text-sm font-semibold">Optimize my schedule</h2>
            <div className="space-y-2">
              <Label htmlFor="hours">Available focus hours today</Label>
              <Input
                id="hours"
                type="number"
                min={1}
                max={16}
                value={hours}
                onChange={(event) => setHours(event.target.value)}
              />
            </div>
            <SelectField
              label="Language"
              value={language}
              onChange={setLanguage}
              options={[...LANGUAGES]}
            />
            <Button onClick={run} disabled={busy} variant="default" className="w-full">
              <Sparkles className="size-4" aria-hidden="true" />
              {busy ? "Planning…" : "Optimize my schedule"}
            </Button>
          </div>
        </section>

        <div className="space-y-6">
          <section aria-label="Your tasks">
            <h2 className="text-lg font-semibold tracking-tight">Your tasks</h2>
            {tasksQuery.isLoading ? (
              <LoadingState className="mt-3" message="Loading your tasks…" />
            ) : tasksQuery.isError ? (
              <ErrorState
                className="mt-3"
                message="Your tasks could not be loaded."
                onRetry={() => tasksQuery.refetch()}
              />
            ) : tasks.length === 0 ? (
              <EmptyState
                className="mt-3"
                icon={<CalendarClock className="size-5" aria-hidden="true" />}
                title="No tasks yet"
                description="Add your first task on the left to start planning your day."
              />
            ) : (
              <ul className="mt-3 space-y-2">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-card"
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTask.mutate(task)}
                      aria-label={`Mark ${task.name} as ${task.completed ? "not done" : "done"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-sm font-medium",
                          task.completed && "text-muted-foreground line-through",
                        )}
                      >
                        {task.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {task.category} · {task.estimated_minutes} min
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
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${task.name}`}
                      onClick={() => removeTask.mutate(task.id)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {error ? <ErrorState message={error} onRetry={run} /> : null}
          {busy && !plan ? <LoadingState message="Building your daily plan…" /> : null}
          {plan ? (
            <AIOutput
              title="Suggested daily plan"
              value={plan}
              onChange={setPlan}
              demo={demo}
              busy={busy}
              onRegenerate={run}
              onRefine={applyRefine}
              onSave={save}
              exportName="daily-plan.txt"
              disclaimerExtra="Adjust the plan around meetings and commitments AI cannot see."
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
