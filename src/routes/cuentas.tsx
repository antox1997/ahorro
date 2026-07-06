import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Wallet, Landmark, Building2, CreditCard, PiggyBank, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { AccountDialog } from "@/components/common/AccountDialog";
import { getAccounts, getTransactions, deleteAccount } from "@/services/api";
import { formatCurrency, formatDate } from "@/lib/format";

const iconMap = { Wallet, Landmark, Building2, CreditCard, PiggyBank } as const;

export const Route = createFileRoute("/cuentas")({
  component: AccountsPage,
});

function AccountsPage() {
  const queryClient = useQueryClient();
  const [accountOpen, setAccountOpen] = useState(false);

  // Queries
  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });

  // Delete Mutation
  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["insights"] });
      toast.success("Cuenta eliminada correctamente");
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Error al eliminar la cuenta");
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la cuenta "${name}"? Se eliminarán también todas las transacciones asociadas.`)) {
      deleteAccountMutation.mutate(id);
    }
  };

  const isLoading = loadingAccounts || loadingTx;

  return (
    <AppShell>
      <PageHeader
        title="Cuentas"
        description="Todas tus cuentas y tarjetas en un solo lugar."
        action={
          <Button
            className="rounded-full gradient-primary text-primary-foreground cursor-pointer"
            onClick={() => setAccountOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva cuenta
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando cuentas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.length === 0 ? (
            <div className="col-span-full text-center py-12 border-2 border-dashed rounded-3xl bg-muted/20">
              <Wallet className="mx-auto h-12 w-12 text-muted-foreground/60 mb-3" />
              <p className="text-base font-medium">No tienes cuentas registradas</p>
              <p className="text-sm text-muted-foreground mb-4">Crea una cuenta para comenzar a llevar el registro de tus transacciones.</p>
              <Button onClick={() => setAccountOpen(true)} className="rounded-full">
                Crear tu primera cuenta
              </Button>
            </div>
          ) : (
            accounts.map((a) => {
              const Icon = (iconMap as Record<string, typeof Wallet>)[a.icon] ?? Wallet;
              const list = transactions.filter((t) => t.accountId === a.id);
              const income = list.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
              const expense = list.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
              const last = list[0];

              return (
                <div key={a.id} className="card-elevated card-elevated-hover overflow-hidden flex flex-col justify-between">
                  <div>
                    <div
                      className="relative p-5 text-primary-foreground"
                      style={{ background: `linear-gradient(135deg, ${a.color}, ${a.color}CC)` }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs opacity-80">{a.type === "credit_card" ? "Tarjeta" : "Cuenta"}</div>
                          <div className="font-display text-lg font-semibold truncate max-w-[180px]">{a.name}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(a.id, a.name)}
                            disabled={deleteAccountMutation.isPending}
                            className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 hover:bg-destructive text-white hover:text-white transition duration-200 cursor-pointer"
                            title="Eliminar cuenta"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/20 backdrop-blur">
                            <Icon className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                      <div className="mt-6">
                        <div className="text-xs opacity-85">Balance disponible</div>
                        <div className="font-display text-2xl font-semibold">{formatCurrency(a.balance)}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 divide-x border-t text-center">
                      <div className="p-3">
                        <div className="text-xs text-muted-foreground">Ingresos</div>
                        <div className="text-sm font-semibold text-success">{formatCurrency(income)}</div>
                      </div>
                      <div className="p-3">
                        <div className="text-xs text-muted-foreground">Gastos</div>
                        <div className="text-sm font-semibold text-destructive">{formatCurrency(expense)}</div>
                      </div>
                    </div>
                  </div>
                  {last && (
                    <div className="border-t p-3 text-xs text-muted-foreground bg-muted/10 truncate">
                      Último movimiento: <span className="font-medium text-foreground">{last.description}</span> · {formatDate(last.date)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Account Modal */}
      <AccountDialog isOpen={accountOpen} onOpenChange={setAccountOpen} />
    </AppShell>
  );
}
