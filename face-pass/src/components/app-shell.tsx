import { ScanFace } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="grid place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-elevated)]"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <ScanFace size={size * 0.6} strokeWidth={2.2} />
      </div>
      <span className="text-xl font-extrabold tracking-tight text-foreground">
        Face<span className="text-primary">Pass</span>
      </span>
    </div>
  );
}

export function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Etapa {current} de {total}
      </span>
      <div className="flex flex-1 gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < current ? "bg-primary" : "bg-border",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-soft via-background to-background p-0 sm:p-6">
      <div className="relative flex h-screen w-full max-w-[420px] flex-col overflow-hidden bg-background shadow-none sm:h-[844px] sm:rounded-[2.5rem] sm:shadow-[0_30px_80px_-20px_oklch(0.52_0.09_180_/_0.25)]">
        {children}
      </div>
    </div>
  );
}
