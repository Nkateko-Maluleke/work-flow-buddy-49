import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { MessagesSquare, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AIDisclaimer, MarkdownView } from "@/components/ai/ai-output";
import { PageHeader } from "@/components/app/app-shell";
import { CopyButton } from "@/components/common/copy-button";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useProfile, useSession } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { chatReply } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat — ALLORAXIA" },
      {
        name: "description",
        content:
          "Chat with your workplace AI assistant for writing, planning, brainstorming and summarizing, with saved conversation history.",
      },
      { property: "og:title", content: "AI Chat — ALLORAXIA" },
      { property: "og:description", content: "A workplace AI assistant with saved history." },
    ],
  }),
  component: ChatPage,
});

type Conversation = { id: string; title: string; updated_at: string };
type Message = { id: string; role: "user" | "assistant"; content: string; created_at: string };

const SUGGESTIONS = [
  "Help me structure a project update for my manager.",
  "Turn these bullet points into a polite client reply.",
  "Suggest an agenda for a 30-minute team retro.",
  "Summarize the pros and cons of a four-day work week.",
];

function ChatPage() {
  const { user } = useSession();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const reply = useServerFn(chatReply);
  const endRef = useRef<HTMLDivElement>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversationsQuery = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("conversations")
        .select("id, title, updated_at")
        .order("updated_at", { ascending: false });
      if (queryError) throw queryError;
      return (data ?? []) as unknown as Conversation[];
    },
  });

  const messagesQuery = useQuery({
    queryKey: ["messages", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", activeId!)
        .order("created_at");
      if (queryError) throw queryError;
      return (data ?? []) as unknown as Message[];
    },
  });

  const messages = messagesQuery.data ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, busy]);

  const deleteConversation = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase.from("conversations").delete().eq("id", id);
      if (deleteError) throw deleteError;
    },
    onSuccess: (_data, id) => {
      if (activeId === id) setActiveId(null);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Conversation deleted");
    },
    onError: (caught: Error) => toast.error(caught.message),
  });

  const send = async (text: string) => {
    if (!user || !text.trim() || busy) return;
    setError(null);
    setBusy(true);
    setInput("");

    try {
      let conversationId = activeId;
      if (!conversationId) {
        const { data, error: insertError } = await supabase
          .from("conversations")
          .insert({ user_id: user.id, title: text.trim().slice(0, 60) })
          .select("id")
          .single();
        if (insertError) throw insertError;
        conversationId = data.id as string;
        setActiveId(conversationId);
      }

      const { error: userMsgError } = await supabase.from("messages").insert({
        user_id: user.id,
        conversation_id: conversationId,
        role: "user",
        content: text.trim(),
      });
      if (userMsgError) throw userMsgError;
      await queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });

      const history = [
        ...messages.map((message) => ({ role: message.role, content: message.content })),
        { role: "user" as const, content: text.trim() },
      ];

      const result = await reply({
        data: {
          history,
          responseLength: profile?.ai_response_length ?? "Medium",
          language: profile?.language ?? "English",
        },
      });

      const { error: aiMsgError } = await supabase.from("messages").insert({
        user_id: user.id,
        conversation_id: conversationId,
        role: "assistant",
        content: result.text,
      });
      if (aiMsgError) throw aiMsgError;

      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      await queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The assistant could not reply.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="AI Chat"
        description="Ask for help with writing, planning, brainstorming or summarizing. Your history is saved."
        actions={
          <Button variant="outline" size="sm" onClick={() => setActiveId(null)}>
            <Plus className="size-4" aria-hidden="true" />
            New chat
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        <section aria-label="Conversations" className="space-y-2">
          <h2 className="px-1 text-sm font-semibold">History</h2>
          {(conversationsQuery.data ?? []).length === 0 ? (
            <p className="px-1 text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {(conversationsQuery.data ?? []).map((conversation) => (
                <li key={conversation.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveId(conversation.id)}
                    className={cn(
                      "min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                      activeId === conversation.id && "border-primary/40 bg-accent",
                    )}
                  >
                    <span className="block truncate font-medium">{conversation.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${conversation.title}`}
                    onClick={() => deleteConversation.mutate(conversation.id)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-label="Conversation"
          className="flex min-h-[60vh] flex-col rounded-xl border border-border bg-card shadow-card"
        >
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && !busy ? (
              <EmptyState
                icon={<MessagesSquare className="size-5" aria-hidden="true" />}
                title="Start a conversation"
                description="Try one of these to get going:"
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTIONS.map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => send(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                }
              />
            ) : null}

            {messages.map((message) => (
              <article
                key={message.id}
                className={cn(
                  "max-w-[85%] rounded-xl px-4 py-3 text-sm",
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "border border-border bg-background",
                )}
              >
                {message.role === "assistant" ? (
                  <>
                    <MarkdownView content={message.content} />
                    <div className="mt-2">
                      <CopyButton value={message.content} />
                    </div>
                  </>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </article>
            ))}

            {busy ? (
              <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                The assistant is thinking…
              </p>
            ) : null}
            <div ref={endRef} />
          </div>

          {error ? (
            <div className="px-4 pb-2">
              <ErrorState message={error} />
            </div>
          ) : null}

          <form
            className="flex items-end gap-2 border-t border-border p-3"
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
          >
            <label className="sr-only" htmlFor="chat-input">
              Message
            </label>
            <Textarea
              id="chat-input"
              rows={2}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask anything about your work…"
              className="min-h-[52px] resize-none"
            />
            <Button type="submit" disabled={busy || !input.trim()} aria-label="Send message">
              <Send className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </section>
      </div>

      <div className="mt-6">
        <AIDisclaimer />
      </div>
    </>
  );
}
