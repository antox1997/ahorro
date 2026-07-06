import { supabase } from "@/lib/supabase";
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

// =====================================================================
// UTILITIES FOR MAPPING DATABASE (snake_case) TO FRONTEND (camelCase)
// =====================================================================

const mapAccount = (db: any): Account => ({
  id: db.id,
  name: db.name,
  type: db.type as Account["type"],
  color: db.color,
  icon: db.icon,
  balance: Number(db.balance),
  initialBalance: Number(db.initial_balance),
});

const mapCategory = (db: any): Category => ({
  id: db.id,
  name: db.name,
  type: db.type as Category["type"],
  color: db.color,
  icon: db.icon,
  parentId: db.parent_id,
});

const mapTransaction = (db: any): Transaction => ({
  id: db.id,
  date: db.date,
  type: db.type as Transaction["type"],
  amount: Number(db.amount),
  categoryId: db.category_id,
  accountId: db.account_id,
  paymentMethod: db.payment_method as Transaction["paymentMethod"],
  description: db.description,
  notes: db.notes,
  recurring: db.recurring,
  status: db.status as Transaction["status"],
});

const mapBudget = (db: any): Budget => ({
  id: db.id,
  categoryId: db.category_id,
  monthlyLimit: Number(db.monthly_limit),
  spent: Number(db.spent || 0), // spent can be calculated dynamically or fetched
  month: db.month,
});

const mapSavingsGoal = (db: any): SavingsGoal => ({
  id: db.id,
  name: db.name,
  icon: db.icon,
  color: db.color,
  targetAmount: Number(db.target_amount),
  currentAmount: Number(db.current_amount),
  deadline: db.deadline,
  monthlyContribution: Number(db.monthly_contribution),
});

const mapRecurring = (db: any): RecurringTransaction => ({
  id: db.id,
  type: db.type as RecurringTransaction["type"],
  amount: Number(db.amount),
  categoryId: db.category_id,
  accountId: db.account_id,
  description: db.description,
  frequency: db.frequency as RecurringTransaction["frequency"],
  nextExecution: db.next_execution,
  active: db.active,
});

const mapNotification = (db: any): NotificationItem => ({
  id: db.id,
  title: db.title,
  message: db.message,
  read: db.read,
  createdAt: db.created_at,
});

// =====================================================================
// API SERVICE IMPLEMENTATIONS (Supabase client integration)
// =====================================================================

// Helper to get authenticated user ID
const getUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");
  return user.id;
};

// --- ACCOUNTS ---
export const getAccounts = async (): Promise<Account[]> => {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapAccount);
};

export const createAccount = async (acc: Omit<Account, "id" | "balance">): Promise<Account> => {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("accounts")
    .insert({
      user_id: userId,
      name: acc.name,
      type: acc.type,
      color: acc.color,
      icon: acc.icon,
      initial_balance: acc.initialBalance,
      balance: acc.initialBalance, // balance equals initialBalance on start
    })
    .select()
    .single();
  if (error) throw error;
  return mapAccount(data);
};

export const deleteAccount = async (id: string): Promise<void> => {
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) throw error;
};

// --- CATEGORIES ---
export const getCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapCategory);
};

export const createCategory = async (cat: Omit<Category, "id">): Promise<Category> => {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: cat.name,
      type: cat.type,
      color: cat.color,
      icon: cat.icon,
      parent_id: cat.parentId,
    })
    .select()
    .single();
  if (error) throw error;
  return mapCategory(data);
};

export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
};

// --- TRANSACTIONS ---
export const getTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapTransaction);
};

export const createTransaction = async (tx: Omit<Transaction, "id" | "status">): Promise<Transaction> => {
  const userId = await getUserId();
  
  // 1. Insert transaction
  const { data: newTx, error: txError } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      date: tx.date || new Date().toISOString(),
      type: tx.type,
      amount: tx.amount,
      category_id: tx.categoryId,
      account_id: tx.accountId,
      payment_method: tx.paymentMethod,
      description: tx.description,
      notes: tx.notes,
      recurring: tx.recurring,
      status: "completed",
    })
    .select()
    .single();
  if (txError) throw txError;

  // 2. Dynamically update Account balance
  const balanceAdjustment = tx.type === "income" ? tx.amount : -tx.amount;
  const { error: balanceError } = await supabase.rpc("adjust_account_balance", {
    target_account_id: tx.accountId,
    amount_adjustment: balanceAdjustment,
  });

  // Fallback if RPC trigger adjust_account_balance is not set up
  if (balanceError) {
    console.warn("RPC adjustment failed, attempting direct balance patch:", balanceError.message);
    const { data: accountData } = await supabase
      .from("accounts")
      .select("balance")
      .eq("id", tx.accountId)
      .single();
    if (accountData) {
      const nextBalance = Number(accountData.balance) + balanceAdjustment;
      await supabase
        .from("accounts")
        .update({ balance: nextBalance })
        .eq("id", tx.accountId);
    }
  }

  return mapTransaction(newTx);
};

