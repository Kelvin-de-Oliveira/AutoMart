import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Banknote,
  Barcode,
  Check,
  CreditCard,
  Minus,
  Plus,
  QrCode,
  ScanLine,
  Store,
  Trash2,
  Ticket,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mercadinho Express — Autoatendimento" },
      {
        name: "description",
        content:
          "Sistema de autoatendimento da loja de conveniência Mercadinho Express.",
      },
    ],
  }),
  component: PosApp,
});

// ----- Domain -----
type Product = { codigo: string; nome: string; preco: number };
type CartItem = Product & { quantidade: number };
type PaymentMethod = "cartao" | "pix" | "voucher";
type CardType = "credito" | "debito";
type Screen = "standby" | "cart" | "method" | "awaiting" | "success";

const PRODUCTS: Product[] = [
  { codigo: "7891000", nome: "Refrigerante Lata 350ml", preco: 6.5 },
  { codigo: "7891001", nome: "Água Mineral 500ml", preco: 4.0 },
  { codigo: "7891002", nome: "Chocolate ao Leite 90g", preco: 8.9 },
  { codigo: "7891003", nome: "Salgadinho 80g", preco: 9.5 },
  { codigo: "7891004", nome: "Cerveja Long Neck 355ml", preco: 8.0 },
  { codigo: "7891005", nome: "Pão de Queijo (unidade)", preco: 3.5 },
  { codigo: "7891006", nome: "Café Expresso", preco: 5.0 },
  { codigo: "7891007", nome: "Sanduíche Natural", preco: 14.9 },
  { codigo: "7891008", nome: "Biscoito Recheado", preco: 5.9 },
  { codigo: "7891009", nome: "Energético 250ml", preco: 9.9 },
];

const BANNERS = [
  {
    title: "Leve 3, pague 2",
    subtitle: "Em toda a linha de refrigerantes",
    tag: "Promoção",
    gradient: "from-teal-500 to-cyan-600",
  },
  {
    title: "Novidade: linha fitness",
    subtitle: "Snacks proteicos e bebidas isotônicas",
    tag: "Novo",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    title: "Café fresquinho",
    subtitle: "Expresso por apenas R$ 5,00 o dia todo",
    tag: "Destaque",
    gradient: "from-rose-500 to-pink-600",
  },
  {
    title: "Happy Hour",
    subtitle: "Cervejas geladas com 15% off após às 18h",
    tag: "Hoje",
    gradient: "from-indigo-500 to-violet-600",
  },
];

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ----- App -----
function PosApp() {
  const [screen, setScreen] = useState<Screen>("standby");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [cardType, setCardType] = useState<CardType | null>(null);
  const [lastAddedCode, setLastAddedCode] = useState<string | null>(null);

  const total = useMemo(
    () => cart.reduce((sum, i) => sum + i.preco * i.quantidade, 0),
    [cart],
  );
  const itemCount = useMemo(
    () => cart.reduce((s, i) => s + i.quantidade, 0),
    [cart],
  );

  const addRandomProduct = useCallback(() => {
    const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    setCart((prev) => {
      const existing = prev.find((p) => p.codigo === product.codigo);
      if (existing) {
        return prev.map((p) =>
          p.codigo === product.codigo ? { ...p, quantidade: p.quantidade + 1 } : p,
        );
      }
      return [...prev, { ...product, quantidade: 1 }];
    });
    setLastAddedCode(product.codigo);
    toast.success("Produto adicionado", { description: product.nome });
    window.setTimeout(() => setLastAddedCode(null), 1500);
  }, []);

  const startFromStandby = useCallback(() => {
    addRandomProduct();
    setScreen("cart");
  }, [addRandomProduct]);

  const updateQty = (codigo: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((p) =>
          p.codigo === codigo
            ? { ...p, quantidade: Math.max(0, p.quantidade + delta) }
            : p,
        )
        .filter((p) => p.quantidade > 0),
    );
  };

  const removeItem = (codigo: string) =>
    setCart((prev) => prev.filter((p) => p.codigo !== codigo));

  const resetAll = () => {
    setCart([]);
    setMethod(null);
    setCardType(null);
    setScreen("standby");
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      {screen === "standby" && <StandbyScreen onStart={startFromStandby} />}
      {screen === "cart" && (
        <CartScreen
          cart={cart}
          itemCount={itemCount}
          total={total}
          lastAddedCode={lastAddedCode}
          onScan={addRandomProduct}
          onUpdateQty={updateQty}
          onRemoveItem={removeItem}
          onCheckout={() => setScreen("method")}
          onCancel={resetAll}
        />
      )}
      {screen === "method" && (
        <MethodScreen
          total={total}
          onBack={() => setScreen("cart")}
          onChoose={(m, c) => {
            setMethod(m);
            setCardType(c ?? null);
            setScreen("awaiting");
          }}
        />
      )}
      {screen === "awaiting" && method && (
        <AwaitingScreen
          total={total}
          method={method}
          cardType={cardType}
          onCancel={() => setScreen("method")}
          onConfirm={() => setScreen("success")}
        />
      )}
      {screen === "success" && method && (
        <SuccessScreen
          total={total}
          method={method}
          cardType={cardType}
          itemCount={itemCount}
          onDone={resetAll}
        />
      )}
    </div>
  );
}

