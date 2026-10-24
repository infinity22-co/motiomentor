import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai/run-id.server";

const MODEL = "openai/gpt-6-astra";

const STYLE: Record<string, string> = {
  picture:
    "The student learns best with PICTURES. Include a simple diagram in almost every answer (see diagram rules). Keep text short, use labelled visuals and analogies.",
  reading:
    "The student learns best by READING. Give well-structured notes: headings, bullet points, bold key terms, a short summary box at the end.",
  listening:
    "The student learns best by LISTENING. Your reply will be read aloud, so write in a warm, conversational spoken style, short sentences, no tables, avoid symbols where words work (say 'v equals u plus a t'). Avoid diagrams unless asked.",
  practice:
    "The student learns best by DOING. Teach through worked examples step by step (Step 1, Step 2…), then give one small practice question and ask them to try it before revealing the answer.",
};

function systemPrompt(method: string, name: string) {
  return `You are "Ms. Gati", a friendly AI physics tutor face for Indian CBSE Class 9 students, teaching the chapter "Motion" (NCERT).
Student name: ${name || "student"}.
Cover: rest & motion, distance vs displacement, speed vs velocity, average speed, acceleration, equations of motion (v=u+at, s=ut+½at², v²=u²+2as), distance–time and velocity–time graphs, uniform circular motion.
You teach, clear doubts, prepare notes, build diagrams and practice questions. Be encouraging, accurate and age-appropriate. Use SI units. Use markdown.
Learning style: ${STYLE[method] ?? STYLE["reading"]}
When asked for NOTES: produce complete revision notes with definitions, formulas, examples and a mnemonic.
DIAGRAM RULES: draw diagrams as a fenced code block with language "svg" containing one self-contained <svg xmlns="http://www.w3.org/2000/svg"> with a viewBox (about 400x260), simple shapes, lines, arrows and <text> labels, colours #0f766e, #f97316, #1e293b, background #fffdf7. No scripts, no external images, no foreignObject.
Stay on physics/learning topics; gently redirect off-topic questions.`;
}

async function authUser(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return { supabase, userId: data.claims.sub as string };
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await authUser(request);
        if (!user) return new Response("Please sign in again.", { status: 401 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI is not configured.", { status: 500 });

        const body = (await request.json()) as { messages: UIMessage[]; method?: string };
        const messages = body.messages ?? [];
        const { data: profile } = await user.supabase
          .from("profiles")
          .select("display_name, learning_method")
          .eq("id", user.userId)
          .maybeSingle();
        const method = body.method ?? profile?.learning_method ?? "reading";

        const last = messages[messages.length - 1];
        if (last?.role === "user") {
          const { error } = await user.supabase
            .from("chat_messages")
            .insert({ user_id: user.userId, message: last as never });
          if (error) console.error("save user msg failed", error);
        }

        const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch.fetch,
        });

        const result = streamText({
          model: provider.responses(MODEL) as unknown as Parameters<typeof streamText>[0]["model"],
          instructions: systemPrompt(method, profile?.display_name ?? ""),
          messages: await convertToModelMessages(messages.slice(-30)),
          abortSignal: request.signal,
          providerOptions: {
            openai: {
              store: false,
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              include: ["reasoning.encrypted_content"],
            },
          },
        });

        const res = result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ responseMessage }) => {
            const { error } = await user.supabase
              .from("chat_messages")
              .insert({ user_id: user.userId, message: responseMessage as never });
            if (error) console.error("save assistant msg failed", error);
          },
          onError: (e) => (e instanceof Error ? e.message : "The tutor had a problem. Please try again."),
        });
        return withLovableAiGatewayRunIdHeader(res, runIdFetch);
      },
    },
  },
});
