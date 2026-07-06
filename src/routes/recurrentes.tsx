import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Repeat, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createRecurring,
  deleteRecurring,
  getAccounts,
  getCategories,
  getRecurring,
  updateRecurringStatus,
} from "@/services/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { RecurrenceFrequency, TransactionType } from "@/models";

const freqLabel: Record<string, string> = {
  daily: "Diaria",
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
  quarterly: "Trimestral",
  yearly: "Anual",
};

export const Route = createFileRoute("/recurrentes")({
  component: RecurringPage,
});

function RecurringPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("monthly");
  const [nextExecution, setNextExecution] = useState(new Date().toISOString().slice(0, 10));

  // Queries
  const { data: recurringTransactions = [], isLoading: loadingRec } = useQuery({
    queryKey: ["recurringTransactions"],
    queryFn: getRecurring,
  });

  const { data: categories = [], isLoading: loadingCat } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  // Toggle Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateRecurringStatus(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurringTransactions"] });
      toast.success("Estado del recurrente actualizado");
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Error al actualizar");
    },
  });

  const handleToggle = (id: string, active: boolean) => {
    toggleActiveMutation.mutate({ id, active });
  };

  const createRecurringMutation = useMutation({
    mutationFn: createRecurring,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurringTransactions"] });
      toast.success("Recurrente creado");
      setDialogOpen(false);
      setAmount("");
      setCategoryId("");
      setAccountId("");
      setDescription("");
      setFrequency("monthly");
      setNextExecution(new Date().toISOString().slice(0, 10));
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Error al crear el recurrente");
    },
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: deleteRecurring,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurringTransactions"] });
      toast.success("Recurrente eliminado");
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Error al eliminar el recurrente");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    if (!categoryId || !accountId || !description.trim()) {
      toast.error("Completa categoría, cuenta y descripción");
      return;
    }

    createRecurringMutation.mutate({
      type,
      amount: Number(amount),
      categoryId,
      accountId,
      description: description.trim(),
      frequency,
      nextExecution,
      active: true,
    });
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  const isLoading = loadingRec || loadingCat || loadingAccounts;

  return (
    <AppShell>
      <PageHeader
        title="Gastos recurrentes"
        description="Automatiza tus movimientos periódicos."
        action={
          <Button
            className="rounded-full gradient-primary text-primary-foreground cursor-pointer"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Nuevo recurrente
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando transacciones recurrentes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {recurringTransactions.length === 0 ? (
            <div className="col-span-full text-center py-12 border-2 border-dashed rounded-3xl bg-muted/20">
              <Repeat className="mx-auto h-12 w-12 text-muted-foreground/60 mb-2" />
              <p className="text-sm text-muted-foreground">No tienes transacciones recurrentes configuradas.</p>
            </div>
          ) : (
            recurringTransactions.map((r) => {
              const cat = categories.find((c) => c.id === r.categoryId);
              const acc = accounts.find((a) => a.id === r.accountId);
              return (
                <div key={r.id} className="card-elevated card-elevated-hover p-5 flex flex-col justify-between">
                  <div>
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                          style={{ backgroundColor: `${cat?.color || "#94a3b8"}20`, color: cat?.color || "#94a3b8" }}
                        >
                          <Repeat className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{r.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {cat?.name || "Sin categoría"} · {acc?.name || "Cuenta desc."}
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={r.active}
                        onCheckedChange={(checked) => handleToggle(r.id, checked)}
                        disabled={toggleActiveMutation.isPending}
                        className="cursor-pointer"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={deleteRecurringMutation.isPending}
                        onClick={() => {
                          if (confirm("¿Eliminar esta transacción recurrente?")) {
                            deleteRecurringMutation.mutate(r.id);
                          }
                        }}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Eliminar recurrente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-end justify-between mt-4">
                      <div>
                        <div className={`font-display text-xl font-semibold ${r.type === "income" ? "text-success" : "text-destructive"}`}>
                          {r.type === "income" ? "+" : "-"}
                          {formatCurrency(r.amount)}
                        </div>
                        <Badge variant="secondary" className="mt-1.5 text-[10px]">
                          {freqLabel[r.frequency]}
                        </Badge>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        Próxima:<br />
                        <span className="font-medium text-foreground">{formatDate(r.nextExecution)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">Nuevo recurrente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => {
                  setType("expense");
                  setCategoryId("");
                }}
                className={`rounded-lg py-2 text-sm font-medium transition ${
                  type === "expense" ? "bg-destructive text-destructive-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Gasto
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("income");
                  setCategoryId("");
                }}
                className={`rounded-lg py-2 text-sm font-medium transition ${
                  type === "income" ? "bg-success text-success-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Ingreso
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="recurring-amount">Monto</Label>
                <Input
                  id="recurring-amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Frecuencia</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurrenceFrequency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(freqLabel).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Categoría</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Cuenta</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="recurring-description">Descripción</Label>
              <Input
                id="recurring-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Renta, salario, suscripción"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="next-execution">Próxima ejecución</Label>
              <Input
                id="next-execution"
                type="date"
                value={nextExecution}
                onChange={(e) => setNextExecution(e.target.value)}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createRecurringMutation.isPending}>
                {createRecurringMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
