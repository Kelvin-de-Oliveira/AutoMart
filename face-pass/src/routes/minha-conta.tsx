import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  LogOut,
  ScanFace,
  Pencil,
  ChevronRight,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  Camera,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Logo, PhoneFrame } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/minha-conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — FacePass" },
      { name: "description", content: "Gerencie seus dados e seu reconhecimento facial na FacePass." },
    ],
  }),
  component: MinhaContaScreen,
});

const maskCPF = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

const maskPhone = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
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

const initialData = {
  nome: "Ana Beatriz Ribeiro",
  cpf: "123.456.789-09",
  nascimento: "1995-04-12",
  email: "ana.ribeiro@email.com",
  telefone: "(11) 98765-4321",
};

function MinhaContaScreen() {
  const navigate = useNavigate();
  const [data, setData] = useState(initialData);
  const [draft, setDraft] = useState(initialData);
  const [editing, setEditing] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const firstName = data.nome.trim().split(" ")[0];

  const startEdit = () => {
    setDraft(data);
    setEditing(true);
  };
  const cancelEdit = () => {
    setDraft(data);
    setEditing(false);
  };
  const saveEdit = () => {
    setData(draft);
    setEditing(false);
    toast.success("Dados atualizados com sucesso.");
  };

  const handleLogout = () => navigate({ to: "/" });

  const confirmDelete = () => {
    setDeleting(true);
    setTimeout(() => {
      setDeleting(false);
      setDelOpen(false);
      toast.success("Sua conta foi excluída.");
      navigate({ to: "/" });
    }, 1200);
  };

  return (
    <PhoneFrame>
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border/70 bg-background/95 px-5 pb-4 pt-5 backdrop-blur">
        <Logo size={32} />
        <button
          onClick={handleLogout}
          aria-label="Sair"
          className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground transition-colors hover:bg-muted"
        >
          <LogOut size={18} />
        </button>
      </header>

      <div className="flex flex-1 flex-col overflow-y-auto px-5 pb-10 pt-5">
        <div className="fade-up">
          <h1 className="text-[24px] font-extrabold leading-tight tracking-tight text-foreground">
            Minha conta
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Olá, {firstName}! Gerencie seus dados e seu reconhecimento facial.
          </p>
        </div>

        {/* Section 1 — Facial recognition (prominent) */}
        <section className="fade-up mt-6 rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.42_0.08_180)] p-5 text-primary-foreground shadow-[var(--shadow-elevated)]">
          <div className="flex items-center gap-4">
            <div className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full bg-primary-foreground/15 ring-2 ring-primary-foreground/30">
              <ScanFace size={32} strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold leading-tight">Reconhecimento facial</h2>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="grid h-2 w-2 place-items-center rounded-full bg-success shadow-[0_0_0_3px_oklch(0.72_0.16_160/0.25)]" />
                <span className="text-xs font-semibold">Cadastro ativo</span>
              </div>
              <p className="mt-1 text-[11px] text-primary-foreground/70">
                Última atualização: 14/06/2026
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate({ to: "/captura", search: { from: "conta" } })}
            className="mt-4 h-11 w-full rounded-2xl bg-primary-foreground text-base font-semibold text-primary hover:bg-primary-foreground/90"
          >
            <Camera size={18} />
            Atualizar foto
          </Button>
        </section>

        {/* Section 2 — Personal data */}
        <section className="fade-up mt-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-foreground">Dados pessoais</h2>
            {!editing ? (
              <button
                onClick={startEdit}
                className="inline-flex items-center gap-1.5 rounded-full border border-input bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                <Pencil size={13} />
                Editar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelEdit}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  Salvar
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <AccountField
              label="Nome completo"
              value={editing ? draft.nome : data.nome}
              onChange={(v) => setDraft((d) => ({ ...d, nome: v }))}
              editing={editing}
            />
            <AccountField
              label="CPF"
              value={editing ? draft.cpf : data.cpf}
              onChange={(v) => setDraft((d) => ({ ...d, cpf: maskCPF(v) }))}
              editing={editing}
              inputMode="numeric"
            />
            <AccountField
              label="Data de nascimento"
              value={editing ? draft.nascimento : formatDate(data.nascimento)}
              onChange={(v) => setDraft((d) => ({ ...d, nascimento: v }))}
              editing={editing}
              type={editing ? "date" : "text"}
            />
            <AccountField
              label="E-mail"
              value={editing ? draft.email : data.email}
              onChange={(v) => setDraft((d) => ({ ...d, email: v }))}
              editing={editing}
              type="email"
            />
            <AccountField
              label="Telefone"
              value={editing ? draft.telefone : data.telefone}
              onChange={(v) => setDraft((d) => ({ ...d, telefone: maskPhone(v) }))}
              editing={editing}
              inputMode="tel"
            />
          </div>
        </section>

        {/* Section 3 — Security */}
        <section className="fade-up mt-7">
          <h2 className="mb-3 text-[15px] font-bold text-foreground">Segurança</h2>
          <button
            onClick={() => setPwOpen(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-secondary/60"
          >
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary">
              <ShieldCheck size={18} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">Alterar senha</div>
              <div className="text-xs text-muted-foreground">Atualize sua senha de acesso</div>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
        </section>

        {/* Section 4 — Danger zone */}
        <div className="my-7 h-px w-full bg-border" />
        <section className="fade-up">
          <h2 className="mb-2 flex items-center gap-2 text-[15px] font-bold text-destructive">
            <AlertTriangle size={16} />
            Excluir conta
          </h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Esta ação é permanente. Seu cadastro e sua imagem facial serão removidos e você não
            poderá mais acessar o mercado pelo reconhecimento facial.
          </p>
          <button
            onClick={() => setDelOpen(true)}
            className="mt-4 h-11 w-full rounded-2xl border-2 border-destructive/60 bg-transparent text-sm font-semibold text-destructive transition-colors hover:bg-destructive/5"
          >
            Excluir minha conta
          </button>
        </section>
      </div>

      <ChangePasswordDialog open={pwOpen} onOpenChange={setPwOpen} />

      <Dialog open={delOpen} onOpenChange={(o) => !deleting && setDelOpen(o)}>
        <DialogContent className="max-w-[360px] rounded-3xl">
          <DialogHeader>
            <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle size={22} />
            </div>
            <DialogTitle className="text-center">Tem certeza?</DialogTitle>
            <DialogDescription className="text-center">
              Ao confirmar, todos os seus dados e seu cadastro facial serão excluídos
              permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="h-11 w-full rounded-2xl bg-destructive text-base font-semibold text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="animate-spin" size={18} /> : null}
              {deleting ? "Excluindo..." : "Sim, excluir conta"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setDelOpen(false)}
              disabled={deleting}
              className="h-11 w-full rounded-2xl text-base font-semibold"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PhoneFrame>
  );
}

function formatDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function AccountField({
  label,
  value,
  onChange,
  editing,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  editing: boolean;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={!editing}
        disabled={!editing}
        type={type}
        inputMode={inputMode}
        className={
          editing
            ? "h-12 rounded-2xl border border-input bg-card px-4 text-[15px] text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
            : "h-12 rounded-2xl border border-transparent bg-secondary/60 px-4 text-[15px] font-medium text-foreground/90 outline-none"
        }
      />
    </label>
  );
}

function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNext, setShowNext] = useState(false);
  const strength = useMemo(() => passwordStrength(next), [next]);

  const errors = {
    current: !current ? "Informe sua senha atual" : "",
    next: strength.score < 3 ? "Use 8+ caracteres com letras, números e símbolos" : "",
    confirm: confirm !== next || !confirm ? "As senhas não coincidem" : "",
  };
  const valid = Object.values(errors).every((e) => !e);

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setShowNext(false);
  };

  const handleSave = () => {
    if (!valid) return;
    reset();
    onOpenChange(false);
    toast.success("Senha alterada com sucesso.");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-[380px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>Alterar senha</DialogTitle>
          <DialogDescription>
            Crie uma nova senha forte para proteger sua conta.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <PwField
            label="Senha atual"
            value={current}
            onChange={setCurrent}
            icon={<Lock size={16} />}
          />
          <div>
            <PwField
              label="Nova senha"
              value={next}
              onChange={setNext}
              show={showNext}
              onToggle={() => setShowNext((s) => !s)}
              icon={<Lock size={16} />}
            />
            {next && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full ${
                        i < strength.score ? strength.color : "bg-border"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-muted-foreground">{strength.label}</span>
              </div>
            )}
          </div>
          <PwField
            label="Confirmar nova senha"
            value={confirm}
            onChange={setConfirm}
            icon={<Lock size={16} />}
          />
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button
            onClick={handleSave}
            disabled={!valid}
            className="h-11 w-full rounded-2xl text-base font-semibold"
          >
            Salvar nova senha
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-11 w-full rounded-2xl text-base font-semibold"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PwField({
  label,
  value,
  onChange,
  show,
  onToggle,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show?: boolean;
  onToggle?: () => void;
  icon?: React.ReactNode;
}) {
  const isToggleable = typeof show === "boolean" && !!onToggle;
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex h-12 items-center gap-2 rounded-2xl border border-input bg-card px-4 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <input
          type={isToggleable && show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70"
        />
        {isToggleable && (
          <button
            type="button"
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground"
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </label>
  );
}
