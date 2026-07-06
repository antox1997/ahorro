import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, FolderTree } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getCategories, getTransactions, createCategory, deleteCategory } from "@/services/api";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/categorias")({
  component: CategoriesPage,
});

function CategoryList({
  type,
  categories,
  transactions,
  onDelete,
  deletePending,
}: {
  type: "income" | "expense";
  categories: any[];
  transactions: any[];
  onDelete: (id: string, name: string) => void;
  deletePending: boolean;
}) {
  const list = categories.filter((c) => c.type === type);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((c) => {
        const total = transactions
          .filter((t) => t.categoryId === c.id)
          .reduce((s, t) => s + t.amount, 0);

        return (
          <div key={c.id} className="card-elevated card-elevated-hover flex items-center gap-3 p-4">
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold"
              style={{ backgroundColor: `${c.color}20`, color: c.color }}
            >
              {c.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{c.name}</div>
              <div className="text-xs text-muted-foreground">Total: {formatCurrency(total)}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                disabled={deletePending}
                onClick={() => onDelete(c.id, c.name)}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                title="Eliminar categoría"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CategoriesPage() {
  const queryClient = useQueryClient();

  // Queries
  const { data: categories = [], isLoading: loadingCat } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });

  // Delete Mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Categoría eliminada");
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Error al eliminar la categoría");
    },
  });

  // Create Mutation
  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoría creada");
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Error al crear la categoría");
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar la categoría "${name}"? Las transacciones asociadas perderán esta categoría.`)) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleAddCategory = () => {
    const name = prompt("Ingresa el nombre de la nueva categoría:");
    if (!name || !name.trim()) return;

    const typeInput = prompt("¿Es de tipo Gasto o Ingreso? (Escribe 'gasto' o 'ingreso')");
    if (!typeInput) return;
    const cleanType = typeInput.trim().toLowerCase();
    
    if (cleanType !== "gasto" && cleanType !== "ingreso") {
      toast.error("Tipo inválido. Debe ser 'gasto' o 'ingreso'");
      return;
    }

    const type = cleanType === "gasto" ? "expense" : "income";

    // Random color
    const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#ec4899", "#06b6d4"];
    const color = colors[Math.floor(Math.random() * colors.length)];

    createCategoryMutation.mutate({
      name: name.trim(),
      type,
      color,
      icon: type === "expense" ? "ShoppingBag" : "TrendingUp",
    });
  };

  const isLoading = loadingCat || loadingTx;

  return (
    <AppShell>
      <PageHeader
        title="Categorías"
        description="Organiza tus movimientos con etiquetas personalizadas."
        action={
          <Button
            className="rounded-full gradient-primary text-primary-foreground cursor-pointer"
            onClick={handleAddCategory}
            disabled={createCategoryMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva categoría
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando categorías...</p>
        </div>
      ) : (
        <Tabs defaultValue="expense">
          <TabsList>
            <TabsTrigger value="expense" className="cursor-pointer">Gastos</TabsTrigger>
            <TabsTrigger value="income" className="cursor-pointer">Ingresos</TabsTrigger>
          </TabsList>
          <TabsContent value="expense" className="mt-4">
            {categories.filter((c) => c.type === "expense").length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-3xl bg-muted/20">
                <FolderTree className="mx-auto h-12 w-12 text-muted-foreground/60 mb-2" />
                <p className="text-sm text-muted-foreground">No tienes categorías de gastos definidas.</p>
              </div>
            ) : (
              <CategoryList
                type="expense"
                categories={categories}
                transactions={transactions}
                onDelete={handleDelete}
                deletePending={deleteCategoryMutation.isPending}
              />
            )}
          </TabsContent>
          <TabsContent value="income" className="mt-4">
            {categories.filter((c) => c.type === "income").length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-3xl bg-muted/20">
                <FolderTree className="mx-auto h-12 w-12 text-muted-foreground/60 mb-2" />
                <p className="text-sm text-muted-foreground">No tienes categorías de ingresos definidas.</p>
              </div>
            ) : (
              <CategoryList
                type="income"
                categories={categories}
                transactions={transactions}
                onDelete={handleDelete}
                deletePending={deleteCategoryMutation.isPending}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </AppShell>
  );
}
