import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { PhoneFrame, StepIndicator } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { registrationStore } from "@/lib/registration-store";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Cadastro — FacePass" },
      { name: "description", content: "Crie sua conta FacePass com seus dados pessoais." },
    ],
  }),
  component: CadastroScreen,
});

const maskCPF = (v: string) =>
  v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

const maskPhone = (v: string) =>
  v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");

function passwordStrength(p: string): { score: number; label: string; color: string } {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  const labels = ["Muito fraca", "Fraca", "Razoável", "Forte", "Excelente"];
  const colors = ["bg-destructive", "bg-destructive", "bg-amber-500", "bg-accent", "bg-success"];
  return { score: s, label: labels[s], color: colors[s] };
}

function CadastroScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    nascimento: "",
    email: "",
    telefone: "",
    senha: "",
    confirmar: "",
  });
  const [aceitou, setAceitou] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const touch = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const strength = useMemo(() => passwordStrength(form.senha), [form.senha]);

  const errors = {
    nome: form.nome.trim().split(" ").length < 2 ? "Informe seu nome completo" : "",
    cpf: form.cpf.replace(/\D/g, "").length !== 11 ? "CPF inválido" : "",
    nascimento: !form.nascimento ? "Selecione sua data" : "",
    email: !/^\S+@\S+\.\S+$/.test(form.email) ? "E-mail inválido" : "",
    telefone: form.telefone.replace(/\D/g, "").length < 10 ? "Telefone inválido" : "",
    senha: strength.score < 3 ? "Use 8+ caracteres com letras, números e símbolos" : "",
    confirmar: form.confirmar !== form.senha || !form.confirmar ? "As senhas não coincidem" : "",
  };
  const valid = Object.values(errors).every((e) => !e) && aceitou;

  return (
    <PhoneFrame>
      <header className="flex items-center gap-3 px-6 pb-2 pt-6">
        <Link
          to="/"
          className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </Link>
      </header>

      <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-8">
        <div className="mb-6">
          <StepIndicator current={1} total={3} />
        </div>

        <div className="fade-up mb-6">
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
            Crie sua conta
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Precisamos de alguns dados para vincular seu rosto a uma identidade verificada.
          </p>
        </div>

        <form
          className="fade-up flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            registrationStore.set({
              nome: form.nome,
              cpf: form.cpf,
              nascimento: form.nascimento,
              email: form.email,
              telefone: form.telefone,
              senha: form.senha,
            });
            navigate({ to: "/captura" });
          }}
        >
          <Input label="Nome completo" value={form.nome} onChange={set("nome")} placeholder="Maria Silva" onBlur={() => touch("nome")} error={touched.nome ? errors.nome : ""} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="CPF" value={form.cpf} onChange={(v) => set("cpf")(maskCPF(v))} placeholder="000.000.000-00" inputMode="numeric" onBlur={() => touch("cpf")} error={touched.cpf ? errors.cpf : ""} />
            <Input label="Nascimento" type="date" value={form.nascimento} onChange={set("nascimento")} onBlur={() => touch("nascimento")} error={touched.nascimento ? errors.nascimento : ""} />
          </div>
          <Input label="E-mail" type="email" value={form.email} onChange={set("email")} placeholder="voce@email.com" onBlur={() => touch("email")} error={touched.email ? errors.email : ""} />
          <Input label="Telefone" value={form.telefone} onChange={(v) => set("telefone")(maskPhone(v))} placeholder="(00) 00000-0000" inputMode="tel" onBlur={() => touch("telefone")} error={touched.telefone ? errors.telefone : ""} />

          <div>
            <Input label="Senha" type="password" value={form.senha} onChange={set("senha")} placeholder="Mínimo 8 caracteres" onBlur={() => touch("senha")} error={touched.senha ? errors.senha : ""} />
            {form.senha && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i < strength.score ? strength.color : "bg-border"}`} />
                  ))}
                </div>
                <span className="text-xs font-medium text-muted-foreground">{strength.label}</span>
              </div>
            )}
          </div>

          <Input label="Confirmar senha" type="password" value={form.confirmar} onChange={set("confirmar")} placeholder="Repita sua senha" onBlur={() => touch("confirmar")} error={touched.confirmar ? errors.confirmar : ""} />

          <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-2xl bg-secondary/60 p-3.5">
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition-colors ${
                aceitou ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background"
              }`}
            >
              {aceitou && <Check size={14} strokeWidth={3} />}
            </span>
            <input type="checkbox" className="sr-only" checked={aceitou} onChange={(e) => setAceitou(e.target.checked)} />
            <span className="text-xs leading-relaxed text-muted-foreground">
              Li e aceito os{" "}
              <a className="font-medium text-primary underline">Termos de Uso</a> e a{" "}
              <a className="font-medium text-primary underline">Política de Privacidade</a>.
            </span>
          </label>

          <Button type="submit" disabled={!valid} size="lg" className="mt-3 h-12 rounded-2xl text-base font-semibold">
            Continuar
          </Button>
        </form>
      </div>
    </PhoneFrame>
  );
}

function Input({
  label,
  error,
  value,
  onChange,
  ...rest
}: {
  label: string;
  error?: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-12 rounded-2xl border bg-card px-4 text-[15px] outline-none transition-colors placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary/15 ${
          error ? "border-destructive focus:border-destructive" : "border-input focus:border-primary"
        }`}
      />
      {error && <span className="text-xs font-medium text-destructive">{error}</span>}
    </label>
  );
}
