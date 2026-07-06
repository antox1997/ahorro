import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { createAccount } from "@/services/api";

interface AccountDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const colorOptions = [
  { label: "Verde Esmeralda", value: "#10b981" },
  { label: "Azul Real", value: "#3b82f6" },
  { label: "Índigo", value: "#6366f1" },
  { label: "Naranja", value: "#f59e0b" },
  { label: "Rojo Carmín", value: "#ef4444" },
  { label: "Púrpura", value: "#8b5cf6" },
  { label: "Rosa", value: "#ec4899" },
  { label: "Gris Azulado", value: "#64748b" },
];

const iconOptions = [
  { label: "Billetera", value: "Wallet" },
  { label: "Banco Principal", value: "Landmark" },
  { label: "Edificio / Secundario", value: "Building2" },
  { label: "Tarjeta de Crédito", value: "CreditCard" },
  { label: "Alcancía / Ahorros", value: "PiggyBank" },
];

export function AccountDialog({ isOpen, onOpenChange }: AccountDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [type, setType] = useState<"cash" | "bank" | "credit_card" | "savings">("bank");
  const [color, setColor] = useState("#3b82f6");
  const [icon, setIcon] = useState("Landmark");
  const [initialBalance, setInitialBalance] = useState("");

  const createAccountMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Cuenta creada correctamente");
      onOpenChange(false);
      // Reset state
      setName("");
      setType("bank");
      setColor("#3b82f6");
      setIcon("Landmark");
      setInitialBalance("");
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Error al crear la cuenta");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Por favor ingresa un nombre para la cuenta");
      return;
    }
    if (!initialBalance || isNaN(Number(initialBalance))) {
      toast.error("Por favor ingresa un saldo inicial válido");
      return;
    }

    createAccountMutation.mutate({
      name: name.trim(),
      type,
      color,
      icon,
      initialBalance: Number(initialBalance),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            Nueva Cuenta / Tarjeta
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="name">Nombre de la Cuenta</Label>
            <Input
              id="name"
              placeholder="Ej. Cuenta Nómina, Billetera Efectivo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-1">
            <Label>Tipo de Cuenta</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as "cash" | "bank" | "credit_card" | "savings")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="bank">Cuenta Bancaria</SelectItem>
                <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                <SelectItem value="savings">Cuenta de Ahorro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Initial Balance */}
          <div className="space-y-1">
            <Label htmlFor="initialBalance">Saldo Inicial ($)</Label>
            <Input
              id="initialBalance"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Color */}
            <div className="space-y-1">
              <Label>Color de Tarjeta</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((co) => (
                    <SelectItem key={co.value} value={co.value}>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: co.value }}
                        />
                        <span>{co.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Icon */}
            <div className="space-y-1">
              <Label>Icono</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((io) => (
                    <SelectItem key={io.value} value={io.value}>
                      {io.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createAccountMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createAccountMutation.isPending}>
              {createAccountMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando...
                </>
              ) : (
                "Crear"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