// ----- Shared -----
function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className="grid h-11 w-11 place-items-center rounded-xl text-primary-foreground shadow-sm"
        style={{ background: "var(--gradient-brand)" }}
      >
        <Store className="h-6 w-6" />
      </div>
      <div className="leading-tight">
        <div className="text-lg font-bold tracking-tight">Mercadinho</div>
        <div className="text-xs font-medium text-muted-foreground">Express</div>
      </div>
    </div>
  );
}

// ----- Screen 1: Standby -----
function StandbyScreen({ onStart }: { onStart: () => void }) {
  const [bannerIdx, setBannerIdx] = useState(0);
  useEffect(() => {
    const id = window.setInterval(
      () => setBannerIdx((i) => (i + 1) % BANNERS.length),
      5000,
    );
    return () => window.clearInterval(id);
  }, []);

  const banner = BANNERS[bannerIdx];

  return (
    <div className="relative flex h-screen flex-col items-center justify-between overflow-hidden px-8 py-8">
      <Button
        onClick={onStart}
        variant="outline"
        size="sm"
        className="absolute right-6 top-6 h-10 gap-2 text-xs opacity-70 hover:opacity-100"
      >
        <ScanLine className="h-4 w-4" /> Simular leitura
      </Button>

      <div className="mt-8 flex flex-col items-center">
        <div
          className="grid h-24 w-24 place-items-center rounded-3xl text-primary-foreground shadow-[var(--shadow-elegant)]"
          style={{ background: "var(--gradient-brand)" }}
        >
          <Store className="h-12 w-12" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          Mercadinho Express
        </h1>
      </div>

      <div className="flex max-w-3xl flex-col items-center text-center">
        <h2 className="text-7xl font-extrabold tracking-tight text-foreground">
          Bem-vindo!
        </h2>
        <p className="mt-5 text-2xl text-muted-foreground">
          Passe um produto no leitor para começar
        </p>

        {/* Promo carousel */}
        <div className="mt-12 w-full overflow-hidden rounded-3xl shadow-[var(--shadow-card)]">
          <div
            key={banner.title}
            className={cn(
              "relative flex h-56 w-full items-center justify-between bg-gradient-to-br p-10 text-white transition-opacity duration-700 animate-fade-in",
              banner.gradient,
            )}
          >
            <div className="text-left">
              <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                {banner.tag}
              </span>
              <div className="mt-4 text-4xl font-extrabold tracking-tight">
                {banner.title}
              </div>
              <div className="mt-2 text-lg opacity-95">{banner.subtitle}</div>
            </div>
            <div className="hidden h-32 w-32 rounded-full bg-white/15 backdrop-blur md:block" />
          </div>
          <div className="flex justify-center gap-2 bg-card py-4">
            {BANNERS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === bannerIdx ? "w-8 bg-primary" : "w-2 bg-muted",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col items-center">
        <div className="scan-pulse grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary">
          <Barcode className="h-10 w-10" />
        </div>
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          Aguardando leitura do código de barras…
        </p>
      </div>
    </div>
  );
}

// ----- Screen 2: Cart -----
function CartScreen({
  cart,
  itemCount,
  total,
  lastAddedCode,
  onScan,
  onUpdateQty,
  onRemoveItem,
  onCheckout,
  onCancel,
}: {
  cart: CartItem[];
  itemCount: number;
  total: number;
  lastAddedCode: string | null;
  onScan: () => void;
  onUpdateQty: (codigo: string, delta: number) => void;
  onRemoveItem: (codigo: string) => void;
  onCheckout: () => void;
  onCancel: () => void;
}) {
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  return (
    <div className="relative mx-auto flex h-screen max-w-[1400px] flex-col overflow-hidden px-8 py-6">
      <header className="flex items-center justify-between border-b border-border pb-5">
        <Logo />
        <div className="rounded-full bg-secondary px-5 py-2 text-sm font-semibold text-secondary-foreground">
          {itemCount} {itemCount === 1 ? "produto" : "produtos"}
        </div>
      </header>

      <div className="mt-6 grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        {/* Items */}
        <div className="flex min-h-0 flex-col">
          <h2 className="text-2xl font-bold tracking-tight">Seus produtos</h2>
          <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="flex h-72 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border text-muted-foreground">
                <Barcode className="mb-3 h-12 w-12" />
                <p className="text-lg">Nenhum produto no carrinho</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.codigo}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm",
                    item.codigo === lastAddedCode && "item-slide-in",
                  )}
                >
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Barcode className="h-7 w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-lg font-semibold">
                      {item.nome}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatBRL(item.preco)} cada
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-secondary p-1">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.codigo, -1)}
                      className="grid h-12 w-12 place-items-center rounded-lg bg-card text-foreground transition hover:bg-background"
                      aria-label="Diminuir quantidade"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="w-10 text-center text-xl font-bold tabular-nums">
                      {item.quantidade}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.codigo, 1)}
                      className="grid h-12 w-12 place-items-center rounded-lg bg-card text-foreground transition hover:bg-background"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="w-28 text-right text-2xl font-bold tabular-nums">
                    {formatBRL(item.preco * item.quantidade)}
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(item.codigo)}
                    className="grid h-12 w-12 place-items-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remover item"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* empty */}
        </div>

        {/* Summary */}
        <aside className="sticky top-6 flex h-fit flex-col rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-card)]">
          <h3 className="text-xl font-bold tracking-tight">Resumo da compra</h3>
          <div className="mt-5 space-y-3 text-base">
            <Row label="Subtotal" value={formatBRL(total)} />
            <Row label="Descontos" value={formatBRL(0)} muted />
          </div>
          <div className="my-6 h-px bg-border" />
          <div className="flex items-baseline justify-between">
            <span className="text-base font-semibold text-muted-foreground">
              Total
            </span>
            <span className="text-5xl font-extrabold tracking-tight text-primary tabular-nums">
              {formatBRL(total)}
            </span>
          </div>
          <Button
            disabled={cart.length === 0}
            onClick={onCheckout}
            size="lg"
            className="mt-7 h-16 w-full rounded-2xl text-lg font-bold shadow-[var(--shadow-elegant)] disabled:opacity-40"
            style={{ background: "var(--gradient-brand)" }}
          >
            Finalizar compra
          </Button>
          <Button
            onClick={() => setConfirmCancel(true)}
            variant="ghost"
            className="mt-2 h-12 w-full rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Cancelar compra
          </Button>
        </aside>
      </div>

      <Button
        onClick={onScan}
        variant="outline"
        size="sm"
        className="absolute bottom-6 right-6 h-10 gap-2 text-xs opacity-70 hover:opacity-100"
      >
        <ScanLine className="h-4 w-4" />
        Simular leitura
      </Button>

      <ConfirmDialog
        open={confirmRemove !== null}
        title="Remover este item do carrinho?"
        description="O produto será retirado do seu carrinho atual."
        cancelText="Cancelar"
        confirmText="Sim, remover"
        destructive
        onCancel={() => setConfirmRemove(null)}
        onConfirm={() => {
          if (confirmRemove) onRemoveItem(confirmRemove);
          setConfirmRemove(null);
        }}
      />
      <ConfirmDialog
        open={confirmCancel}
        title="Tem certeza que deseja cancelar a compra?"
        description="Todos os itens serão removidos do carrinho."
        cancelText="Voltar"
        confirmText="Sim, cancelar"
        destructive
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          onCancel();
        }}
      />
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-semibold tabular-nums",
          muted && "text-muted-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

