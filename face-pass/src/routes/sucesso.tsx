import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Check, MapPin, ScanFace, ShoppingBag } from "lucide-react";
import { PhoneFrame } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { registrationStore, useRegistration } from "@/lib/registration-store";

export const Route = createFileRoute("/sucesso")({
  head: () => ({
    meta: [
      { title: "Cadastro concluído — FacePass" },
      { name: "description", content: "Seu cadastro foi concluído com sucesso." },
    ],
  }),
  component: SucessoScreen,
});

function SucessoScreen() {
  const navigate = useNavigate();
  const reg = useRegistration();
  const firstName = reg.nome.trim().split(" ")[0];

  const confetti = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.5 + Math.random() * 1.8,
        rotate: Math.random() * 360,
        color: ["bg-primary", "bg-accent", "bg-success", "bg-amber-400"][i % 4],
        size: 6 + Math.round(Math.random() * 6),
      })),
    [],
  );

  useEffect(() => {
    return () => {
      /* keep data while on this screen */
    };
  }, []);

  const handleHome = () => {
    registrationStore.reset();
    navigate({ to: "/" });
  };

  return (
    <PhoneFrame>
      {/* confetti layer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((c, i) => (
          <span
            key={i}
            className={`confetti-piece absolute top-0 ${c.color} rounded-sm`}
            style={{
              left: `${c.left}%`,
              width: c.size,
              height: c.size * 1.6,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              transform: `rotate(${c.rotate}deg)`,
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-between overflow-y-auto px-7 pb-8 pt-16 text-center">
        <div className="flex flex-col items-center">
          <div className="check-pop grid h-28 w-28 place-items-center rounded-full bg-success text-success-foreground shadow-[0_20px_50px_-10px_oklch(0.72_0.16_160_/_0.55)]">
            <Check size={56} strokeWidth={3.5} />
          </div>

          <h1 className="fade-up mt-8 text-[28px] font-extrabold leading-tight tracking-tight text-foreground">
            {firstName ? `Tudo pronto, ${firstName}!` : "Tudo pronto!"}
          </h1>
          <p className="fade-up mt-3 max-w-xs text-[15px] leading-relaxed text-muted-foreground">
            Seu cadastro foi concluído com sucesso. Agora você já pode entrar no mercado apenas com o seu rosto. Rápido, seguro e sem filas.
          </p>
        </div>

        <div className="fade-up my-8 w-full rounded-3xl border border-border bg-card p-5 text-left shadow-[var(--shadow-soft)]">
          <h2 className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Como funciona
          </h2>
          <ol className="flex flex-col gap-3.5">
            <Step n={1} icon={<MapPin size={18} />} text="Chegue ao mercado" />
            <Step n={2} icon={<ScanFace size={18} />} text="Olhe para a câmera da entrada" />
            <Step n={3} icon={<ShoppingBag size={18} />} text="Faça suas compras" />
          </ol>
        </div>

        <Button onClick={handleHome} size="lg" className="h-12 w-full rounded-2xl text-base font-semibold">
          Ir para o início
        </Button>
      </div>
    </PhoneFrame>
  );
}

function Step({ n, icon, text }: { n: number; icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
        {icon}
        <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {n}
        </span>
      </div>
      <span className="text-[15px] font-medium text-foreground">{text}</span>
    </li>
  );
}
