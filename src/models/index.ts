// Domain models for Control de Gastos Diarios
// Keep code in English; UI strings are in Spanish.

export type TransactionType = "income" | "expense";

export type TransactionStatus = "completed" | "pending" | "cancelled";

export type PaymentMethod =
  | "cash"
  | "debit_card"
  | "credit_card"
  | "transfer"
  | "other";

export type RecurrenceFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string; // hex
  icon: string; // lucide icon name
  parentId?: string | null;
}

export interface Account {
  id: string;
  name: string;
  type: "cash" | "bank" | "credit_card" | "savings";
  color: string;
  icon: string;
  balance: number;
  initialBalance: number;
}

export interface Transaction {
  id: string;
  date: string; // ISO date
  type: TransactionType;
  amount: number;
  categoryId: string;
  subcategoryId?: string | null;
  accountId: string;
  paymentMethod: PaymentMethod;
  description: string;
  notes?: string;
  recurring: boolean;
  attachmentUrl?: string | null;
  status: TransactionStatus;
}

export interface Budget {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  spent: number;
  month: string; // YYYY-MM
}

export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO date
  monthlyContribution: number;
}

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  description: string;
  frequency: RecurrenceFrequency;
  nextExecution: string; // ISO
  active: boolean;
}

export interface FinancialInsight {
  id: string;
  title: string;
  message: string;
  severity: "info" | "success" | "warning" | "danger";
  icon: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
