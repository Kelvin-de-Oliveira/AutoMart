import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ScanFace, CheckCircle2, UserX, Store } from "lucide-react";
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

  const isError = state === "error";

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
        // Após qualquer resultado (sucesso ou falha), retorna ao estado inicial em 5s
        timersRef.current.push(setTimeout(() => setState("idle"), 5000));
      }, 2000),
    );
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
        "relative flex h-screen w-full flex-col overflow-hidden transition-colors duration-700",
        bgTint,
      )}
    >
      {/* Top brand */}
      <header className={cn("flex items-center justify-center pb-3", isError ? "pt-5" : "pt-10")}>
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
      <section className="flex min-h-0 flex-1 flex-col items-center justify-center px-8">
        <div className="relative shrink-0">
          {/* Animated scanning sweep during recognizing */}
          {state === "recognizing" && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <div
                className={cn(
                  "animate-spin rounded-full border-4 border-transparent border-t-[var(--kiosk-primary)] border-r-[var(--kiosk-primary)]/40 [animation-duration:1.4s]",
                  isError ? "h-[16rem] w-[16rem]" : "h-[22rem] w-[22rem]",
                )}
              />
            </div>
          )}

          {/* Circular frame */}
          <div
            className={cn(
              "relative overflow-hidden rounded-full bg-black/5 ring-8 ring-offset-4 ring-offset-transparent transition-all duration-500",
              isError ? "h-[16rem] w-[16rem]" : "h-[22rem] w-[22rem]",
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
          className={cn(
            "flex w-full max-w-xl shrink-0 animate-fade-in flex-col items-center text-center",
            isError ? "mt-5" : "mt-12",
          )}
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
              <div className="mb-2 flex items-center gap-3">
                <UserX className="h-9 w-9 text-[var(--kiosk-error)]" />
              </div>
              <h1 className="text-3xl font-bold leading-tight text-[var(--kiosk-error)]">
                Não foi possível reconhecer seu rosto
              </h1>
              <p className="mt-2 text-base text-[var(--kiosk-muted)]">
                Tente novamente ou ajuste a posição do seu rosto.
              </p>

              {/* Card de orientações */}
              <div className="mt-4 rounded-2xl border border-[var(--kiosk-error)]/20 bg-[var(--kiosk-error-bg)] px-6 py-4 text-sm text-[var(--kiosk-muted)]">
                <p>
                  Problema persistente? Acesse{" "}
                  <a
                    href="https://www.automart.com.br/suporte"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[var(--kiosk-primary)] underline underline-offset-2"
                  >
                    automart.com.br/suporte
                  </a>{" "}
                  ou escreva para{" "}
                  <a
                    href="mailto:suporte@automart.com.br"
                    className="font-semibold text-[var(--kiosk-primary)] underline underline-offset-2"
                  >
                    suporte@automart.com.br
                  </a>
                  .
                </p>
                <div className="my-2.5 h-px w-full bg-[var(--kiosk-error)]/15" />
                <p>
                  É seu primeiro acesso? Instale o aplicativo FacePass e realize seu cadastro em{" "}
                  <a
                    href="https://www.automart.com.br/app"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[var(--kiosk-primary)] underline underline-offset-2"
                  >
                    automart.com.br/app
                  </a>
                  .
                </p>
              </div>
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