// ----- Screen 3: Method -----
function MethodScreen({
  total,
  onBack,
  onChoose,
}: {
  total: number;
  onBack: () => void;
  onChoose: (m: PaymentMethod, cardType?: CardType) => void;
}) {
  const [cardDialogOpen, setCardDialogOpen] = useState(false);

  const methods: {
    id: PaymentMethod;
    name: string;
    helper: string;
    Icon: typeof CreditCard;
  }[] = [
    {
      id: "cartao",
      name: "Cartão",
      helper: "Crédito ou débito na maquininha",
      Icon: CreditCard,
    },
    {
      id: "pix",
      name: "Pix",
      helper: "Escaneie o QR code com seu app",
      Icon: QrCode,
    },
    {
      id: "voucher",
      name: "Voucher",
      helper: "Pague com vale-alimentação ou refeição",
      Icon: Ticket,
    },
  ];

  const handleSelect = (id: PaymentMethod) => {
    if (id === "cartao") {
      setCardDialogOpen(true);
      return;
    }
    onChoose(id);
  };

  return (
    <div className="mx-auto flex h-screen max-w-[1400px] flex-col overflow-hidden px-8 py-6">
      <header className="flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="ghost"
          className="h-12 gap-2 rounded-xl px-4 text-base"
        >
          <ArrowLeft className="h-5 w-5" /> Voltar ao carrinho
        </Button>
        <Logo />
      </header>

      <div className="mt-10 flex flex-col items-center text-center">
        <h1 className="text-5xl font-extrabold tracking-tight">
          Como deseja pagar?
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Escolha uma forma de pagamento para continuar
        </p>

        <div className="mt-10 rounded-3xl border border-border bg-card px-12 py-6 shadow-[var(--shadow-card)]">
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Total a pagar
          </div>
          <div className="mt-1 text-6xl font-extrabold tracking-tight text-primary tabular-nums">
            {formatBRL(total)}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 grid w-full max-w-5xl gap-6 md:grid-cols-3">
        {methods.map(({ id, name, helper, Icon }) => (
          <button
            type="button"
            key={id}
            onClick={() => handleSelect(id)}
            className="group flex flex-col items-center gap-5 rounded-3xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:border-primary hover:shadow-[var(--shadow-elegant)]"
          >
            <div
              className="grid h-24 w-24 place-items-center rounded-2xl text-primary-foreground transition group-hover:scale-105"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Icon className="h-12 w-12" />
            </div>
            <div className="text-3xl font-bold tracking-tight">{name}</div>
            <div className="text-base text-muted-foreground">{helper}</div>
          </button>
        ))}
      </div>

      <AlertDialog open={cardDialogOpen} onOpenChange={setCardDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">
              Crédito ou débito?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Selecione o tipo de cartão para continuar com o pagamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <button
              type="button"
              onClick={() => {
                setCardDialogOpen(false);
                onChoose("cartao", "credito");
              }}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center transition hover:-translate-y-0.5 hover:border-primary hover:shadow-[var(--shadow-card)]"
            >
              <div
                className="grid h-16 w-16 place-items-center rounded-xl text-primary-foreground"
                style={{ background: "var(--gradient-brand)" }}
              >
                <CreditCard className="h-8 w-8" />
              </div>
              <span className="text-xl font-bold tracking-tight">Crédito</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCardDialogOpen(false);
                onChoose("cartao", "debito");
              }}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center transition hover:-translate-y-0.5 hover:border-primary hover:shadow-[var(--shadow-card)]"
            >
              <div
                className="grid h-16 w-16 place-items-center rounded-xl text-primary-foreground"
                style={{ background: "var(--gradient-brand)" }}
              >
                <CreditCard className="h-8 w-8" />
              </div>
              <span className="text-xl font-bold tracking-tight">Débito</span>
            </button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-12 rounded-xl px-6 text-base">
              Voltar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ----- Screen 4: Awaiting -----
function AwaitingScreen({
  total,
  method,
  cardType,
  onCancel,
  onConfirm,
}: {
  total: number;
  method: PaymentMethod;
  cardType: CardType | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(298);
  const [confirmSeconds, setConfirmSeconds] = useState(10);
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  useEffect(() => {
    if (method !== "pix") return;
    const id = window.setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => window.clearInterval(id);
  }, [method]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setConfirmSeconds((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          onConfirmRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const cardTypeLabel = cardType === "credito" ? "crédito" : "débito";

  return (
    <div className="mx-auto flex h-screen max-w-[1100px] flex-col overflow-hidden px-8 py-6">
      <header className="flex items-center justify-between">
        <Logo />
      </header>

      <div className="mt-6 flex flex-1 flex-col items-center justify-center text-center">
        <span className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-wider text-primary">
          Aguardando pagamento
        </span>
        <div className="mt-4 text-6xl font-extrabold tracking-tight text-primary tabular-nums">
          {formatBRL(total)}
        </div>

        <div className="mt-6 w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          {method === "cartao" && (
            <div className="flex flex-col items-center">
              <div className="scan-pulse grid h-32 w-32 place-items-center rounded-3xl bg-primary/10 text-primary">
                <CreditCard className="h-16 w-16" />
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-tight">
                Conclua o pagamento na maquininha ao lado
              </h2>
              <p className="mt-2 text-base text-muted-foreground">
                Insira ou aproxime seu cartão de {cardTypeLabel} na maquininha física.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
                Conectando à maquininha…
              </div>
            </div>
          )}

          {method === "pix" && (
            <div className="flex flex-col items-center">
              <FakeQrCode />
              <h2 className="mt-4 text-2xl font-bold tracking-tight">
                Escaneie o QR code com o app do seu banco
              </h2>
              <p className="mt-1.5 text-base text-muted-foreground">
                O pagamento será confirmado automaticamente.
              </p>
              <div className="mt-4 rounded-xl bg-secondary px-5 py-2 text-sm font-semibold tabular-nums text-secondary-foreground">
                QR code expira em {mm}:{ss}
              </div>
            </div>
          )}

          {method === "voucher" && (
            <div className="flex flex-col items-center">
              <div className="scan-pulse grid h-32 w-32 place-items-center rounded-3xl bg-primary/10 text-primary">
                <Ticket className="h-16 w-16" />
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-tight">
                Insira o cartão voucher na maquininha ao lado
              </h2>
              <p className="mt-2 text-base text-muted-foreground">
                Aceitamos os principais vales-alimentação e refeição.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
                Conectando à maquininha…
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex w-full max-w-2xl flex-col gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
                Confirmando pagamento em {confirmSeconds}s…
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/20">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-linear"
                style={{ width: `${(confirmSeconds / 10) * 100}%` }}
              />
            </div>
          </div>
          <Button
            onClick={() => setConfirmCancel(true)}
            variant="ghost"
            className="h-12 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="mr-1 h-4 w-4" />
            Cancelar pagamento
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancelar este pagamento?"
        description="Você voltará para a tela de seleção de forma de pagamento. Seus produtos continuarão no carrinho."
        cancelText="Continuar pagando"
        confirmText="Sim, cancelar"
        destructive
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          onCancel();
        }}
      />
    </div>
  );
}

function FakeQrCode() {
  // Deterministic pseudo QR pattern
  const cells = useMemo(() => {
    const arr: boolean[] = [];
    let seed = 7;
    for (let i = 0; i < 21 * 21; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      arr.push(seed / 233280 > 0.5);
    }
    return arr;
  }, []);

  const isFinder = (r: number, c: number) => {
    const inSquare = (sr: number, sc: number) =>
      r >= sr && r < sr + 7 && c >= sc && c < sc + 7;
    return inSquare(0, 0) || inSquare(0, 14) || inSquare(14, 0);
  };
  const finderColor = (r: number, c: number, sr: number, sc: number) => {
    const dr = r - sr;
    const dc = c - sc;
    const onOuter = dr === 0 || dr === 6 || dc === 0 || dc === 6;
    const inInner = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
    return onOuter || inInner;
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-inner ring-1 ring-border">
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(21, 9px)",
          gridTemplateRows: "repeat(21, 9px)",
        }}
      >
        {Array.from({ length: 21 * 21 }).map((_, i) => {
          const r = Math.floor(i / 21);
          const c = i % 21;
          let on = cells[i];
          if (isFinder(r, c)) {
            const sr = r < 7 ? 0 : 14;
            const sc = c < 7 ? 0 : 14;
            on = finderColor(r, c, sr, sc);
          }
          return (
            <div
              key={i}
              className={cn("h-[9px] w-[9px]", on ? "bg-foreground" : "bg-white")}
            />
          );
        })}
      </div>
    </div>
  );
}

// ----- Screen 5: Success -----
function SuccessScreen({
  total,
  method,
  cardType,
  itemCount,
  onDone,
}: {
  total: number;
  method: PaymentMethod;
  cardType: CardType | null;
  itemCount: number;
  onDone: () => void;
}) {
  const [seconds, setSeconds] = useState(10);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const id = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          onDoneRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const methodLabel =
    method === "cartao"
      ? cardType === "credito"
        ? "Cartão de crédito"
        : cardType === "debito"
          ? "Cartão de débito"
          : "Cartão"
      : method === "pix"
        ? "Pix"
        : "Voucher";
  const now = useMemo(
    () =>
      new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [],
  );

  const confetti = useMemo(
    () =>
      Array.from({ length: 28 }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.5 + Math.random() * 2,
        color: ["#0F766E", "#16A34A", "#F59E0B", "#EC4899", "#6366F1"][i % 5],
        size: 6 + Math.random() * 6,
      })),
    [],
  );

  return (
    <div className="relative mx-auto flex h-screen max-w-[1100px] flex-col items-center overflow-hidden px-8 py-8">
      {/* confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((c, i) => (
          <span
            key={i}
            className="absolute top-0 block rounded-sm"
            style={{
              left: `${c.left}%`,
              width: c.size,
              height: c.size * 1.6,
              background: c.color,
              animation: `pos-confetti ${c.duration}s linear ${c.delay}s forwards`,
            }}
          />
        ))}
      </div>

      <header className="flex w-full items-center justify-between">
        <Logo />
        <div className="rounded-full bg-secondary px-4 py-1.5 text-xs font-medium text-muted-foreground tabular-nums">
          Retornando ao início em {seconds}s…
        </div>
      </header>

      <div className="relative z-10 mt-6 flex flex-col items-center text-center">
        <div
          className="check-pop grid h-28 w-28 place-items-center rounded-full text-white shadow-[0_20px_50px_-12px_oklch(0.65_0.18_145/0.55)]"
          style={{ backgroundColor: "var(--success)" }}
        >
          <Check className="h-14 w-14" strokeWidth={3} />
        </div>
        <h1 className="mt-5 text-5xl font-extrabold tracking-tight">
          Pagamento aprovado!
        </h1>
        <p className="mt-2 text-xl text-muted-foreground">
          Obrigado pela sua compra. Volte sempre!
        </p>
      </div>

      <div className="relative z-10 mt-6 grid w-full max-w-3xl grid-cols-[1fr_auto] gap-8 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        {/* Detalhes da compra */}
        <div className="min-w-0">
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Total pago
          </div>
          <div className="mt-1 text-5xl font-extrabold tracking-tight text-primary tabular-nums">
            {formatBRL(total)}
          </div>

          <div className="my-4 border-t border-dashed border-border" />

          <dl className="space-y-3 text-base">
            <Row label="Forma de pagamento" value={methodLabel} />
            <Row
              label="Itens"
              value={`${itemCount} ${itemCount === 1 ? "produto" : "produtos"}`}
            />
            <Row label="Data e hora" value={now} />
          </dl>
        </div>

        {/* Nota fiscal */}
        <div className="flex w-48 flex-col items-center justify-center border-l border-dashed border-border pl-8 text-center">
          <div className="rounded-xl bg-white p-3 ring-1 ring-border">
            <MiniQr />
          </div>
          <div className="mt-3 text-sm font-semibold">Nota fiscal</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Escaneie para acessar sua nota fiscal
          </div>
        </div>
      </div>

      <Button
        onClick={onDone}
        size="lg"
        className="relative z-10 mt-6 h-16 w-full max-w-3xl rounded-2xl text-lg font-bold shadow-[var(--shadow-elegant)]"
        style={{ background: "var(--gradient-brand)" }}
      >
        Concluir
      </Button>
    </div>
  );
}

function MiniQr() {
  const cells = useMemo(() => {
    const arr: boolean[] = [];
    let seed = 31;
    for (let i = 0; i < 13 * 13; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      arr.push(seed / 233280 > 0.5);
    }
    return arr;
  }, []);
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "repeat(13, 9px)",
        gridTemplateRows: "repeat(13, 9px)",
      }}
    >
      {cells.map((on, i) => (
        <div
          key={i}
          className={cn("h-[9px] w-[9px]", on ? "bg-foreground" : "bg-white")}
        />
      ))}
    </div>
  );
}

// ----- Confirm Dialog wrapper -----
function ConfirmDialog({
  open,
  title,
  description,
  cancelText,
  confirmText,
  onCancel,
  onConfirm,
  destructive,
}: {
  open: boolean;
  title: string;
  description?: string;
  cancelText: string;
  confirmText: string;
  onCancel: () => void;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl">{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-base">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-12 rounded-xl px-6 text-base">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              "h-12 rounded-xl px-6 text-base font-semibold",
              destructive &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}