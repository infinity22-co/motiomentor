import { cn } from "@/lib/utils";

/** Text-only teacher label — no photo, no persona name. */
export function TeacherBadge({ talking, size = "md", className }: { talking?: boolean; size?: "sm" | "md" | "lg"; className?: string }) {
  const text = size === "lg" ? "px-5 py-2 text-2xl" : size === "md" ? "px-4 py-1.5 text-lg" : "px-3 py-1 text-sm";
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2 rounded-full border bg-secondary font-display font-extrabold text-primary", text, className)}>
      <span className={cn("h-2 w-2 rounded-full bg-accent", talking && "animate-talk")} />
      Teacher
    </span>
  );
}
