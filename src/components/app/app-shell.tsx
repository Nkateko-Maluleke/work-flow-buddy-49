import { Menu, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";

import { SidebarBrand, SidebarFooter, SidebarNav } from "@/components/app/app-sidebar";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { displayNameFromUser, useProfile, useSession } from "@/hooks/use-auth";
import { Moon, Sun } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user } = useSession();
  const { data: profile } = useProfile();
  const { theme, toggleTheme } = useTheme();

  const name = profile?.full_name || (user ? displayNameFromUser(user) : "");
  const email = user?.email ?? "";

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between gap-4 bg-sidebar p-3 lg:flex">
        <div className="space-y-5 overflow-y-auto">
          <SidebarBrand />
          <SidebarNav />
        </div>
        <SidebarFooter name={name} email={email} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open navigation">
                <Menu className="size-4" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-72 flex-col justify-between gap-4 bg-sidebar p-3"
            >
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="space-y-5 overflow-y-auto">
                <SidebarBrand />
                <SidebarNav onNavigate={() => setOpen(false)} />
              </div>
              <SidebarFooter name={name} email={email} />
            </SheetContent>
          </Sheet>

          <span className="flex items-center gap-2">
            <span className="gradient-ai flex size-7 items-center justify-center rounded-md">
              <Sparkles className="size-3.5 text-primary-foreground" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold">Workplace AI</span>
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun className="size-4" aria-hidden="true" />
            ) : (
              <Moon className="size-4" aria-hidden="true" />
            )}
          </Button>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
