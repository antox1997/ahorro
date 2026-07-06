import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, CalendarIcon } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createSavingsGoal } from "@/services/api";

interface GoalDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const colorOptions = [
  { label: "Azul", value: "#3b82f6" },
  { label: "Menta", value: "#14b8a6" },
  { label: "Naranja", value: "#f59e0b" },
  { label: "Púrpura", value: "#8b5cf6" },
  { label: "Verde", value: "#10b981" },
  { label: "Fucsia", value: "#d946ef" },
  { label: "Rojo", value: "#ef4444" },
];

const iconOptions = [
  { label: "Escudo / Emergencia", value: "Shield" },
  { label: "Avión / Vacaciones", value: "Plane" },
  { label: "Carro / Transporte", value: "Car" },
  { label: "Laptop / Electrónica", value: "Laptop" },
  { label: "Tendencia / Inversiones", value: "TrendingUp" },
  { label: "Trofeo / Logro", value: "Trophy" },
];

export function GoalDialog({ isOpen, onOpenChange }: GoalDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth() + 6, new Date().getDate()));
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [icon, setIcon] = useState("Shield");

  const createGoalMutation = useMutation({
    mutationFn: createSavingsGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingsGoals"] });
      queryClient.invalidateQueries({ queryKey: ["insights"] });
      toast.success("Meta de ahorro creada correctamente");
      onOpenChange(false);
      // Reset state
      setName("");
      setTargetAmount("");
      setMonthlyContribution("");
      setColor("#3b82f6");
      setIcon("Shield");
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || "Error al crear la meta de ahorro");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Por favor ingresa un nombre para la meta");
      return;
    }
    if (!targetAmount || isNaN(Number(targetAmount)) || Number(targetAmount) <= 0) {
      toast.error("Por favor ingresa un monto objetivo válido");
      return;
    }
    if (!deadline) {
      toast.error("Por favor selecciona una fecha límite");
      return;
    }

    createGoalMutation.mutate({
      name: name.trim(),
      targetAmount: Number(targetAmount),
      deadline: deadline.toISOString(),
      monthlyContribution: monthlyContribution ? Number(monthlyContribution) : 0,
      color,
      icon,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            Nueva Meta de Ahorro
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="goal-name">Nombre de la Meta</Label>
            <Input
              id="goal-name"
              placeholder="Ej. Vacaciones de Verano, Fondo de Paz"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Target Amount */}
            <div className="space-y-1">
              <Label htmlFor="targetAmount">Monto Objetivo ($)</Label>
              <Input
                id="targetAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
              />
            </div>

            {/* Monthly Contribution */}
            <div className="space-y-1">
              <Label htmlFor="monthlyContribution">Aporte Mensual ($)</Label>
              <Input
                id="monthlyContribution"
                type="number"
                step="0.01"
                placeholder="Opcional"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
              />
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-1">
            <Label>Fecha Límite</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, "PPP", { locale: es }) : <span>Selecciona</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={(d) => d && setDeadline(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Color */}
            <div className="space-y-1">
              <Label>Color Representativo</Label>
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
              disabled={createGoalMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createGoalMutation.isPending}>
              {createGoalMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando...
                </>
              ) : (
                "Crear Meta"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
