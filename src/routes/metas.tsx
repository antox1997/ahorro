import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Target, Trash2, PiggyBank, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GoalDialog } from "@/components/common/GoalDialog";
import { getSavingsGoals, deleteSavingsGoal, updateSavingsGoalAmount } from "@/services/api";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/metas")({
  component: SavingsPage,
});

function SavingsPage() {
  const queryClient = useQueryClient();
  const [goalOpen, setGoalOpen] = useState(false);

  // Queries
  const { data: savingsGoals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ["savingsGoals"],
    queryFn: getSavingsGoals,
  });

  // Delete Mutation
  const deleteGoalMutation = useMutation({
    mutationFn: deleteSavingsGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingsGoals"] });
      queryClient.invalidateQueries({ queryKey: ["insights"] });
      toast.success("Meta de ahorro eliminada");
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Error al eliminar la meta");
    },
  });

  // Update Amount Mutation
  const addSavingsMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      updateSavingsGoalAmount(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingsGoals"] });
      queryClient.invalidateQueries({ queryKey: ["insights"] });
      toast.success("Ahorro registrado");
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Error al actualizar el saldo de la meta");
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la meta de ahorro "${name}"?`)) {
      deleteGoalMutation.mutate(id);
    }
  };

  const handleAddSavings = (id: string, name: string, current: number, target: number) => {
    const input = prompt(`¿Cuánto deseas aportar a tu meta "${name}"?`);
    if (input === null) return; // cancelled
    const val = Number(input);
    if (isNaN(val) || val <= 0) {
      toast.error("Por favor ingresa un monto válido");
      return;
    }
    const nextAmount = Math.min(target, current + val);
    addSavingsMutation.mutate({ id, amount: nextAmount });
  };

  const isLoading = loadingGoals;

  return (
    <AppShell>
      <PageHeader
        title="Metas de ahorro"
        description="Alcanza tus objetivos financieros paso a paso."
        action={
          <Button
            className="rounded-full gradient-primary text-primary-foreground cursor-pointer"
            onClick={() => setGoalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva meta
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando metas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {savingsGoals.length === 0 ? (
            <div className="col-span-full text-center py-12 border-2 border-dashed rounded-3xl bg-muted/20">
              <Target className="mx-auto h-12 w-12 text-muted-foreground/60 mb-3" />
              <p className="text-base font-medium">No tienes metas de ahorro</p>
              <p className="text-sm text-muted-foreground mb-4">Crea objetivos claros como viajes, compras o fondos de emergencia.</p>
              <Button onClick={() => setGoalOpen(true)} className="rounded-full">
                Crear tu primera meta
              </Button>
            </div>
          ) : (
            savingsGoals.map((g) => {
              const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
              const remaining = g.targetAmount - g.currentAmount;
              const monthsRemaining = g.monthlyContribution > 0 ? Math.ceil(remaining / g.monthlyContribution) : 0;

              return (
                <div key={g.id} className="card-elevated card-elevated-hover overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="relative h-24" style={{ background: `linear-gradient(135deg, ${g.color}, ${g.color}80)` }}>
                      <div className="absolute inset-0 flex items-center justify-between p-5">
                        <div className="text-primary-foreground min-w-0">
                          <div className="text-xs opacity-80">Meta</div>
                          <div className="font-display text-lg font-semibold truncate max-w-[200px]">{g.name}</div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleDelete(g.id, g.name)}
                            disabled={deleteGoalMutation.isPending}
                            className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 hover:bg-destructive text-white hover:text-white transition duration-200 cursor-pointer"
                            title="Eliminar meta"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/25 text-white backdrop-blur">
                            <Target className="h-6 w-6" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 pb-2">
                      <div className="mb-2 flex items-baseline justify-between">
                        <span className="font-display text-2xl font-semibold">{formatCurrency(g.currentAmount)}</span>
                        <span className="text-sm text-muted-foreground">de {formatCurrency(g.targetAmount)}</span>
                      </div>
                      <Progress value={pct} />
                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-muted-foreground font-light">Restante</div>
                          <div className="font-medium text-foreground">{formatCurrency(remaining)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground font-light">Progreso</div>
                          <div className="font-medium text-foreground">{pct.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground font-light">Aporte mensual</div>
                          <div className="font-medium text-foreground">{formatCurrency(g.monthlyContribution)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground font-light">Fecha límite</div>
                          <div className="font-medium text-foreground">{formatDate(g.deadline)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 pt-0">
                    <div className="my-3 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
                      Finalización estimada: <strong className="text-foreground">{monthsRemaining} meses</strong> al ritmo actual.
                    </div>
                    <Button
                      onClick={() => handleAddSavings(g.id, g.name, g.currentAmount, g.targetAmount)}
                      disabled={addSavingsMutation.isPending}
                      variant="outline"
                      className="w-full rounded-xl flex items-center justify-center gap-2 border-primary/20 text-primary hover:bg-primary/5 cursor-pointer font-medium"
                    >
                      <PiggyBank className="h-4 w-4" /> Aportar Ahorro
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Goal Modal */}
      <GoalDialog isOpen={goalOpen} onOpenChange={setGoalOpen} />
    </AppShell>
  );
}
