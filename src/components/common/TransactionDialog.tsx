import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getAccounts, getCategories, createTransaction } from "@/services/api";
import type { PaymentMethod, TransactionType } from "@/models";

interface TransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: TransactionType;
}

export function TransactionDialog({
  isOpen,
  onOpenChange,
  defaultType = "expense",
}: TransactionDialogProps) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  // Sync state if defaultType changes
  useEffect(() => {
    setType(defaultType);
  }, [defaultType]);

  // Queries
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
    enabled: isOpen,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    enabled: isOpen,
  });

  // Filter categories by selected type
  const filteredCategories = categories.filter((c) => c.type === type);

  // Mutation
  const createTxMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["insights"] });
      toast.success("Transacción registrada con éxito");
      onOpenChange(false);
      // Reset form
      setAmount("");
      setCategoryId("");
      setAccountId("");
      setDate(new Date());
      setPaymentMethod("cash");
      setDescription("");
      setNotes("");
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Error al guardar la transacción");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Por favor ingresa un monto válido");
      return;
    }
    if (!categoryId) {
      toast.error("Por favor selecciona una categoría");
      return;
    }
    if (!accountId) {
      toast.error("Por favor selecciona una cuenta");
      return;
    }
    if (!description.trim()) {
      toast.error("Por favor ingresa una descripción");
      return;
    }

    createTxMutation.mutate({
      date: date.toISOString(),
      type,
      amount: Number(amount),
      categoryId,
      accountId,
      paymentMethod,
      description: description.trim(),
      notes: notes.trim() || undefined,
      recurring: false,
      status: "completed",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            Registrar Movimiento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Type Selector */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`rounded-lg py-2 text-sm font-medium transition ${
                type === "expense"
                  ? "bg-destructive text-destructive-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`rounded-lg py-2 text-sm font-medium transition ${
                type === "income"
                  ? "bg-success text-success-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Ingreso
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-1">
              <Label htmlFor="amount">Monto ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            {/* Date */}
            <div className="space-y-1">
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: es }) : <span>Selecciona</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1">
              <Label>Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.length === 0 ? (
                    <div className="py-2 px-3 text-xs text-muted-foreground text-center">
                      No hay categorías
                    </div>
                  ) : (
                    filteredCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-3.5 w-3.5 rounded-full shrink-0"
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

            {/* Account */}
            <div className="space-y-1">
              <Label>Cuenta</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.length === 0 ? (
                    <div className="py-2 px-3 text-xs text-muted-foreground text-center">
                      No hay cuentas
                    </div>
                  ) : (
                    accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-3.5 w-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: a.color }}
                          />
                          <span>{a.name}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Method & Description */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Método de Pago</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="debit_card">Tarjeta de Débito</SelectItem>
                  <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                placeholder="Ej. Supermercado, Almuerzo"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Detalles adicionales del movimiento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none h-16"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createTxMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createTxMutation.isPending}>
              {createTxMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
