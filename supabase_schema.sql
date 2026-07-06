-- =====================================================================
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS - CONTROL DE GASTOS DIARIOS
-- Copia y pega este script en el SQL Editor de tu proyecto de Supabase
-- =====================================================================

-- 1. Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- 2. Limpieza de tablas previas (en orden de dependencias)
drop table if exists public.notifications cascade;
drop table if exists public.recurring_transactions cascade;
drop table if exists public.savings_goals cascade;
drop table if exists public.budgets cascade;
drop table if exists public.transactions cascade;
drop table if exists public.categories cascade;
drop table if exists public.accounts cascade;
drop table if exists public.profiles cascade;

-- 3. Crear Tabla de Perfiles de Usuario
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en profiles
alter table public.profiles enable row level security;

create policy "Permitir lectura del propio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Permitir actualización del propio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- 4. Crear Tabla de Cuentas Financieras
create table public.accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text not null check (type in ('cash', 'bank', 'credit_card', 'savings')),
  color text not null, -- hex code
  icon text not null, -- lucide icon name
  balance numeric(12, 2) not null default 0.00,
  initial_balance numeric(12, 2) not null default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en accounts
alter table public.accounts enable row level security;

create policy "Usuarios pueden ver sus propias cuentas"
  on public.accounts for select
  using (auth.uid() = user_id);

create policy "Usuarios pueden crear sus propias cuentas"
  on public.accounts for insert
  with check (auth.uid() = user_id);

create policy "Usuarios pueden actualizar sus propias cuentas"
  on public.accounts for update
  using (auth.uid() = user_id);

create policy "Usuarios pueden eliminar sus propias cuentas"
  on public.accounts for delete
  using (auth.uid() = user_id);


-- 5. Crear Tabla de Categorías de Gastos/Ingresos
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade, -- NULL indica categoría del sistema/global
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null,
  icon text not null,
  parent_id uuid references public.categories on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en categories
alter table public.categories enable row level security;

create policy "Usuarios pueden ver categorías del sistema y las suyas"
  on public.categories for select
  using (user_id is null or auth.uid() = user_id);

create policy "Usuarios pueden crear sus propias categorías"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Usuarios pueden actualizar sus propias categorías"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Usuarios pueden eliminar sus propias categorías"
  on public.categories for delete
  using (auth.uid() = user_id);


-- 6. Crear Tabla de Transacciones
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date timestamp with time zone not null default now(),
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount >= 0),
  category_id uuid references public.categories on delete set null,
  account_id uuid references public.accounts on delete cascade not null,
  payment_method text not null check (payment_method in ('cash', 'debit_card', 'credit_card', 'transfer', 'other')),
  description text not null,
  notes text,
  recurring boolean not null default false,
  status text not null default 'completed' check (status in ('completed', 'pending', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en transactions
alter table public.transactions enable row level security;

create policy "Usuarios pueden ver sus propias transacciones"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Usuarios pueden crear sus propias transacciones"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Usuarios pueden actualizar sus propias transacciones"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Usuarios pueden eliminar sus propias transacciones"
  on public.transactions for delete
  using (auth.uid() = user_id);


-- 7. Crear Tabla de Presupuestos Mensuales
create table public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  category_id uuid references public.categories on delete cascade not null,
  monthly_limit numeric(12, 2) not null check (monthly_limit >= 0),
  month text not null, -- Formato: YYYY-MM
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, category_id, month)
);

-- Habilitar RLS en budgets
alter table public.budgets enable row level security;

create policy "Usuarios pueden ver sus propios presupuestos"
  on public.budgets for select
  using (auth.uid() = user_id);

create policy "Usuarios pueden crear sus propios presupuestos"
  on public.budgets for insert
  with check (auth.uid() = user_id);

create policy "Usuarios pueden actualizar sus propios presupuestos"
  on public.budgets for update
  using (auth.uid() = user_id);

create policy "Usuarios pueden eliminar sus propios presupuestos"
  on public.budgets for delete
  using (auth.uid() = user_id);