export const deleteTransaction = async (id: string): Promise<void> => {
  // 1. Fetch transaction details to revert balance
  const { data: tx, error: txError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();
  
  if (txError) throw txError;

  // 2. Delete transaction
  const { error: delError } = await supabase.from("transactions").delete().eq("id", id);
  if (delError) throw delError;

  // 3. Revert Account balance
  const balanceAdjustment = tx.type === "income" ? -Number(tx.amount) : Number(tx.amount);
  await supabase.rpc("adjust_account_balance", {
    target_account_id: tx.account_id,
    amount_adjustment: balanceAdjustment,
  }).catch((err) => {
    console.warn("Direct balance revert patch required:", err);
  });
};

// --- BUDGETS ---
export const getBudgets = async (): Promise<Budget[]> => {
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .order("month", { ascending: false });
  if (error) throw error;

  // We should fetch transactions of the category for the month to calculate "spent"
  const budgetsList = (data || []).map(mapBudget);
  
  // Calculate spent dynamically for each budget
  const txList = await getTransactions();
  const budgetsWithSpent = budgetsList.map((b) => {
    const spent = txList
      .filter((t) => {
        const matchesCat = t.categoryId === b.categoryId;
        const matchesMonth = t.date.slice(0, 7) === b.month;
        const isExpense = t.type === "expense";
        return matchesCat && matchesMonth && isExpense;
      })
      .reduce((s, t) => s + t.amount, 0);
    return { ...b, spent };
  });

  return budgetsWithSpent;
};

export const createBudget = async (b: Omit<Budget, "id" | "spent">): Promise<Budget> => {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("budgets")
    .insert({
      user_id: userId,
      category_id: b.categoryId,
      monthly_limit: b.monthlyLimit,
      month: b.month,
    })
    .select()
    .single();
  if (error) throw error;
  return mapBudget(data);
};

export const deleteBudget = async (id: string): Promise<void> => {
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw error;
};

// --- SAVINGS GOALS ---
export const getSavingsGoals = async (): Promise<SavingsGoal[]> => {
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapSavingsGoal);
};

export const createSavingsGoal = async (g: Omit<SavingsGoal, "id" | "currentAmount">): Promise<SavingsGoal> => {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("savings_goals")
    .insert({
      user_id: userId,
      name: g.name,
      icon: g.icon,
      color: g.color,
      target_amount: g.targetAmount,
      current_amount: 0, // starts at 0
      deadline: g.deadline,
      monthly_contribution: g.monthlyContribution,
    })
    .select()
    .single();
  if (error) throw error;
  return mapSavingsGoal(data);
};

export const updateSavingsGoalAmount = async (id: string, currentAmount: number): Promise<SavingsGoal> => {
  const { data, error } = await supabase
    .from("savings_goals")
    .update({ current_amount: currentAmount })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapSavingsGoal(data);
};

export const deleteSavingsGoal = async (id: string): Promise<void> => {
  const { error } = await supabase.from("savings_goals").delete().eq("id", id);
  if (error) throw error;
};

// --- RECURRING TRANSACTIONS ---
export const getRecurring = async (): Promise<RecurringTransaction[]> => {
  const { data, error } = await supabase
    .from("recurring_transactions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRecurring);
};

export const createRecurring = async (
  recurring: Omit<RecurringTransaction, "id">
): Promise<RecurringTransaction> => {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("recurring_transactions")
    .insert({
      user_id: userId,
      type: recurring.type,
      amount: recurring.amount,
      category_id: recurring.categoryId,
      account_id: recurring.accountId,
      description: recurring.description,
      frequency: recurring.frequency,
      next_execution: recurring.nextExecution,
      active: recurring.active,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRecurring(data);
};

export const updateRecurringStatus = async (id: string, active: boolean): Promise<void> => {
  const { error } = await supabase
    .from("recurring_transactions")
    .update({ active })
    .eq("id", id);
  if (error) throw error;
};

export const deleteRecurring = async (id: string): Promise<void> => {
  const { error } = await supabase.from("recurring_transactions").delete().eq("id", id);
  if (error) throw error;
};

// --- NOTIFICATIONS ---
export const getNotifications = async (): Promise<NotificationItem[]> => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapNotification);
};

// --- FINANCIAL INSIGHTS ---
export const getInsights = async (): Promise<FinancialInsight[]> => {
  // We can calculate dynamic insights from the database details
  // Or fetch them from mock/generated values for the dashboard
  const tx = await getTransactions();
  const baseInsights: FinancialInsight[] = [];
  
  if (tx.length === 0) {
    return [
      {
        id: "i-welcome",
        title: "Comienza a registrar",
        message: "Agrega tu primer ingreso o gasto para recibir análisis financieros detallados.",
        severity: "info",
        icon: "Sparkles",
        createdAt: new Date().toISOString(),
      }
    ];
  }

  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7);
  const currentMonthTx = tx.filter((t) => t.date.slice(0, 7) === currentMonthStr);
  const expense = currentMonthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const income = currentMonthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);

  if (expense > income && income > 0) {
    baseInsights.push({
      id: "i-deficit",
      title: "Presupuesto en déficit",
      message: "Tus gastos superan tus ingresos este mes. Te recomendamos recortar gastos discrecionales.",
      severity: "danger",
      icon: "AlertTriangle",
      createdAt: new Date().toISOString(),
    });
  }

  if (income > 0 && expense / income < 0.5) {
    baseInsights.push({
      id: "i-savings",
      title: "Excelente tasa de ahorro",
      message: "Has ahorrado más del 50% de tus ingresos en lo que va del mes. ¡Vas por muy buen camino!",
      severity: "success",
      icon: "TrendingUp",
      createdAt: new Date().toISOString(),
    });
  } else if (income > 0 && expense / income > 0.8) {
    baseInsights.push({
      id: "i-warning",
      title: "Gasto elevado",
      message: "Has gastado más del 80% de tus ingresos mensuales. Intenta limitar las compras no esenciales.",
      severity: "warning",
      icon: "TrendingUp",
      createdAt: new Date().toISOString(),
    });
  }

  // Fallbacks if no dynamic insight was triggered
  if (baseInsights.length === 0) {
    baseInsights.push({
      id: "i-info",
      title: "Monitoreo activo",
      message: "Tus finanzas se ven estables este mes. Continúa registrando tus movimientos.",
      severity: "info",
      icon: "Sparkles",
      createdAt: new Date().toISOString(),
    });
  }

  return baseInsights;
};
