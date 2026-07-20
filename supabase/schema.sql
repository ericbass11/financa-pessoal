-- ============================================================
--  Finança Pessoal — Schema do banco de dados (Supabase / PostgreSQL)
-- ============================================================
--  Como usar:
--   1. Crie um projeto no https://supabase.com
--   2. Abra: SQL Editor > New query
--   3. Cole TODO este arquivo e clique em "Run"
--
--  Isso cria as tabelas, políticas de segurança (RLS) e um gatilho
--  que popula categorias e uma carteira padrão para cada novo usuário.
-- ============================================================

-- ---------- Extensões ----------
create extension if not exists "pgcrypto";

-- ============================================================
--  TABELA: contas (carteiras / bancos / cartões)
-- ============================================================
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'checking'
    check (type in ('checking', 'savings', 'cash', 'credit', 'investment')),
  initial_balance numeric(14, 2) not null default 0,
  color text not null default '#4f46e5',
  icon text not null default 'wallet',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
--  TABELA: categorias
-- ============================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null default '#64748b',
  icon text not null default 'tag',
  created_at timestamptz not null default now()
);

-- ============================================================
--  TABELA: transações (receitas, despesas e transferências)
-- ============================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  transfer_account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount numeric(14, 2) not null check (amount > 0),
  description text not null default '',
  date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);
create index if not exists transactions_account_idx on public.transactions (account_id);
create index if not exists transactions_category_idx on public.transactions (category_id);

-- ============================================================
--  TABELA: orçamentos (limite de gasto por categoria e mês)
-- ============================================================
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  month date not null, -- sempre o primeiro dia do mês (ex.: 2026-07-01)
  created_at timestamptz not null default now(),
  unique (user_id, category_id, month)
);

-- ============================================================
--  TABELA: metas de economia (objetivos)
-- ============================================================
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null check (target_amount > 0),
  current_amount numeric(14, 2) not null default 0,
  target_date date,
  color text not null default '#10b981',
  created_at timestamptz not null default now()
);

-- ============================================================
--  Manter updated_at atualizado nas transações
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_transactions_updated_at on public.transactions;
create trigger trg_transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- ============================================================
--  VIEW: saldo por conta (initial_balance + entradas - saídas +/- transferências)
--  security_invoker garante que a RLS do usuário seja respeitada.
-- ============================================================
create or replace view public.account_balances
with (security_invoker = on) as
select
  a.id as account_id,
  a.user_id,
  a.name,
  a.type,
  a.color,
  a.icon,
  a.archived,
  a.initial_balance
    + coalesce(sum(case when t.type = 'income' and t.account_id = a.id then t.amount else 0 end), 0)
    - coalesce(sum(case when t.type = 'expense' and t.account_id = a.id then t.amount else 0 end), 0)
    - coalesce(sum(case when t.type = 'transfer' and t.account_id = a.id then t.amount else 0 end), 0)
    + coalesce(sum(case when t.type = 'transfer' and t.transfer_account_id = a.id then t.amount else 0 end), 0)
    as balance
from public.accounts a
left join public.transactions t
  on t.account_id = a.id or t.transfer_account_id = a.id
group by a.id;

-- ============================================================
--  ROW LEVEL SECURITY
-- ============================================================
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;

-- Política única por tabela: o dono acessa apenas as próprias linhas.
do $$
declare
  tbl text;
begin
  foreach tbl in array array['accounts', 'categories', 'transactions', 'budgets', 'goals']
  loop
    execute format('drop policy if exists "own_select" on public.%I;', tbl);
    execute format('drop policy if exists "own_insert" on public.%I;', tbl);
    execute format('drop policy if exists "own_update" on public.%I;', tbl);
    execute format('drop policy if exists "own_delete" on public.%I;', tbl);

    execute format('create policy "own_select" on public.%I for select using (auth.uid() = user_id);', tbl);
    execute format('create policy "own_insert" on public.%I for insert with check (auth.uid() = user_id);', tbl);
    execute format('create policy "own_update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', tbl);
    execute format('create policy "own_delete" on public.%I for delete using (auth.uid() = user_id);', tbl);
  end loop;
end $$;

-- ============================================================
--  Popular dados iniciais para cada novo usuário
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Carteira padrão
  insert into public.accounts (user_id, name, type, icon, color)
  values (new.id, 'Carteira', 'cash', 'wallet', '#4f46e5');

  -- Categorias de despesa
  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Alimentação',    'expense', '#f97316', 'utensils'),
    (new.id, 'Transporte',     'expense', '#3b82f6', 'car'),
    (new.id, 'Moradia',        'expense', '#8b5cf6', 'home'),
    (new.id, 'Lazer',          'expense', '#ec4899', 'gamepad'),
    (new.id, 'Saúde',          'expense', '#ef4444', 'heart'),
    (new.id, 'Educação',       'expense', '#14b8a6', 'book'),
    (new.id, 'Compras',        'expense', '#eab308', 'bag'),
    (new.id, 'Contas & Assinaturas', 'expense', '#64748b', 'receipt'),
    (new.id, 'Outros',         'expense', '#94a3b8', 'tag');

  -- Categorias de receita
  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Salário',        'income', '#10b981', 'briefcase'),
    (new.id, 'Freelance',      'income', '#22c55e', 'laptop'),
    (new.id, 'Investimentos',  'income', '#0ea5e9', 'trending-up'),
    (new.id, 'Outros',         'income', '#84cc16', 'tag');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
--  Fim do schema
-- ============================================================
