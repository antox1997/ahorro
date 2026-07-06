import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCategories, createBudget } from "@/services/api";

interface BudgetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BudgetDialog({ isOpen, onOpenChange }: BudgetDialogProps) {
  const queryClient = useQueryClient();
  const [categoryId, setCategoryId] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  
  // Format current month as YYYY-MM
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonthStr);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    enabled: isOpen,
  });

  // Filter only expense categories
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const createBudgetMutation = useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Límite de presupuesto guardado");
      onOpenChange(false);
      // Reset state
      setCategoryId("");
      setMonthlyLimit("");
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Error al guardar el presupuesto. ¿Ya existe presupuesto para esta categoría?");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error("Por favor selecciona una categoría");
      return;
    }
    if (!monthlyLimit || isNaN(Number(monthlyLimit)) || Number(monthlyLimit) <= 0) {
      toast.error("Por favor ingresa un límite mensual válido");
      return;
    }

    createBudgetMutation.mutate({
      categoryId,
      monthlyLimit: Number(monthlyLimit),
      month,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            Definir Presupuesto Mensual
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Category */}
          <div className="space-y-1">
            <Label>Categoría de Gasto</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.length === 0 ? (
                  <div className="py-2 px-3 text-xs text-muted-foreground text-center">
                    No hay categorías
                  </div>
                ) : (
                  expenseCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: c.color }}
                        />
                        <span>{c.name}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Monthly Limit */}
          <div className="space-y-1">
            <Label htmlFor="monthlyLimit">Límite Mensual ($)</Label>
            <Input
              id="monthlyLimit"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              required
            />
          </div>

          {/* Month select (simplified) */}
          <div className="space-y-1">
            <Label htmlFor="month">Mes de aplicación</Label>
            <Input
              id="month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createBudgetMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createBudgetMutation.isPending}>
              {createBudgetMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                "Establecer Límite"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
