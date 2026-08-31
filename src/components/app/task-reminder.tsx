import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlarmClock, Check, PartyPopper, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProfile, useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { priorityClasses, type Priority } from "@/lib/constants";
import { pickHeadline, pickQuip } from "@/lib/reminder-quips";
import { cn } from "@/lib/utils";

type ReminderTask = {
  id: string;
  name: string;
  due_date: string | null;
  estimated_minutes: number;
  priority: Priority;
  category: string;
};

const SNOOZE_KEY = "alloraxia:reminder-snooze-until";
const FIRST_DELAY_MS = 12_000;
const REPEAT_MS = 25 * 60 * 1000;
const SNOOZE_MS = 30 * 60 * 1000;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function snoozedUntil() {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem(SNOOZE_KEY) ?? 0);
}

export function TaskReminder() {
  const { user } = useSession();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState(0);
  const [completing, setCompleting] = useState<string | null>(null);

  const enabled = !!user && profile?.notifications_enabled !== false;

  const tasksQuery = useQuery({
    queryKey: ["reminder-tasks", user?.id],
    enabled,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, name, due_date, estimated_minutes, priority, category")
        .eq("completed", false)
        .order("due_date", { nullsFirst: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as ReminderTask[];
    },
  });

  const { overdue, dueToday, upcoming } = useMemo(() => {
    const all = tasksQuery.data ?? [];
    const today = todayISO();
    return {
      overdue: all.filter((task) => task.due_date && task.due_date < today),
      dueToday: all.filter((task) => task.due_date === today),
      upcoming: all.filter((task) => !task.due_date || task.due_date > today),
    };
  }, [tasksQuery.data]);

  const focus = [...overdue, ...dueToday, ...upcoming].slice(0, 3);
  const total = overdue.length + dueToday.length + upcoming.length;

  useEffect(() => {
    if (!enabled || total === 0) return;
    let cancelled = false;
    const trigger = () => {
      if (cancelled || Date.now() < snoozedUntil()) return;
      setSeed(Date.now());
      setOpen(true);
    };
    const first = window.setTimeout(trigger, FIRST_DELAY_MS);
    const repeat = window.setInterval(trigger, REPEAT_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(first);
      window.clearInterval(repeat);
    };
  }, [enabled, total]);

  const quip = useMemo(() => pickQuip(seed || 1), [seed]);
  const headline = useMemo(() => pickHeadline(seed || 1), [seed]);

  const snooze = () => {
    window.localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    setOpen(false);
  };

  const complete = async (task: ReminderTask) => {
    setCompleting(task.id);
    try {
      await supabase.from("tasks").update({ completed: true }).eq("id", task.id);
      await queryClient.invalidateQueries({ queryKey: ["reminder-tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } finally {
      setCompleting(null);
    }
  };

  if (!enabled || total === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <div className="gradient-ai px-6 py-5 text-primary-foreground">
          <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider opacity-90">
            <AlarmClock className="size-4" aria-hidden="true" />
            Task reminder
          </span>
          <DialogHeader className="mt-2 space-y-1 text-left">
            <DialogTitle className="text-xl text-primary-foreground">{headline}</DialogTitle>
            <DialogDescription className="text-primary-foreground/85">
              {overdue.length > 0
                ? `${overdue.length} task${overdue.length === 1 ? "" : "s"} slipped past its deadline`
                : dueToday.length > 0
                  ? `${dueToday.length} task${dueToday.length === 1 ? "" : "s"} due today`
                  : `${total} open task${total === 1 ? "" : "s"} on your plan`}
              {" · "}
              {total} open in total
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-6 pb-6 pt-5">
          <ul className="space-y-2">
            {focus.map((task) => {
              const overdueTask = !!task.due_date && task.due_date < todayISO();
              return (
                <li
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{task.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {task.category} · {task.estimated_minutes} min
                      {task.due_date ? ` · ${overdueTask ? "overdue" : "due"} ${task.due_date}` : ""}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "hidden rounded-full border px-2 py-0.5 text-xs font-medium sm:inline",
                      priorityClasses[task.priority] ?? priorityClasses.Medium,
                    )}
                  >
                    {task.priority}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Mark ${task.name} as done`}
                    disabled={completing === task.id}
                    onClick={() => void complete(task)}
                  >
                    <Check className="size-4" aria-hidden="true" />
                  </Button>
                </li>
              );
            })}
          </ul>

          <div className="rounded-lg border border-primary/20 bg-accent/60 px-4 py-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="size-3.5" aria-hidden="true" />
              {quip.label} to keep it light
            </span>
            <p className="mt-1 text-sm text-foreground">{quip.text}</p>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="ghost" onClick={snooze}>
              Snooze 30 min
            </Button>
            <Button asChild onClick={() => setOpen(false)}>
              <Link to="/tasks">
                <PartyPopper className="size-4" aria-hidden="true" />
                Open task planner
              </Link>
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
