// Mock data for the app. Replace with Antigravity backend calls later.
import type {
  Account,
  Budget,
  Category,
  FinancialInsight,
  NotificationItem,
  RecurringTransaction,
  SavingsGoal,
  Transaction,
} from "@/models";

export const accounts: Account[] = [
  { id: "a1", name: "Efectivo", type: "cash", color: "#10b981", icon: "Wallet", balance: 1250, initialBalance: 1000 },
  { id: "a2", name: "Banco Principal", type: "bank", color: "#3b82f6", icon: "Landmark", balance: 8450.32, initialBalance: 8000 },
  { id: "a3", name: "Banco Secundario", type: "bank", color: "#6366f1", icon: "Building2", balance: 2100.5, initialBalance: 2000 },
  { id: "a4", name: "Tarjeta Visa", type: "credit_card", color: "#f59e0b", icon: "CreditCard", balance: -840.15, initialBalance: 0 },
  { id: "a5", name: "Tarjeta MasterCard", type: "credit_card", color: "#ef4444", icon: "CreditCard", balance: -320, initialBalance: 0 },
  { id: "a6", name: "Cuenta de Ahorros", type: "savings", color: "#8b5cf6", icon: "PiggyBank", balance: 15320, initialBalance: 12000 },
];

export const categories: Category[] = [
  // Expense
  { id: "c1", name: "Vivienda", type: "expense", color: "#6366f1", icon: "Home" },
  { id: "c2", name: "Comida", type: "expense", color: "#10b981", icon: "UtensilsCrossed" },
  { id: "c3", name: "Transporte", type: "expense", color: "#f59e0b", icon: "Car" },
  { id: "c4", name: "Salud", type: "expense", color: "#ef4444", icon: "HeartPulse" },
  { id: "c5", name: "Entretenimiento", type: "expense", color: "#a855f7", icon: "Popcorn" },
  { id: "c6", name: "Compras", type: "expense", color: "#ec4899", icon: "ShoppingBag" },
  { id: "c7", name: "Servicios", type: "expense", color: "#06b6d4", icon: "Plug" },
  { id: "c8", name: "Educación", type: "expense", color: "#0ea5e9", icon: "GraduationCap" },
  { id: "c9", name: "Viajes", type: "expense", color: "#14b8a6", icon: "Plane" },
  { id: "c10", name: "Mascotas", type: "expense", color: "#f97316", icon: "PawPrint" },
  { id: "c11", name: "Ropa", type: "expense", color: "#d946ef", icon: "Shirt" },
  { id: "c12", name: "Impuestos", type: "expense", color: "#64748b", icon: "Receipt" },
  { id: "c13", name: "Otros", type: "expense", color: "#94a3b8", icon: "MoreHorizontal" },
  // Income
  { id: "c14", name: "Salario", type: "income", color: "#10b981", icon: "Briefcase" },
  { id: "c15", name: "Freelance", type: "income", color: "#22c55e", icon: "Laptop" },
  { id: "c16", name: "Negocio", type: "income", color: "#059669", icon: "Store" },
  { id: "c17", name: "Bonificación", type: "income", color: "#84cc16", icon: "Gift" },
  { id: "c18", name: "Dividendos", type: "income", color: "#a3e635", icon: "TrendingUp" },
  { id: "c19", name: "Otros ingresos", type: "income", color: "#65a30d", icon: "PlusCircle" },
];

const descriptions: Record<string, string[]> = {
  c1: ["Alquiler mensual", "Mantenimiento edificio", "Reparación hogar"],
  c2: ["Supermercado", "Restaurante", "Cafetería", "Almuerzo trabajo", "Delivery"],
  c3: ["Gasolina", "Uber", "Transporte público", "Peaje", "Estacionamiento"],
  c4: ["Farmacia", "Consulta médica", "Seguro salud"],
  c5: ["Netflix", "Spotify", "Cine", "Concierto"],
  c6: ["Compras online", "Electrodoméstico", "Regalo"],
  c7: ["Internet", "Electricidad", "Agua", "Teléfono", "Gas"],
  c8: ["Curso online", "Libros", "Universidad"],
  c9: ["Vuelo", "Hotel", "Excursión"],
  c10: ["Comida mascota", "Veterinario"],
  c11: ["Ropa nueva", "Zapatos"],
  c12: ["Impuestos anuales", "IVA"],
  c13: ["Varios"],
  c14: ["Salario mensual"],
  c15: ["Proyecto freelance", "Consultoría"],
  c16: ["Ventas negocio"],
  c17: ["Bono trimestral"],
  c18: ["Dividendos acciones"],
  c19: ["Reembolso", "Regalo recibido"],
};

// Deterministic pseudo-random for stable mock output.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function generateTransactions(): Transaction[] {
  const rand = seeded(42);
  const list: Transaction[] = [];
  const today = new Date();
  const catIds = categories.map((c) => c.id);
  const paymentMethods: Transaction["paymentMethod"][] = ["cash", "debit_card", "credit_card", "transfer"];

  for (let i = 0; i < 100; i++) {
    const daysBack = Math.floor(rand() * 90);
    const date = new Date(today);
    date.setDate(today.getDate() - daysBack);

    const catId = catIds[Math.floor(rand() * catIds.length)];
    const cat = categories.find((c) => c.id === catId)!;
    const type = cat.type;
    const amount =
      type === "income"
        ? Math.round((500 + rand() * 3000) * 100) / 100
        : Math.round((5 + rand() * 400) * 100) / 100;

    const descs = descriptions[cat.id] ?? ["Movimiento"];
    const desc = descs[Math.floor(rand() * descs.length)];
    const account = accounts[Math.floor(rand() * accounts.length)];

    list.push({
      id: `t${i + 1}`,
      date: date.toISOString(),
      type,
      amount,
      categoryId: cat.id,
      accountId: account.id,
      paymentMethod: paymentMethods[Math.floor(rand() * paymentMethods.length)],
      description: desc,
      notes: rand() > 0.8 ? "Nota adicional del movimiento." : undefined,
      recurring: rand() > 0.85,
      status: "completed",
    });
  }
  return list.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const transactions: Transaction[] = generateTransactions();

