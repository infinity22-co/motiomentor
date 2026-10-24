import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TutorFace } from "@/components/TutorFace";
import { CONCEPT_QUESTIONS, METHODS, STYLE_QUESTIONS, scoreQuiz, type LearningMethod, type QuizResult } from "@/lib/learning";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/quiz")({
  head: () => ({
    meta: [
      { title: "Learning style exam — Gati" },
      { name: "description", content: "A short exam to find the learning method that suits you best." },
      { property: "og:title", content: "Learning style exam — Gati" },
      { property: "og:description", content: "A short exam to find the learning method that suits you best." },
    ],
  }),
  component: Quiz,
});

function Quiz() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const total = STYLE_QUESTIONS.length + CONCEPT_QUESTIONS.length;
  const [step, setStep] = useState(0);
  const [style, setStyle] = useState<LearningMethod[]>([]);
  const [concept, setConcept] = useState<number[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [saving, setSaving] = useState(false);

  function answerStyle(m: LearningMethod) {
    setStyle([...style, m]);
    setStep(step + 1);
  }
  function answerConcept(i: number) {
    const next = [...concept, i];
    setConcept(next);
    if (next.length === CONCEPT_QUESTIONS.length) setResult(scoreQuiz(style, next));
    else setStep(step + 1);
  }

  async function choose(m: LearningMethod) {
    if (!result) return;
    setSaving(true);
    await supabase.from("profiles").update({ learning_method: m, quiz_result: result as never, updated_at: new Date().toISOString() }).eq("id", user.id);
    navigate({ to: "/learn" });
  }

  const inStyle = step < STYLE_QUESTIONS.length;
  const styleQ = STYLE_QUESTIONS[step];
  const conceptQ = CONCEPT_QUESTIONS[step - STYLE_QUESTIONS.length];
  const q = (inStyle ? styleQ : conceptQ) ?? { q: "" };

  return (
    <div className="min-h-screen bg-hero px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-4">
          <TutorFace size={64} />
          <div>
            <h1 className="text-2xl font-extrabold">Let's find how you learn best</h1>
            <p className="text-sm text-muted-foreground">
              {result ? "Done!" : inStyle ? "Part 1 · How you like to learn" : "Part 2 · Quick thinking check"}
            </p>
          </div>
        </div>
        <Progress value={((result ? total : step) / total) * 100} className="mb-6" />

        {!result ? (
          <div className="rounded-3xl border bg-card p-6 shadow-soft">
            <h2 className="mb-5 text-xl font-bold">{q.q}</h2>
            <div className="grid gap-3">
              {inStyle
                ? (styleQ?.options ?? []).map((o) => (
                    <button key={o.text} onClick={() => answerStyle(o.method)} className="rounded-xl border p-4 text-left font-semibold transition hover:border-primary hover:bg-secondary">
                      {o.text}
                    </button>
                  ))
                : (conceptQ?.options ?? []).map((o, i) => (
                    <button key={o} onClick={() => answerConcept(i)} className="rounded-xl border p-4 text-left font-semibold transition hover:border-primary hover:bg-secondary">
                      {o}
                    </button>
                  ))}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border bg-card p-6 shadow-soft">
            <p className="text-muted-foreground">
              Thinking check: <b className="text-foreground">{result.conceptScore} / {result.conceptTotal}</b>
            </p>
            <h2 className="mt-2 text-2xl font-extrabold">
              Your best match: <span className="text-primary">{METHODS[result.recommended].label}</span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">You can pick any method — and switch anytime.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(Object.keys(METHODS) as LearningMethod[]).map((m) => (
                <button
                  key={m}
                  disabled={saving}
                  onClick={() => choose(m)}
                  className={cn("rounded-xl border p-4 text-left transition hover:border-primary", m === result.recommended && "border-primary bg-secondary")}
                >
                  <div className="font-bold">{METHODS[m].label}</div>
                  <div className="text-xs text-muted-foreground">{result.styleScores[m]} of {STYLE_QUESTIONS.length} answers · {METHODS[m].blurb}</div>
                </button>
              ))}
            </div>
            <Button className="mt-5 w-full" disabled={saving} onClick={() => choose(result.recommended)}>
              Start with {METHODS[result.recommended].label}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
