import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, Plus, TriangleAlert, Trash2, Loader2, PieChart } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BudgetDialog } from "@/components/common/BudgetDialog";
import { getBudgets, getCategories, deleteBudget } from "@/services/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/presupuesto")({
  component: BudgetPage,
});

function BudgetPage() {
  const queryClient = useQueryClient();
  const [budgetOpen, setBudgetOpen] = useState(false);

  // Queries
  const { data: budgets = [], isLoading: loadingBudgets } = useQuery({
    queryKey: ["budgets"],
    queryFn: getBudgets,
  });

  const { data: categories = [], isLoading: loadingCat } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // Delete Mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Presupuesto eliminado");
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Error al eliminar el presupuesto");
    },
  });

  const handleDelete = (id: string, categoryName: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el presupuesto de "${categoryName}"?`)) {
      deleteBudgetMutation.mutate(id);
    }
  };

  const isLoading = loadingBudgets || loadingCat;

  return (
    <AppShell>
      <PageHeader
        title="Presupuesto mensual"
        description="Define límites por categoría y monitorea tu progreso."
        action={
          <Button
            className="rounded-full gradient-primary text-primary-foreground cursor-pointer"
            onClick={() => setBudgetOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Nuevo presupuesto
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando presupuestos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {budgets.length === 0 ? (
            <div className="col-span-full text-center py-12 border-2 border-dashed rounded-3xl bg-muted/20">
              <PieChart className="mx-auto h-12 w-12 text-muted-foreground/60 mb-3" />
              <p className="text-base font-medium">No has definido presupuestos</p>
              <p className="text-sm text-muted-foreground mb-4">Establece límites mensuales para controlar tus gastos por categoría.</p>
              <Button onClick={() => setBudgetOpen(true)} className="rounded-full">
                Crear tu primer presupuesto
              </Button>
            </div>
          ) : (
            budgets.map((b) => {
              const cat = categories.find((c) => c.id === b.categoryId);
              const pct = Math.min(200, (b.spent / b.monthlyLimit) * 100);
              const remaining = b.monthlyLimit - b.spent;
              const alertType = pct >= 100 ? "danger" : pct >= 90 ? "warning" : null;

              return (
                <div key={b.id} className="card-elevated card-elevated-hover p-5 flex flex-col justify-between">
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                          style={{ backgroundColor: `${cat?.color || "#94a3b8"}20`, color: cat?.color || "#94a3b8" }}
                        >
                          <span className="text-sm font-bold">{cat?.name.charAt(0) || "P"}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{cat?.name || "Sin categoría"}</div>
                          <div className="text-xs text-muted-foreground">Límite {formatCurrency(b.monthlyLimit)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {alertType && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                              alertType === "danger"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-warning/20 text-warning-foreground",
                            )}
                          >
                            {alertType === "danger" ? <TriangleAlert className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                            {alertType === "danger" ? "Excedido" : "Al límite"}
                          </span>
                        )}
                        <button
                          onClick={() => handleDelete(b.id, cat?.name || "Categoría")}
                          disabled={deleteBudgetMutation.isPending}
                          className="text-muted-foreground hover:text-destructive p-1 rounded transition hover:bg-destructive/10 cursor-pointer"
                          title="Eliminar presupuesto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-2 flex items-baseline justify-between">
                      <span className="font-display text-xl font-semibold">{formatCurrency(b.spent)}</span>
                      <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                    </div>
                    <Progress
                      value={Math.min(100, pct)}
                      className={cn(pct >= 100 && "[&>div]:bg-destructive", pct >= 90 && pct < 100 && "[&>div]:bg-warning")}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                    <span>Restante</span>
                    <span className={remaining < 0 ? "font-medium text-destructive" : "font-medium text-foreground"}>
                      {formatCurrency(remaining)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Budget Modal */}
      <BudgetDialog isOpen={budgetOpen} onOpenChange={setBudgetOpen} />
    </AppShell>
  );
}
