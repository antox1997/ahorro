import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, FileSpreadsheet, FileText, Printer, Loader2, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { Button } from "@/components/ui/button";
import { getCategories, getTransactions } from "@/services/api";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/reportes")({
  component: ReportsPage,
});

function ReportsPage() {
  // Queries
  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });

  const { data: categories = [], isLoading: loadingCat } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const isLoading = loadingTx || loadingCat;

  const now = new Date();
  const byCategory = categories
    .filter((c) => c.type === "expense")
    .map((c) => ({
      name: c.name,
      value: transactions.filter((t) => t.categoryId === c.id && t.type === "expense").reduce((s, t) => s + t.amount, 0),
      color: c.color,
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

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
      Flujo:
        mTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0) -
        mTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });

  const largest = [...transactions]
    .filter((t) => t.type === "expense")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  const exportBtn = (label: string, Icon: typeof Download) => (
    <Button variant="outline" size="sm" onClick={() => toast.info(`Exportando ${label} (demo)`)} className="cursor-pointer">
      <Icon className="mr-2 h-4 w-4" /> {label}
    </Button>
  );

  return (
    <AppShell>
      <PageHeader
        title="Reportes"
        description="Analiza tu comportamiento financiero."
        action={
          <div className="flex flex-wrap gap-2">
            {exportBtn("PDF", FileText)}
            {exportBtn("Excel", FileSpreadsheet)}
            {exportBtn("CSV", Download)}
            {exportBtn("Imprimir", Printer)}
          </div>
        }
      />

      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Generando reportes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Ingresos vs Gastos" description="Últimos 6 meses">
            <ResponsiveContainer width="100%" height={280}>
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

          <ChartCard title="Gastos por categoría" description="Distribución total">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={100}>
                  {byCategory.map((c, i) => (
                    <Cell key={i} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Flujo de efectivo" description="Balance mensual">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={months}>
                <defs>
                  <linearGradient id="flow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-info)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-info)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Area type="monotone" dataKey="Flujo" stroke="var(--color-info)" fill="url(#flow)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="card-elevated p-5 flex flex-col justify-between">
            <div>
              <h3 className="mb-4 font-display text-base font-semibold">Mayores gastos</h3>
              {largest.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No hay registros de gastos.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {largest.map((t) => {
                    const cat = categories.find((c) => c.id === t.categoryId);
                    return (
                      <li key={t.id} className="flex items-center justify-between py-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{t.description}</div>
                          <div className="text-xs text-muted-foreground">{cat?.name || "Sin categoría"}</div>
                        </div>
                        <div className="font-semibold text-destructive">-{formatCurrency(t.amount)}</div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
