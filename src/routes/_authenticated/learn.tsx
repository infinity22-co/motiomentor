import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TutorFace } from "@/components/TutorFace";
import { TutorMarkdown, speakableText } from "@/components/TutorMessage";
import { METHODS, TOPICS, isMethod, type LearningMethod } from "@/lib/learning";
import packAsset from "@/assets/motion-pack.png.asset.json";
import { cn } from "@/lib/utils";
import { Send, Volume2, VolumeX, Square, LogOut, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/learn")({
  head: () => ({
    meta: [
      { title: "Learn Motion — Gati" },
      { name: "description", content: "Learn Class 9 Motion with Ms. Gati, your AI tutor." },
      { property: "og:title", content: "Learn Motion — Gati" },
      { property: "og:description", content: "Learn Class 9 Motion with Ms. Gati, your AI tutor." },
    ],
  }),
  loader: async ({ context }) => {
    const userId = context.user.id;
    const [{ data: profile }, { data: rows }] = await Promise.all([
      supabase.from("profiles").select("display_name, learning_method").eq("id", userId).maybeSingle(),
      supabase.from("chat_messages").select("message").eq("user_id", userId).order("created_at"),
    ]);
    if (!profile?.learning_method) throw redirect({ to: "/quiz" });
    return {
      name: profile.display_name ?? "",
      method: (isMethod(profile.learning_method) ? profile.learning_method : "reading") as LearningMethod,
      messages: (rows ?? []).map((r) => r.message as unknown as UIMessage),
    };
  },
  component: Learn,
});

