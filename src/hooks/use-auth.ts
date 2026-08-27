import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export type Profile = {
  id: string;
  full_name: string;
  language: string;
  time_zone: string;
  default_email_tone: string;
  default_reference_style: string;
  ai_response_length: string;
  theme: string;
  notifications_enabled: boolean;
};

export function useProfile() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as Profile;
      const inserted = await supabase
        .from("profiles")
        .insert({ id: user!.id, full_name: displayNameFromUser(user!) })
        .select("*")
        .single();
      if (inserted.error) throw inserted.error;
      return inserted.data as Profile;
    },
  });

  return { ...query, invalidate: () => queryClient.invalidateQueries({ queryKey: ["profile"] }) };
}

export function displayNameFromUser(user: User) {
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  return meta?.full_name || meta?.name || (user.email ?? "there").split("@")[0]!;
}

export function firstName(name: string | undefined | null) {
  if (!name) return "there";
  return name.trim().split(/\s+/)[0] || "there";
}
