import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/common/states";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — ALLORAXIA" },
      {
        name: "description",
        content:
          "Log in to ALLORAXIA to draft emails, summarize meetings, plan tasks and research topics with AI.",
      },
      { property: "og:title", content: "Log in — ALLORAXIA" },
      {
        property: "og:description",
        content: "Access your AI workplace productivity assistant.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please enter your email address and password.");
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  };

  const google = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in failed. Please try again or use your email address.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to pick up where you left off."
      footer={
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error ? <ErrorState title="Could not log in" message={error} /> : null}
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <div className="flex items-center gap-3 py-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button variant="outline" className="w-full" onClick={google}>
        Continue with Google
      </Button>
    </AuthLayout>
  );
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="px-4 py-5 sm:px-8">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <span className="gradient-ai flex size-8 items-center justify-center rounded-lg shadow-ai">
            <Sparkles className="size-4 text-primary-foreground" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold">ALLORAXIA</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 mb-6 text-sm text-muted-foreground">{subtitle}</p>
          {children}
          <div className="mt-6">{footer}</div>
        </div>
      </main>
    </div>
  );
}