const currentMonth = new Date().toISOString().slice(0, 7);
export const budgets: Budget[] = [
  { id: "b1", categoryId: "c1", monthlyLimit: 1200, spent: 1050, month: currentMonth },
  { id: "b2", categoryId: "c2", monthlyLimit: 600, spent: 540, month: currentMonth },
  { id: "b3", categoryId: "c3", monthlyLimit: 300, spent: 290, month: currentMonth },
  { id: "b4", categoryId: "c5", monthlyLimit: 200, spent: 130, month: currentMonth },
  { id: "b5", categoryId: "c7", monthlyLimit: 250, spent: 260, month: currentMonth },
];

export const savingsGoals: SavingsGoal[] = [
  { id: "g1", name: "Fondo de Emergencia", icon: "Shield", color: "#3b82f6", targetAmount: 10000, currentAmount: 6200, deadline: "2026-12-31", monthlyContribution: 400 },
  { id: "g2", name: "Vacaciones", icon: "Plane", color: "#14b8a6", targetAmount: 3500, currentAmount: 1800, deadline: "2026-07-15", monthlyContribution: 250 },
  { id: "g3", name: "Vehículo", icon: "Car", color: "#f59e0b", targetAmount: 15000, currentAmount: 4300, deadline: "2027-06-01", monthlyContribution: 600 },
  { id: "g4", name: "Laptop nueva", icon: "Laptop", color: "#8b5cf6", targetAmount: 2000, currentAmount: 1450, deadline: "2026-09-01", monthlyContribution: 200 },
  { id: "g5", name: "Inversiones", icon: "TrendingUp", color: "#10b981", targetAmount: 20000, currentAmount: 8900, deadline: "2028-01-01", monthlyContribution: 500 },
];

export const recurringTransactions: RecurringTransaction[] = [
  { id: "r1", type: "expense", amount: 1050, categoryId: "c1", accountId: "a2", description: "Alquiler", frequency: "monthly", nextExecution: "2026-08-01", active: true },
  { id: "r2", type: "expense", amount: 45, categoryId: "c5", accountId: "a4", description: "Netflix", frequency: "monthly", nextExecution: "2026-07-15", active: true },
  { id: "r3", type: "expense", amount: 12, categoryId: "c5", accountId: "a4", description: "Spotify", frequency: "monthly", nextExecution: "2026-07-10", active: true },
  { id: "r4", type: "expense", amount: 80, categoryId: "c7", accountId: "a2", description: "Internet", frequency: "monthly", nextExecution: "2026-07-05", active: true },
  { id: "r5", type: "expense", amount: 120, categoryId: "c7", accountId: "a2", description: "Electricidad", frequency: "monthly", nextExecution: "2026-07-20", active: true },
  { id: "r6", type: "income", amount: 3200, categoryId: "c14", accountId: "a2", description: "Salario", frequency: "monthly", nextExecution: "2026-07-30", active: true },
  { id: "r7", type: "expense", amount: 60, categoryId: "c7", accountId: "a2", description: "Teléfono", frequency: "monthly", nextExecution: "2026-07-12", active: true },
  { id: "r8", type: "expense", amount: 250, categoryId: "c4", accountId: "a2", description: "Seguro salud", frequency: "monthly", nextExecution: "2026-08-03", active: true },
  { id: "r9", type: "expense", amount: 30, categoryId: "c2", accountId: "a1", description: "Suscripción comida", frequency: "weekly", nextExecution: "2026-07-08", active: true },
  { id: "r10", type: "expense", amount: 200, categoryId: "c8", accountId: "a2", description: "Curso online", frequency: "quarterly", nextExecution: "2026-09-01", active: false },
];

export const insights: FinancialInsight[] = [
  { id: "i1", title: "Aumento en Restaurantes", message: "Este mes gastaste 32% más en restaurantes comparado con el mes anterior.", severity: "warning", icon: "UtensilsCrossed", createdAt: new Date().toISOString() },
  { id: "i2", title: "Ahorro en crecimiento", message: "Tu ahorro aumentó un 15% respecto al mes pasado. ¡Excelente!", severity: "success", icon: "TrendingUp", createdAt: new Date().toISOString() },
  { id: "i3", title: "Suscripciones", message: "Podrías ahorrar hasta $85 al mes revisando tus suscripciones activas.", severity: "info", icon: "Sparkles", createdAt: new Date().toISOString() },
  { id: "i4", title: "Presupuesto Transporte", message: "Tu presupuesto de transporte está al 97%. Modera los gastos esta semana.", severity: "danger", icon: "AlertTriangle", createdAt: new Date().toISOString() },
  { id: "i5", title: "Mejor mes financiero", message: "Este ha sido tu mejor mes: mayor ingreso y menor gasto discrecional.", severity: "success", icon: "Trophy", createdAt: new Date().toISOString() },
];

export const notifications: NotificationItem[] = [
  { id: "n1", title: "Presupuesto excedido", message: "Servicios superó el límite mensual.", read: false, createdAt: new Date().toISOString() },
  { id: "n2", title: "Meta actualizada", message: "Aportaste $250 a Vacaciones.", read: false, createdAt: new Date().toISOString() },
  { id: "n3", title: "Ingreso registrado", message: "Salario recibido en Banco Principal.", read: true, createdAt: new Date().toISOString() },
];
