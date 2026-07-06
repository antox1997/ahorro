import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, CalendarRange } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { getTransactions, getCategories } from "@/services/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendario")({
  component: CalendarPage,
});

function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<string | null>(null);

  // Queries
  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });

  const { data: categories = [], isLoading: loadingCat } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const monthLabel = cursor.toLocaleDateString("es-MX", { month: "long", year: "numeric" });

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startWeekday = (first.getDay() + 6) % 7; // Monday first
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [cursor]);

  const dayData = (d: Date) => {
    const iso = d.toISOString().slice(0, 10);
    const list = transactions.filter((t) => t.date.slice(0, 10) === iso);
    const income = list.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = list.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { iso, list, income, expense, balance: income - expense };
  };

  const selectedList = selected
    ? transactions.filter((t) => t.date.slice(0, 10) === selected)
    : [];

  const isLoading = loadingTx || loadingCat;

  return (
    <AppShell>
      <PageHeader title="Calendario" description="Visualiza tus movimientos por día." />

      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando calendario...</p>
        </div>
      ) : (
        <>
          <div className="card-elevated p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold capitalize">{monthLabel}</h3>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setCursor(new Date())}>
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                <div key={d} className="py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (!d) return <div key={i} className="h-24 rounded-lg" />;
                const data = dayData(d);
                const isSelected = selected === data.iso;
                const isToday = data.iso === new Date().toISOString().slice(0, 10);
                return (
                  <button
                    key={i}
                    onClick={() => setSelected(data.iso)}
                    className={cn(
                      "flex h-24 flex-col items-start gap-1 rounded-lg border p-2 text-left transition hover:bg-accent cursor-pointer",
                      isSelected && "border-primary ring-2 ring-primary/30",
                      isToday && "bg-primary/5",
                    )}
                  >
                    <span className="text-xs font-semibold">{d.getDate()}</span>
                    {data.list.length > 0 && (
                      <>
                        <span className="text-[10px] text-success font-medium">+{formatCurrency(data.income)}</span>
                        <span className="text-[10px] text-destructive font-medium">-{formatCurrency(data.expense)}</span>
                        <span className="mt-auto text-[10px] text-muted-foreground">{data.list.length} mov.</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selected && (
            <div className="card-elevated mt-4 p-5">
              <h3 className="mb-3 font-display text-base font-semibold">
                Movimientos del {new Date(selected + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}
              </h3>
              {selectedList.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin movimientos ese día.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {selectedList.map((t) => {
                    const cat = categories.find((c) => c.id === t.categoryId);
                    return (
                      <li key={t.id} className="flex items-center justify-between py-3">
                        <div>
                          <div className="text-sm font-medium">{t.description}</div>
                          <div className="text-xs text-muted-foreground">{cat?.name || "Sin categoría"}</div>
                        </div>
                        <div className={t.type === "income" ? "font-semibold text-success" : "font-semibold text-destructive"}>
                          {t.type === "income" ? "+" : "-"}
                          {formatCurrency(t.amount)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
