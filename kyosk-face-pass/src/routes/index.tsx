import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ScanFace, CheckCircle2, UserX, Store, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FacePass Entrada — Reconhecimento Facial" },
      { name: "description", content: "Kiosk de reconhecimento facial para entrada em loja." },
    ],
  }),
  component: KioskPage,
});

type KioskState = "idle" | "recognizing" | "success" | "error";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function formatDateTime(date: Date): string {
  const weekday = WEEKDAYS[date.getDay()];
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${weekday} - ${day}/${month}/${year}, ${hours}:${minutes}`;
}

function KioskPage() {
  const [state, setState] = useState<KioskState>("idle");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraDenied, setCameraDenied] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nextOutcomeRef = useRef<"success" | "error">("success");
  const [now, setNow] = useState(() => new Date());

  // Clock tick
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Camera setup
  useEffect(() => {
    let cancelled = false;
    async function start() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setCameraDenied(true);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraReady(true);
      } catch {
        setCameraDenied(true);
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const simulate = (outcome: "success" | "error") => {
    clearTimers();
    nextOutcomeRef.current = outcome;
    setState("recognizing");
    timersRef.current.push(
      setTimeout(() => {
        setState(outcome);
        if (outcome === "success") {
          timersRef.current.push(setTimeout(() => setState("idle"), 3000));
        }
      }, 2000),
    );
  };

  const resetToIdle = () => {
    clearTimers();
    setState("idle");
  };

  const ringClass =
    state === "success"
      ? "ring-[var(--kiosk-success)] shadow-[0_0_60px_-10px_var(--kiosk-success)]"
      : state === "error"
        ? "ring-[var(--kiosk-error)] shadow-[0_0_60px_-10px_var(--kiosk-error)]"
        : "ring-[var(--kiosk-primary)] shadow-[0_0_50px_-15px_var(--kiosk-primary)]";

  const bgTint =
    state === "success"
      ? "bg-[var(--kiosk-success-bg)]"
      : state === "error"
        ? "bg-[var(--kiosk-error-bg)]"
        : "bg-[var(--kiosk-bg)]";

  return (
    <main
      className={cn(
        "relative min-h-screen w-full overflow-hidden transition-colors duration-700",
        bgTint,
      )}
    >
      {/* Top brand */}
      <header className="flex items-center justify-center pt-10 pb-4">
        <div className="flex items-center gap-2 text-[var(--kiosk-primary)]">
          <Store className="h-6 w-6" />
          <span className="text-lg font-semibold tracking-tight">FacePass · Entrada</span>
        </div>
      </header>

      {/* Date / time */}
      <div className="flex items-center justify-center pb-2">
        <span className="text-sm font-medium tabular-nums text-[var(--kiosk-muted)]">
          {formatDateTime(now)}
        </span>
      </div>

      {/* Center viewfinder */}
      <section className="flex flex-col items-center px-8 pt-6">
        <div className="relative">
          {/* Animated scanning sweep during recognizing */}
          {state === "recognizing" && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <div className="h-[22rem] w-[22rem] animate-spin rounded-full border-4 border-transparent border-t-[var(--kiosk-primary)] border-r-[var(--kiosk-primary)]/40 [animation-duration:1.4s]" />
            </div>
          )}

          {/* Circular frame */}
          <div
            className={cn(
              "relative h-[22rem] w-[22rem] overflow-hidden rounded-full bg-black/5 ring-8 ring-offset-4 ring-offset-transparent transition-all duration-500",
              ringClass,
              state === "idle" && "animate-pulse-soft",
            )}
          >
            {!cameraDenied ? (
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="h-full w-full object-cover [transform:scaleX(-1)]"
                style={{ opacity: cameraReady ? 1 : 0 }}
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[var(--kiosk-surface)] text-[var(--kiosk-muted)]">
                <ScanFace className="h-32 w-32" strokeWidth={1.2} />
              </div>
            )}

            {/* Success badge overlay */}
            {state === "success" && (
              <div className="absolute bottom-4 right-4 z-30 animate-scale-in rounded-full bg-[var(--kiosk-success)] p-3 shadow-xl">
                <CheckCircle2 className="h-12 w-12 text-white" strokeWidth={2.5} />
              </div>
            )}
          </div>

          {cameraDenied && (
            <p className="mt-3 text-center text-xs text-[var(--kiosk-muted)]">
              Câmera não disponível — exibindo simulação
            </p>
          )}
        </div>

        {/* Status content */}
        <div
          key={state}
          className="mt-12 flex w-full max-w-xl animate-fade-in flex-col items-center text-center"
        >
          {state === "idle" && (
            <>
              <div className="mb-4 flex items-center gap-3 text-[var(--kiosk-primary)]">
                <ScanFace className="h-9 w-9" />
              </div>
              <h1 className="text-4xl font-bold leading-tight text-[var(--kiosk-fg)]">
                Posicione seu rosto na câmera
              </h1>
              <p className="mt-3 text-xl text-[var(--kiosk-muted)]">
                Aguardando reconhecimento facial...
              </p>
            </>
          )}

          {state === "recognizing" && (
            <>
              <h1 className="text-4xl font-bold leading-tight text-[var(--kiosk-fg)]">
                Reconhecendo...
              </h1>
              <p className="mt-3 text-xl text-[var(--kiosk-muted)]">Aguarde um momento</p>
            </>
          )}

          {state === "success" && (
            <>
              <div className="mb-4 flex items-center gap-3">
                <CheckCircle2 className="h-10 w-10 text-[var(--kiosk-success)]" />
              </div>
              <h1 className="text-5xl font-bold leading-tight text-[var(--kiosk-success)]">
                Acesso liberado!
              </h1>
              <p className="mt-3 text-xl text-[var(--kiosk-muted)]">
                Bem-vindo(a)! Boas compras.
              </p>
            </>
          )}

          {state === "error" && (
            <>
              <div className="mb-4 flex items-center gap-3">
                <UserX className="h-10 w-10 text-[var(--kiosk-error)]" />
              </div>
              <h1 className="text-4xl font-bold leading-tight text-[var(--kiosk-error)]">
                Não foi possível reconhecer seu rosto
              </h1>
              <p className="mt-3 text-lg text-[var(--kiosk-muted)]">
                Tente novamente ou ajuste a posição do seu rosto. Se o problema persistir, procure
                um colaborador.
              </p>
              <Button
                onClick={resetToIdle}
                className="mt-8 h-14 rounded-full bg-[var(--kiosk-primary)] px-10 text-lg font-semibold text-white shadow-lg hover:bg-[var(--kiosk-primary)]/90"
              >
                <RotateCw className="mr-2 h-5 w-5" />
                Tentar novamente
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Dev/demo simulate controls */}
      <div className="pointer-events-auto absolute bottom-4 right-4 flex flex-col gap-2 opacity-60 hover:opacity-100 transition-opacity">
        <span className="text-[10px] uppercase tracking-widest text-[var(--kiosk-muted)]">
          Demo
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={state !== "idle"}
          onClick={() => simulate("success")}
          className="h-8 justify-start text-xs text-[var(--kiosk-muted)] hover:text-[var(--kiosk-success)]"
        >
          Simular sucesso
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={state !== "idle"}
          onClick={() => simulate("error")}
          className="h-8 justify-start text-xs text-[var(--kiosk-muted)] hover:text-[var(--kiosk-error)]"
        >
          Simular falha
        </Button>
      </div>
    </main>
  );
}