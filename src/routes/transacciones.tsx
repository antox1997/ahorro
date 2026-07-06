import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Filter, Plus, Search, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionDialog } from "@/components/common/TransactionDialog";
import { getAccounts, getCategories, getTransactions, deleteTransaction } from "@/services/api";
import { formatCurrency, formatDate } from "@/lib/format";

export const Route = createFileRoute("/transacciones")({
  component: TransactionsPage,
});

const methodLabel: Record<string, string> = {
  cash: "Efectivo",
  debit_card: "Débito",
  credit_card: "Crédito",
  transfer: "Transferencia",
  other: "Otro",
};

function TransactionsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [txOpen, setTxOpen] = useState(false);
  const pageSize = 12;

  // Queries
  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });

  const { data: categories = [], isLoading: loadingCat } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  // Mutation to delete a transaction
  const deleteTxMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["insights"] });
      toast.success("Transacción eliminada");
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Error al eliminar la transacción");
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta transacción? El saldo de la cuenta asociada se ajustará.")) {
      deleteTxMutation.mutate(id);
    }
  };

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (categoryFilter !== "all" && t.categoryId !== categoryFilter) return false;
      if (methodFilter !== "all" && t.paymentMethod !== methodFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const cat = categories.find((c) => c.id === t.categoryId)?.name.toLowerCase() ?? "";
        const acc = accounts.find((a) => a.id === t.accountId)?.name.toLowerCase() ?? "";
        if (
          !t.description.toLowerCase().includes(q) &&
          !cat.includes(q) &&
          !acc.includes(q) &&
          !String(t.amount).includes(q)
        )
          return false;
      }
      return true;
    });
  }, [transactions, query, typeFilter, categoryFilter, methodFilter, categories, accounts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const isLoading = loadingTx || loadingCat || loadingAccounts;

  return (
    <AppShell>
      <PageHeader
        title="Transacciones"
        description="Historial completo de tus movimientos."
        action={
          <Button
            className="rounded-full gradient-primary text-primary-foreground cursor-pointer"
            onClick={() => setTxOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva
          </Button>
        }
      />

      <div className="card-elevated mb-4 flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por descripción, categoría, monto..."
            className="h-10 rounded-full pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={typeFilter}
            onValueChange={(val) => {
              setTypeFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-[140px] rounded-full">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="income">Ingresos</SelectItem>
              <SelectItem value="expense">Gastos</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={categoryFilter}
            onValueChange={(val) => {
              setCategoryFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-[180px] rounded-full">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={methodFilter}
            onValueChange={(val) => {
              setMethodFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-[160px] rounded-full">
              <SelectValue placeholder="Método" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los métodos</SelectItem>
              {Object.entries(methodLabel).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando movimientos...</p>
        </div>
      ) : (
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron transacciones.
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((t) => {
                    const cat = categories.find((c) => c.id === t.categoryId);
                    const acc = accounts.find((a) => a.id === t.accountId);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(t.date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="grid h-8 w-8 place-items-center rounded-lg"
                              style={{ backgroundColor: `${cat?.color || "#94a3b8"}20`, color: cat?.color || "#94a3b8" }}
                            >
                              {t.type === "income" ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{t.description}</div>
                              {t.recurring && (
                                <Badge variant="secondary" className="mt-0.5 text-[10px]">
                                  Recurrente
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                            style={{ backgroundColor: `${cat?.color || "#94a3b8"}15`, color: cat?.color || "#94a3b8" }}
                          >
                            {cat?.name || "Sin categoría"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{acc?.name || "Desconocida"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{methodLabel[t.paymentMethod] || t.paymentMethod}</TableCell>
                        <TableCell
                          className={`text-right font-semibold ${t.type === "income" ? "text-success" : "text-destructive"}`}
                        >
                          {t.type === "income" ? "+" : "-"}
                          {formatCurrency(t.amount)}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleDelete(t.id)}
                            disabled={deleteTxMutation.isPending}
                            className="text-muted-foreground hover:text-destructive p-1 rounded transition hover:bg-destructive/10 cursor-pointer"
                            title="Eliminar transacción"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <span className="text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Dialog */}
      <TransactionDialog isOpen={txOpen} onOpenChange={setTxOpen} />
    </AppShell>
  );
}
