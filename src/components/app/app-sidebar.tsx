import { Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarClock,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Mail,
  MessagesSquare,
  Moon,
  Notebook,
  Search,
  Settings,
  Sparkles,
  Sun,
  BookmarkCheck,
} from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { firstName } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/chat", label: "AI Chat", icon: MessagesSquare },
  { to: "/email", label: "Email Generator", icon: Mail },
  { to: "/meetings", label: "Meeting Summarizer", icon: Notebook },
  { to: "/tasks", label: "Task Planner", icon: CalendarClock },
  { to: "/research", label: "Research Assistant", icon: Search },
  { to: "/saved", label: "Saved Outputs", icon: BookmarkCheck },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function SidebarBrand() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5 px-2 py-1">
      <span className="gradient-ai flex size-9 shrink-0 items-center justify-center rounded-lg shadow-ai">
        <Sparkles className="size-4 text-primary-foreground" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-sidebar-accent-foreground">
          ALLORAXIA
        </span>
        <span className="block truncate text-xs text-sidebar-foreground/70">
          Productivity Assistant
        </span>
      </span>
    </Link>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1">
      {navItems.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{
            className: cn(
              "bg-sidebar-primary/18 text-sidebar-accent-foreground",
              "before:absolute before:left-0 before:h-6 before:w-0.5 before:rounded-full before:bg-sidebar-primary relative",
            ),
          }}
        >
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function SidebarFooter({ name, email }: { name: string; email: string }) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="space-y-3 border-t border-sidebar-border pt-3">
      <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/60 px-3 py-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
          {(firstName(name)[0] ?? "U").toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-sidebar-accent-foreground">
            {name || "Your profile"}
          </span>
          <span className="block truncate text-xs text-sidebar-foreground/70">{email}</span>
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="flex-1 justify-start text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun className="size-4" aria-hidden="true" />
          ) : (
            <Moon className="size-4" aria-hidden="true" />
          )}
          {theme === "dark" ? "Light" : "Dark"}
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Help"
              className="text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <CircleHelp className="size-4" aria-hidden="true" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>How to use ALLORAXIA</DialogTitle>
              <DialogDescription>
                Every tool follows the same flow: give input, let AI process it, review and edit the
                result, then save or export it.
              </DialogDescription>
            </DialogHeader>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Use the Email Generator for drafts — nothing is ever sent automatically.</li>
              <li>• Paste raw meeting notes into the Summarizer for decisions and action items.</li>
              <li>• Add tasks, then run “Optimize My Schedule” for a realistic plan.</li>
              <li>• The Research Assistant never invents citations — verify sources yourself.</li>
              <li>• Anything you save appears under Saved Outputs.</li>
            </ul>
          </DialogContent>
        </Dialog>

        <Button
          variant="ghost"
          size="icon"
          onClick={signOut}
          aria-label="Sign out"
          className="text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
