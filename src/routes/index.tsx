import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  PiggyBank,
  Wallet,
  Target,
  Receipt,
  TrendingUp,
  Percent,
  Plus,
  Loader2,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { Button } from "@/components/ui/button";
import { TransactionDialog } from "@/components/common/TransactionDialog";
import { BudgetDialog } from "@/components/common/BudgetDialog";
import { GoalDialog } from "@/components/common/GoalDialog";
import {
  getAccounts,
  getBudgets,
  getCategories,
  getSavingsGoals,
  getTransactions,
} from "@/services/api";
import { formatCurrency, formatShortDate } from "@/lib/format";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  // Modal states
  const [txOpen, setTxOpen] = useState(false);
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);

  // Queries
  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });

  const { data: categories = [], isLoading: loadingCat } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: budgets = [], isLoading: loadingBudgets } = useQuery({
    queryKey: ["budgets"],
    queryFn: getBudgets,
  });

  const { data: savingsGoals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ["savingsGoals"],
    queryFn: getSavingsGoals,
  });

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  const isLoading = loadingTx || loadingCat || loadingBudgets || loadingGoals || loadingAccounts;

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-[70vh] flex-col items-center justify-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Cargando tu información financiera...</p>
        </div>
      </AppShell>
    );
  }

  const now = new Date();
  const monthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const incomeMonth = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenseMonth = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = incomeMonth - expenseMonth;
  const totalSaved = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const totalBudget = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
  const totalSpentBudget = budgets.reduce((s, b) => s + b.spent, 0);
  const remainingBudget = Math.max(0, totalBudget - totalSpentBudget);

  const byCategory = categories
    .filter((c) => c.type === "expense")
    .map((c) => ({
      name: c.name,
      value: monthTx.filter((t) => t.categoryId === c.id && t.type === "expense").reduce((s, t) => s + t.amount, 0),
      color: c.color,
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  const topCategory = byCategory[0]?.name ?? "—";

  // Daily last 14 days
  const daily = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (13 - i));
    const iso = d.toISOString().slice(0, 10);
    const dayTx = transactions.filter((t) => t.date.slice(0, 10) === iso);
    return {
      day: d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" }),
      gasto: dayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
      ingreso: dayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    };
  });

  // Last 6 months bar
  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const mTx = transactions.filter((t) => {
      const td = new Date(t.date);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    return {
      month: d.toLocaleDateString("es-MX", { month: "short" }),
      Ingresos: mTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      Gastos: mTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });

  // Savings evolution
  const savingsSeries = months.map((m, i) => ({
    month: m.month,
    ahorro: Math.round((totalSaved || 1) * (0.7 + i * 0.05)),
  }));

  const savingsPct = incomeMonth > 0 ? (balance / incomeMonth) * 100 : 0;

  const quickActions = [
    { label: "Agregar ingreso", icon: ArrowUpCircle, tone: "success" as const },
    { label: "Agregar gasto", icon: ArrowDownCircle, tone: "destructive" as const },
    { label: "Crear meta", icon: Target, tone: "info" as const },
    { label: "Nuevo presupuesto", icon: Receipt, tone: "warning" as const },
  ];

  const toneClass = {
    success: "bg-success/10 text-success hover:bg-success/20",
    destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
    info: "bg-info/10 text-info hover:bg-info/20",
    warning: "bg-warning/15 text-warning-foreground hover:bg-warning/25",
  };

  const handleQuickAction = (label: string) => {
    if (label === "Agregar ingreso") {
      setTxType("income");
      setTxOpen(true);
    } else if (label === "Agregar gasto") {
      setTxType("expense");
      setTxOpen(true);
    } else if (label === "Crear meta") {
      setGoalOpen(true);
    } else if (label === "Nuevo presupuesto") {
      setBudgetOpen(true);
    }
  };

  const recent = transactions.slice(0, 5);

  return (
    <AppShell>
      <PageHeader
        title="Buen día 👋"
        description="Aquí tienes el resumen financiero de tu mes."
        action={
          <Button
            className="rounded-full gradient-primary text-primary-foreground"
            onClick={() => {
              setTxType("expense");
              setTxOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva transacción
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Ingresos del mes" value={formatCurrency(incomeMonth)} icon={ArrowUpCircle} accent="success" trend={12.4} />
        <SummaryCard label="Gastos del mes" value={formatCurrency(expenseMonth)} icon={ArrowDownCircle} accent="destructive" trend={-4.2} />
        <SummaryCard label="Balance disponible" value={formatCurrency(balance)} icon={Wallet} accent="primary" hint="Ingresos - Gastos" />
        <SummaryCard label="Total ahorrado" value={formatCurrency(totalSaved)} icon={PiggyBank} accent="info" trend={15} />
        <SummaryCard label="Presupuesto restante" value={formatCurrency(remainingBudget)} icon={Receipt} accent="warning" hint={`de ${formatCurrency(totalBudget)}`} />
        <SummaryCard label="Mayor categoría" value={topCategory} icon={TrendingUp} accent="primary" />
        <SummaryCard label="Transacciones" value={String(monthTx.length)} icon={Receipt} accent="info" />
        <SummaryCard label="Ahorro mensual" value={`${savingsPct.toFixed(1)}%`} icon={Percent} accent="success" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((qa) => (
          <button
            key={qa.label}
            onClick={() => handleQuickAction(qa.label)}
            className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition cursor-pointer ${toneClass[qa.tone]}`}
          >
            <qa.icon className="h-4 w-4" /> {qa.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Gastos por categoría" description="Distribución del mes" className="lg:col-span-1">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                {byCategory.map((c, i) => (
                  <Cell key={i} fill={c.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Ingresos vs Gastos" description="Últimos 6 meses" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={months}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="Ingresos" fill="var(--color-success)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Gastos" fill="var(--color-destructive)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Gastos diarios" description="Últimos 14 días" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Line type="monotone" dataKey="gasto" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Evolución del ahorro" description="Últimos 6 meses">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={savingsSeries}>
              <defs>
                <linearGradient id="savings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Area type="monotone" dataKey="ahorro" stroke="var(--color-primary)" fill="url(#savings)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-6 card-elevated p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-base font-semibold">Movimientos recientes</h3>
          <a href="/transacciones" className="text-xs font-medium text-primary hover:underline">
            Ver todos
          </a>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No hay transacciones registradas.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((t) => {
              const cat = categories.find((c) => c.id === t.categoryId);
              return (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                    style={{ backgroundColor: `${cat?.color || "#94a3b8"}20`, color: cat?.color || "#94a3b8" }}
                  >
                    {t.type === "income" ? <ArrowUpCircle className="h-5 w-5" /> : <ArrowDownCircle className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{t.description}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {cat?.name || "Sin categoría"} · {formatShortDate(t.date)}
                    </div>
                  </div>
                  <div
                    className={`shrink-0 text-sm font-semibold ${
                      t.type === "income" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Dialogs */}
      <TransactionDialog isOpen={txOpen} onOpenChange={setTxOpen} defaultType={txType} />
      <BudgetDialog isOpen={budgetOpen} onOpenChange={setBudgetOpen} />
      <GoalDialog isOpen={goalOpen} onOpenChange={setGoalOpen} />
    </AppShell>
  );
}
