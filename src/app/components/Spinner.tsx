import { Loader2 } from "lucide-react";
import { cn } from "./ui/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("size-4 animate-spin", className)}
      aria-hidden="true"
    />
  );
}

export function LoadingScreen({
  label = "Loading...",
}: {
  label?: string;
}) {
  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
    >
      <Spinner className="size-8 text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
