import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/app-shell";
import { ErrorState, LoadingState } from "@/components/common/states";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useProfile, useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  LANGUAGES,
  REFERENCE_STYLES,
  RESPONSE_LENGTHS,
  TIME_ZONES,
  TONES,
} from "@/lib/constants";
import { SelectField } from "./email";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ALLORAXIA" },
      {
        name: "description",
        content:
          "Manage your profile, default AI tone, language, time zone, reference style and appearance preferences.",
      },
      { property: "og:title", content: "Settings — ALLORAXIA" },
      { property: "og:description", content: "Manage your profile and AI preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const { data: profile, isLoading, isError, refetch, invalidate } = useProfile();
  const { theme, setTheme } = useTheme();

  const [form, setForm] = useState({
    full_name: "",
    language: "English",
    time_zone: "UTC",
    default_email_tone: "Professional",
    default_reference_style: "APA 7",
    ai_response_length: "Medium",
    notifications_enabled: true,
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name,
      language: profile.language,
      time_zone: profile.time_zone,
      default_email_tone: profile.default_email_tone,
      default_reference_style: profile.default_reference_style,
      ai_response_length: profile.ai_response_length,
      notifications_enabled: profile.notifications_enabled,
    });
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You need to be signed in.");
      const { error } = await supabase
        .from("profiles")
        .update({ ...form, theme })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Preferences saved");
    },
    onError: (caught: Error) => toast.error(caught.message),
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (isLoading) return <LoadingState message="Loading your settings…" />;
  if (isError)
    return <ErrorState message="Your settings could not be loaded." onRetry={() => refetch()} />;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your defaults are applied across every tool in the workspace."
      />

      <div className="grid max-w-3xl gap-6">
        <section
          aria-label="Profile"
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-card"
        >
          <h2 className="text-sm font-semibold">Profile</h2>
          <div className="space-y-2">
            <Label htmlFor="full-name">Full name</Label>
            <Input
              id="full-name"
              value={form.full_name}
              onChange={(event) => setForm({ ...form, full_name: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-address">Email address</Label>
            <Input id="email-address" value={user?.email ?? ""} readOnly disabled />
          </div>
        </section>

        <section
          aria-label="AI preferences"
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-card"
        >
          <h2 className="text-sm font-semibold">AI preferences</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Default email tone"
              value={form.default_email_tone}
              onChange={(value) => setForm({ ...form, default_email_tone: value })}
              options={[...TONES]}
            />
            <SelectField
              label="Response length"
              value={form.ai_response_length}
              onChange={(value) => setForm({ ...form, ai_response_length: value })}
              options={[...RESPONSE_LENGTHS]}
            />
            <SelectField
              label="Language"
              value={form.language}
              onChange={(value) => setForm({ ...form, language: value })}
              options={[...LANGUAGES]}
            />
            <SelectField
              label="Reference style"
              value={form.default_reference_style}
              onChange={(value) => setForm({ ...form, default_reference_style: value })}
              options={[...REFERENCE_STYLES]}
            />
            <SelectField
              label="Time zone"
              value={form.time_zone}
              onChange={(value) => setForm({ ...form, time_zone: value })}
              options={[...TIME_ZONES]}
            />
          </div>
        </section>

        <section
          aria-label="Appearance and notifications"
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-card"
        >
          <h2 className="text-sm font-semibold">Appearance & notifications</h2>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="dark-mode" className="font-normal">
              Dark mode
            </Label>
            <Switch
              id="dark-mode"
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="notifications" className="font-normal">
              In-app notifications
            </Label>
            <Switch
              id="notifications"
              checked={form.notifications_enabled}
              onCheckedChange={(checked) => setForm({ ...form, notifications_enabled: checked })}
            />
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save preferences"}
          </Button>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </div>
    </>
  );
}
