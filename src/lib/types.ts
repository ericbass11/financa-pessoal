export type AccountType = 'checking' | 'savings' | 'cash' | 'credit' | 'investment'
export type CategoryType = 'income' | 'expense'
export type TransactionType = 'income' | 'expense' | 'transfer'

export interface Account {
  id: string
  user_id: string
  name: string
  type: AccountType
  initial_balance: number
  color: string
  icon: string
  archived: boolean
  created_at: string
}

export interface AccountBalance {
  account_id: string
  user_id: string
  name: string
  type: AccountType
  color: string
  icon: string
  archived: boolean
  initial_balance: number
  balance: number
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: CategoryType
  color: string
  icon: string
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  account_id: string
  transfer_account_id: string | null
  category_id: string | null
  type: TransactionType
  amount: number
  description: string
  date: string
  created_at: string
  updated_at: string
}

export interface TransactionWithRelations extends Transaction {
  category: Category | null
  account: Pick<Account, 'id' | 'name' | 'color' | 'icon'> | null
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  amount: number
  month: string
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string | null
  color: string
  created_at: string
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Conta corrente',
  savings: 'Poupança',
  cash: 'Dinheiro',
  credit: 'Cartão de crédito',
  investment: 'Investimento',
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  income: 'Receita',
  expense: 'Despesa',
  transfer: 'Transferência',
}