function msgText(m: UIMessage) {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

function Learn() {
  const data = Route.useLoaderData();
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const navigate = useNavigate();
  const [method, setMethod] = useState<LearningMethod>(data.method);
  const [input, setInput] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [voiceOn, setVoiceOn] = useState(data.method === "listening");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const methodRef = useRef(method);
  methodRef.current = method;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async (): Promise<Record<string, string>> => {
          const { data: s } = await supabase.auth.getSession();
          return s.session ? { Authorization: `Bearer ${s.session.access_token}` } : {};
        },
        body: () => ({ method: methodRef.current }),
      }),
    [],
  );

  const { messages, sendMessage, status, stop, error, setMessages } = useChat({
    id: user.id,
    messages: data.messages,
    transport,
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);
  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy]);

  // Speak finished assistant replies when voice is on
  const lastSpoken = useRef<string | null>(null);
  useEffect(() => {
    if (status !== "ready" || !voiceOn) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || lastSpoken.current === last.id) return;
    if (lastSpoken.current === null && data.messages.some((m) => m.id === last.id)) {
      lastSpoken.current = last.id;
      return;
    }
    lastSpoken.current = last.id;
    speak(msgText(last));
  }, [status, messages, voiceOn, data.messages]);

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(speakableText(text));
    u.lang = "en-IN";
    u.rate = 0.98;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }
  function stopSpeaking() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  function ask(text: string) {
    if (!text.trim() || busy) return;
    sendMessage({ text });
    setInput("");
  }

  async function changeMethod(m: LearningMethod) {
    setMethod(m);
    if (m === "listening") setVoiceOn(true);
    await supabase.from("profiles").update({ learning_method: m }).eq("id", user.id);
  }

  async function clearChat() {
    await supabase.from("chat_messages").delete().eq("user_id", user.id);
    setMessages([]);
  }

  async function signOut() {
    stopSpeaking();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
    router.invalidate();
  }

  const quick = [
    { label: "Teach me the chapter from the start", text: "Teach me the chapter Motion from the very beginning, one concept at a time." },
    { label: "Make my notes", text: "Prepare complete revision notes for the whole chapter Motion." },
    { label: "Draw a diagram", text: "Draw a labelled diagram showing distance vs displacement for a person walking around a park." },
    { label: "Give me a practice question", text: "Give me one practice numerical on equations of motion and guide me step by step." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="font-display text-xl font-extrabold text-primary">gati.</Link>
          <span className="hidden text-sm text-muted-foreground sm:inline">Class 9 · Motion</span>
          <div className="ml-auto flex flex-wrap items-center gap-1 rounded-full bg-muted p-1">
            {(Object.keys(METHODS) as LearningMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => changeMethod(m)}
                className={cn("rounded-full px-3 py-1 text-sm font-bold transition", method === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                {METHODS[m].short}
              </button>
            ))}
          </div>
          <Button asChild variant="ghost" size="sm"><Link to="/quiz">Retake exam</Link></Button>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Study panel */}
        <section className="space-y-4">
          <div className="rounded-3xl border bg-card p-5">
            <h2 className="text-xl font-extrabold">{METHODS[method].label}</h2>
            <p className="text-sm text-muted-foreground">{METHODS[method].blurb}</p>
          </div>

          {method === "picture" && (
            <div className="rounded-3xl border bg-card p-3">
              <a href={packAsset.url} target="_blank" rel="noreferrer">
                <img src={packAsset.url} alt="Motion student learning pack: concept sheets, mnemonics, activities and practice test" className="w-full rounded-2xl" />
              </a>
              <p className="px-2 pt-2 text-xs text-muted-foreground">Tap to open full size. Ask Ms. Gati about any sheet.</p>
            </div>
          )}

          <div className="rounded-3xl border bg-card p-5">
            <h3 className="mb-3 font-bold">Topics</h3>
            <div className="grid gap-2">
              {TOPICS.map((t, i) => (
                <button
                  key={t}
                  disabled={busy}
                  onClick={() =>
                    ask(
                      method === "practice"
                        ? `Give me a step-by-step worked example and then a practice question on: ${t}`
                        : method === "picture"
                          ? `Explain "${t}" with a diagram.`
                          : `Teach me: ${t}`,
                    )
                  }
                  className="flex items-center gap-3 rounded-xl border p-3 text-left text-sm font-semibold transition hover:border-primary hover:bg-secondary disabled:opacity-50"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-highlight text-xs font-extrabold">{i + 1}</span>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Tutor */}
        <section className="flex h-[calc(100vh-7rem)] flex-col rounded-3xl border bg-card lg:sticky lg:top-20">
          <div className="flex items-center gap-4 border-b p-4">
            <TutorFace size={72} talking={busy || speaking} />
            <div className="flex-1">
              <div className="font-display text-lg font-bold">Ms. Gati</div>
              <div className="text-sm text-muted-foreground">
                {status === "submitted" ? "Thinking…" : status === "streaming" ? "Explaining…" : speaking ? "Speaking…" : `Hi ${data.name || "there"}! Ask me any doubt.`}
              </div>
            </div>
            {speaking ? (
              <Button variant="outline" size="icon" onClick={stopSpeaking} aria-label="Stop speaking"><Square className="h-4 w-4" /></Button>
            ) : null}
            <Button variant="ghost" size="icon" onClick={() => setVoiceOn(!voiceOn)} aria-label={voiceOn ? "Turn voice off" : "Turn voice on"}>
              {voiceOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" onClick={clearChat} aria-label="Clear chat"><RotateCcw className="h-4 w-4" /></Button>
            )}
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="grid gap-2">
                {quick.map((q) => (
                  <button key={q.label} onClick={() => ask(q.text)} className="rounded-xl border bg-muted p-3 text-left text-sm font-semibold hover:border-primary">
                    {q.label}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-ink px-4 py-2 text-ink-foreground">{msgText(m)}</div>
              ) : (
                <div key={m.id} className="max-w-full">
                  <TutorMarkdown text={msgText(m)} />
                  {msgText(m) && (
                    <button onClick={() => speak(msgText(m))} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      <Volume2 className="h-3 w-3" /> Listen
                    </button>
                  )}
                </div>
              ),
            )}
            {status === "submitted" && <div className="text-sm text-muted-foreground">Ms. Gati is thinking…</div>}
            {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error.message || "Something went wrong. Please try again."}</div>}
            <div ref={endRef} />
          </div>

          {messages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto px-4 pb-2">
              {quick.slice(1).map((q) => (
                <button key={q.label} disabled={busy} onClick={() => ask(q.text)} className="shrink-0 rounded-full border px-3 py-1 text-xs font-semibold hover:border-primary disabled:opacity-50">
                  {q.label}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-end gap-2 border-t p-3"
          >
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              placeholder="Ask a doubt… e.g. Why is velocity a vector?"
              rows={1}
              className="min-h-11 resize-none"
            />
            {busy ? (
              <Button type="button" size="icon" variant="outline" onClick={() => stop()} aria-label="Stop"><Square className="h-4 w-4" /></Button>
            ) : (
              <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}
