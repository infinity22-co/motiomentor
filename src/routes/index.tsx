import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { TutorFace } from "@/components/TutorFace";
import { METHODS, type LearningMethod } from "@/lib/learning";
import { Eye, BookOpen, Headphones, PencilRuler } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gati — Learn Class 9 Motion with an AI tutor" },
      { name: "description", content: "Ms. Gati teaches Class 9 Motion, clears doubts, makes notes and diagrams — in the way you learn best." },
      { property: "og:title", content: "Gati — Learn Class 9 Motion with an AI tutor" },
      { property: "og:description", content: "Take a quick exam, find your learning style, and learn Motion your way." },
    ],
  }),
  component: Index,
});

const ICONS: Record<LearningMethod, typeof Eye> = { picture: Eye, reading: BookOpen, listening: Headphones, practice: PencilRuler };

function Index() {
  return (
    <div className="min-h-screen bg-hero">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="font-display text-2xl font-extrabold text-primary">gati.</span>
        <Button asChild variant="outline">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>
      <main className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-12 md:grid-cols-2 md:py-20">
        <div>
          <p className="mb-3 inline-block rounded-full bg-highlight px-3 py-1 text-sm font-bold">Class 9 Physics · Chapter: Motion</p>
          <h1 className="text-5xl font-extrabold leading-tight md:text-6xl">
            Your own AI teacher, <span className="text-primary">for how you learn.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Ms. Gati teaches the chapter, clears every doubt, draws diagrams and writes your notes. A short exam finds your best
            learning style first.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Start learning</Link>
            </Button>
          </div>
        </div>
        <div className="flex flex-col items-center gap-6">
          <TutorFace size={260} talking />
          <div className="rounded-2xl bg-card px-5 py-3 shadow-soft">
            “Displacement can be zero even when you've walked 200 m. Want me to draw why?”
          </div>
        </div>
      </main>
      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(METHODS) as LearningMethod[]).map((m) => {
          const Icon = ICONS[m];
          return (
            <div key={m} className="rounded-2xl border bg-card p-5">
              <Icon className="mb-3 h-7 w-7 text-accent" />
              <h3 className="text-lg font-bold">{METHODS[m].label}</h3>
              <p className="text-sm text-muted-foreground">{METHODS[m].blurb}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