-- 8. Crear Tabla de Metas de Ahorro
create table public.savings_goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  icon text not null,
  color text not null,
  target_amount numeric(12, 2) not null check (target_amount >= 0),
  current_amount numeric(12, 2) not null default 0.00 check (current_amount >= 0),
  deadline date not null,
  monthly_contribution numeric(12, 2) not null default 0.00 check (monthly_contribution >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en savings_goals
alter table public.savings_goals enable row level security;

create policy "Usuarios pueden ver sus propias metas"
  on public.savings_goals for select
  using (auth.uid() = user_id);

create policy "Usuarios pueden crear sus propias metas"
  on public.savings_goals for insert
  with check (auth.uid() = user_id);

create policy "Usuarios pueden actualizar sus propias metas"
  on public.savings_goals for update
  using (auth.uid() = user_id);

create policy "Usuarios pueden eliminar sus propias metas"
  on public.savings_goals for delete
  using (auth.uid() = user_id);


-- 9. Crear Tabla de Transacciones Recurrentes
create table public.recurring_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount >= 0),
  category_id uuid references public.categories on delete set null,
  account_id uuid references public.accounts on delete cascade not null,
  description text not null,
  frequency text not null check (frequency in ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  next_execution date not null,
  active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en recurring_transactions
alter table public.recurring_transactions enable row level security;

create policy "Usuarios pueden ver sus propios recurrentes"
  on public.recurring_transactions for select
  using (auth.uid() = user_id);

create policy "Usuarios pueden crear sus propios recurrentes"
  on public.recurring_transactions for insert
  with check (auth.uid() = user_id);

create policy "Usuarios pueden actualizar sus propios recurrentes"
  on public.recurring_transactions for update
  using (auth.uid() = user_id);

create policy "Usuarios pueden eliminar sus propios recurrentes"
  on public.recurring_transactions for delete
  using (auth.uid() = user_id);


-- 10. Crear Tabla de Notificaciones
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en notifications
alter table public.notifications enable row level security;

create policy "Usuarios pueden ver sus propias notificaciones"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Usuarios pueden actualizar sus propias notificaciones"
  on public.notifications for update
  using (auth.uid() = user_id);


-- =====================================================================
-- TRIGGERS Y AUTOMATIZACIONES PARA NUEVOS USUARIOS
-- =====================================================================

-- Crear perfil cuando se registra un usuario
create or replace function public.handle_new_user_profile()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();


-- Poblar cuentas y categorías por defecto al registrarse
create or replace function public.handle_new_user_setup()
returns trigger as $$
begin
  -- 1. Cuentas por defecto
  insert into public.accounts (user_id, name, type, color, icon, balance, initial_balance)
  values 
    (new.id, 'Efectivo', 'cash', '#10b981', 'Wallet', 1250.00, 1000.00),
    (new.id, 'Banco Principal', 'bank', '#3b82f6', 'Landmark', 8450.32, 8000.00),
    (new.id, 'Banco Secundario', 'bank', '#6366f1', 'Building2', 2100.50, 2000.00),
    (new.id, 'Tarjeta Visa', 'credit_card', '#f59e0b', 'CreditCard', -840.15, 0.00),
    (new.id, 'Tarjeta MasterCard', 'credit_card', '#ef4444', 'CreditCard', -320.00, 0.00),
    (new.id, 'Cuenta de Ahorros', 'savings', '#8b5cf6', 'PiggyBank', 15320.00, 12000.00);

  -- 2. Categorías por defecto
  insert into public.categories (user_id, name, type, color, icon)
  values
    -- Gastos
    (new.id, 'Vivienda', 'expense', '#6366f1', 'Home'),
    (new.id, 'Comida', 'expense', '#10b981', 'UtensilsCrossed'),
    (new.id, 'Transporte', 'expense', '#f59e0b', 'Car'),
    (new.id, 'Salud', 'expense', '#ef4444', 'HeartPulse'),
    (new.id, 'Entretenimiento', 'expense', '#a855f7', 'Popcorn'),
    (new.id, 'Compras', 'expense', '#ec4899', 'ShoppingBag'),
    (new.id, 'Servicios', 'expense', '#06b6d4', 'Plug'),
    (new.id, 'Educación', 'expense', '#0ea5e9', 'GraduationCap'),
    (new.id, 'Viajes', 'expense', '#14b8a6', 'Plane'),
    (new.id, 'Mascotas', 'expense', '#f97316', 'PawPrint'),
    (new.id, 'Ropa', 'expense', '#d946ef', 'Shirt'),
    (new.id, 'Impuestos', 'expense', '#64748b', 'Receipt'),
    (new.id, 'Otros', 'expense', '#94a3b8', 'MoreHorizontal'),
    -- Ingresos
    (new.id, 'Salario', 'income', '#10b981', 'Briefcase'),
    (new.id, 'Freelance', 'income', '#22c55e', 'Laptop'),
    (new.id, 'Negocio', 'income', '#059669', 'Store'),
    (new.id, 'Bonificación', 'income', '#84cc16', 'Gift'),
    (new.id, 'Dividendos', 'income', '#a3e635', 'TrendingUp'),
    (new.id, 'Otros ingresos', 'income', '#65a30d', 'PlusCircle');

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created_setup
  after insert on auth.users
  for each row execute procedure public.handle_new_user_setup();

-- 11. RPC para actualizar balances de cuenta desde transacciones
create or replace function public.adjust_account_balance(target_account_id uuid, amount_adjustment numeric)
returns void as $$
begin
  update public.accounts
  set balance = balance + amount_adjustment
  where id = target_account_id;
end;
$$ language plpgsql security definer;
