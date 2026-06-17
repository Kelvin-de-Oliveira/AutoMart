import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Sun, Eye, Glasses, Camera, Loader2, UserRound, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { PhoneFrame, StepIndicator } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

type CapturaSearch = { from?: "conta" };

export const Route = createFileRoute("/captura")({
  validateSearch: (s: Record<string, unknown>): CapturaSearch => ({
    from: s.from === "conta" ? "conta" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Captura facial — FacePass" },
      { name: "description", content: "Registre seu rosto para entrar no mercado autônomo." },
    ],
  }),
  component: CapturaScreen,
});

function CapturaScreen() {
  const navigate = useNavigate();
  const { from } = Route.useSearch();
  const isUpdate = from === "conta";
  const [state, setState] = useState<"idle" | "loading">("idle");
  const [attempts, setAttempts] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch {
        setCameraReady(false);
      }
    }

    startCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const onCapture = () => {
    setState("loading");
    setTimeout(() => {
      setAttempts((a) => a + 1);
      if (isUpdate) {
        toast.success("Foto atualizada com sucesso.");
        navigate({ to: "/minha-conta" });
      } else {
        navigate({ to: "/sucesso" });
      }
    }, 1600);
  };

  return (
    <PhoneFrame>
      <header className="flex items-center gap-3 px-6 pb-2 pt-6">
        <Link
          to={isUpdate ? "/minha-conta" : "/cadastro"}
          className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </Link>
      </header>

      <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-8">
        {!isUpdate && (
          <div className="mb-6">
            <StepIndicator current={2} total={3} />
          </div>
        )}

        <div className="fade-up">
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
            {isUpdate ? "Atualize seu rosto" : "Vamos registrar seu rosto"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Posicione seu rosto dentro do círculo. Mantenha um ambiente bem iluminado e retire óculos ou bonés.
          </p>
        </div>

        <div className="fade-up my-8 flex justify-center">
          <div className="relative">
            <div className="scan-ring relative grid h-64 w-64 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary-soft to-secondary">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 h-full w-full object-cover [transform:scaleX(-1)] ${
                  cameraReady ? "opacity-100" : "opacity-0"
                }`}
              />
              {!cameraReady && (
                <UserRound size={140} strokeWidth={1.2} className="text-primary/70" />
              )}
              {state === "loading" && (
                <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3 text-primary">
                    <Loader2 className="animate-spin" size={42} />
                    <span className="text-sm font-semibold">Analisando...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {!cameraReady && (
          <p className="fade-up -mt-4 mb-2 flex items-center justify-center gap-1.5 text-center text-xs font-medium text-muted-foreground">
            <VideoOff size={14} />
            Câmera não disponível — exibindo simulação
          </p>
        )}

        <div className="fade-up grid grid-cols-3 gap-2">
          <Checklist icon={<Sun size={18} />} label="Boa iluminação" />
          <Checklist icon={<Eye size={18} />} label="Olhe para a câmera" />
          <Checklist icon={<Glasses size={18} />} label="Sem acessórios" />
        </div>

        <div className="mt-auto pt-8">
          <Button
            onClick={onCapture}
            disabled={state === "loading"}
            size="lg"
            className="h-12 w-full rounded-2xl text-base font-semibold"
          >
            <Camera size={18} />
            {state === "loading" ? "Analisando..." : isUpdate ? "Atualizar foto" : "Capturar foto"}
          </Button>
          {attempts > 0 && state === "idle" && (
            <button className="mx-auto mt-3 block text-sm font-medium text-primary hover:underline">
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}

function Checklist({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-secondary/60 p-3 text-center">
      <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary">{icon}</div>
      <span className="text-[11px] font-medium leading-tight text-foreground">{label}</span>
    </div>
  );
}
