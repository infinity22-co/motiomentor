import face from "@/assets/tutor-face.jpg";
import { cn } from "@/lib/utils";

export function TutorFace({ talking, size = 96, className }: { talking?: boolean; size?: number; className?: string }) {
  return (
    <img
      src={face}
      alt="Ms. Gati, your AI tutor"
      width={size}
      height={size}
      className={cn("rounded-full border-4 border-card object-cover shadow-soft", talking && "animate-talk", className)}
      style={{ width: size, height: size }}
    />
  );
}
