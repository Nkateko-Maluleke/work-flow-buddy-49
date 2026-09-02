import { createFileRoute } from "@tanstack/react-router";

import { isUnsafePrompt, SAFETY_MESSAGE, SAFETY_SUFFIX } from "@/lib/safety";

export const Route = createFileRoute("/api/generate-visual")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { prompt, stream = true } = (await request.json()) as {
          prompt?: string;
          stream?: boolean;
        };

        if (!prompt || !prompt.trim()) {
          return new Response(JSON.stringify({ error: { message: "A prompt is required." } }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (isUnsafePrompt(prompt)) {
          return new Response(JSON.stringify({ error: { message: SAFETY_MESSAGE } }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return new Response(
            JSON.stringify({
              error: {
                message:
                  "Visual generation is not configured yet. AI credentials are missing on the server.",
              },
            }),
            { status: 503, headers: { "Content-Type": "application/json" } },
          );
        }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image",
            messages: [{ role: "user", content: `${prompt.trim()}\n\n${SAFETY_SUFFIX}` }],
            modalities: ["image", "text"],
            ...(stream ? { stream: true } : {}),
          }),
        });

        if (!upstream.ok || !upstream.body) {
          return new Response(await upstream.text(), {
            status: upstream.status,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!stream) {
          return new Response(upstream.body, {
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(upstream.body, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        });
      },
    },
  },
});
