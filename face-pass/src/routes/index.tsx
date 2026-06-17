import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Logo, PhoneFrame } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar — FacePass" },
      { name: "description", content: "Acesse sua conta FacePass e entre no mercado autônomo apenas com o seu rosto." },
    ],
  }),
  component: LoginScreen,
});

function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [show, setShow] = useState(false);

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col overflow-y-auto px-7 pb-8 pt-14">
        <div className="fade-up flex flex-col items-center gap-3">
          <Logo size={56} className="flex-col !gap-3" />
          <p className="text-center text-sm text-muted-foreground">Seu rosto é a sua chave.</p>
        </div>

        <form
          className="fade-up mt-12 flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!email.trim() || !senha.trim()) return;
            navigate({ to: "/minha-conta" });
          }}
        >
          <Field
            label="E-mail"
            icon={<Mail size={18} />}
            type="email"
            placeholder="voce@email.com"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />
          <Field
            label="Senha"
            icon={<Lock size={18} />}
            type={show ? "text" : "password"}
            placeholder="Sua senha"
            value={senha}
            onChange={setSenha}
            autoComplete="current-password"
            trailing={
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={show ? "Ocultar senha" : "Mostrar senha"}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <button
            type="button"
            className="-mt-1 self-end text-sm font-medium text-primary hover:underline"
          >
            Esqueci minha senha
          </button>

          <Button type="submit" size="lg" className="mt-2 h-12 rounded-2xl text-base font-semibold">
            Entrar
          </Button>

          <div className="mx-auto mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Lock size={14} />
            <span>Seus dados estão protegidos</span>
          </div>
        </form>

        <div className="mt-auto pt-10 text-center text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="font-semibold text-primary hover:underline">
            Cadastre-se
          </Link>
        </div>
      </div>
    </PhoneFrame>
  );
}

function Field({
  label,
  icon,
  trailing,
  value,
  onChange,
  ...rest
}: {
  label: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex h-12 items-center gap-2 rounded-2xl border border-input bg-card px-4 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <input
          {...rest}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70"
        />
        {trailing}
      </div>
    </label>
  );
}
