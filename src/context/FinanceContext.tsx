import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { monthEnd, monthStart } from '../lib/format'
import type {
  Account,
  AccountBalance,
  Budget,
  Category,
  Goal,
  TransactionWithRelations,
} from '../lib/types'

interface FinanceContextValue {
  loading: boolean
  error: string | null
  selectedMonth: Date
  setSelectedMonth: (d: Date) => void

  accounts: AccountBalance[]
  categories: Category[]
  transactions: TransactionWithRelations[]
  budgets: Budget[]
  goals: Goal[]

  totalBalance: number

  refresh: () => Promise<void>

  addTransaction: (t: TransactionInput) => Promise<void>
  updateTransaction: (id: string, t: TransactionInput) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>

  addAccount: (a: AccountInput) => Promise<void>
  updateAccount: (id: string, a: AccountInput) => Promise<void>
  deleteAccount: (id: string) => Promise<void>

  addCategory: (c: CategoryInput) => Promise<void>
  updateCategory: (id: string, c: CategoryInput) => Promise<void>
  deleteCategory: (id: string) => Promise<void>

  upsertBudget: (categoryId: string, amount: number) => Promise<void>
  deleteBudget: (id: string) => Promise<void>

  addGoal: (g: GoalInput) => Promise<void>
  updateGoal: (id: string, g: Partial<GoalInput> & { current_amount?: number }) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
}

export interface TransactionInput {
  type: 'income' | 'expense' | 'transfer'
  amount: number
  description: string
  date: string
  account_id: string
  transfer_account_id?: string | null
  category_id?: string | null
}

export interface AccountInput {
  name: string
  type: Account['type']
  initial_balance: number
  color: string
  icon: string
}

export interface CategoryInput {
  name: string
  type: Category['type']
  color: string
  icon: string
}

export interface GoalInput {
  name: string
  target_amount: number
  current_amount: number
  target_date: string | null
  color: string
}

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined)

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const [accounts, setAccounts] = useState<AccountBalance[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const userId = user?.id

  const loadStatic = useCallback(async () => {
    if (!userId) return
    const [accRes, catRes, goalRes] = await Promise.all([
      supabase.from('account_balances').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
      supabase.from('goals').select('*').order('created_at'),
    ])
    if (accRes.error) throw accRes.error
    if (catRes.error) throw catRes.error
    if (goalRes.error) throw goalRes.error
    setAccounts((accRes.data as AccountBalance[]) ?? [])
    setCategories((catRes.data as Category[]) ?? [])
    setGoals((goalRes.data as Goal[]) ?? [])
  }, [userId])

  const loadMonthly = useCallback(async () => {
    if (!userId) return
    const start = monthStart(selectedMonth)
    const end = monthEnd(selectedMonth)
    const [txRes, budgetRes] = await Promise.all([
      supabase
        .from('transactions')
        // "!account_id" desambigua o embed: transactions tem duas FKs para
        // accounts (account_id e transfer_account_id), então é preciso indicar
        // qual relação usar, senão o PostgREST recusa a query.
        .select('*, category:categories(*), account:accounts!account_id(id,name,color,icon)')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('budgets').select('*').eq('month', start),
    ])
    if (txRes.error) throw txRes.error
    if (budgetRes.error) throw budgetRes.error
    setTransactions((txRes.data as unknown as TransactionWithRelations[]) ?? [])
    setBudgets((budgetRes.data as Budget[]) ?? [])
  }, [userId, selectedMonth])

  // Trata erros de carregamento. Se for falha de autenticação (token/JWT
  // expirado → 401), desloga para o usuário reautenticar em vez de ficar
  // preso numa sessão quebrada.
  const handleLoadError = useCallback((e: unknown) => {
    const err = e as { code?: string; message?: string } | null
    const msg = err?.message || 'Erro ao carregar dados.'
    const isAuthError =
      err?.code === 'PGRST301' ||
      err?.code === '401' ||
      /jwt|unauthorized|token|expired|não autenticado/i.test(msg)
    if (isAuthError) {
      void supabase.auth.signOut()
      return
    }
    setError(msg)
  }, [])

  const refresh = useCallback(async () => {
    if (!userId) return
    setError(null)
    try {
      await Promise.all([loadStatic(), loadMonthly()])
    } catch (e) {
      handleLoadError(e)
    }
  }, [userId, loadStatic, loadMonthly, handleLoadError])

  useEffect(() => {
    if (!userId) {
      setAccounts([])
      setCategories([])
      setTransactions([])
      setBudgets([])
      setGoals([])
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    ;(async () => {
      try {
        await Promise.all([loadStatic(), loadMonthly()])
      } catch (e) {
        if (active) handleLoadError(e)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [userId, loadStatic, loadMonthly, handleLoadError])

  const requireUser = (): string => {
    if (!userId) throw new Error('Usuário não autenticado.')
    return userId
  }

  const wrap = async (fn: () => Promise<void>) => {
    setError(null)
    try {
      await fn()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ocorreu um erro.'
      setError(msg)
      throw new Error(msg)
    }
  }

  const addTransaction: FinanceContextValue['addTransaction'] = (t) =>
    wrap(async () => {
      const uid = requireUser()
      const { error: e } = await supabase.from('transactions').insert({
        user_id: uid,
        type: t.type,
        amount: t.amount,
        description: t.description,
        date: t.date,
        account_id: t.account_id,
        transfer_account_id: t.type === 'transfer' ? t.transfer_account_id ?? null : null,
        category_id: t.type === 'transfer' ? null : t.category_id ?? null,
      })
      if (e) throw e
      await refresh()
    })

  const updateTransaction: FinanceContextValue['updateTransaction'] = (id, t) =>
    wrap(async () => {
      const { error: e } = await supabase
        .from('transactions')
        .update({
          type: t.type,
          amount: t.amount,
          description: t.description,
          date: t.date,
          account_id: t.account_id,
          transfer_account_id: t.type === 'transfer' ? t.transfer_account_id ?? null : null,
          category_id: t.type === 'transfer' ? null : t.category_id ?? null,
        })
        .eq('id', id)
      if (e) throw e
      await refresh()
    })

  const deleteTransaction: FinanceContextValue['deleteTransaction'] = (id) =>
    wrap(async () => {
      const { error: e } = await supabase.from('transactions').delete().eq('id', id)
      if (e) throw e
      await refresh()
    })

  const addAccount: FinanceContextValue['addAccount'] = (a) =>
    wrap(async () => {
      const uid = requireUser()
      const { error: e } = await supabase.from('accounts').insert({ user_id: uid, ...a })
      if (e) throw e
      await refresh()
    })

  const updateAccount: FinanceContextValue['updateAccount'] = (id, a) =>
    wrap(async () => {
      const { error: e } = await supabase.from('accounts').update(a).eq('id', id)
      if (e) throw e
      await refresh()
    })

  const deleteAccount: FinanceContextValue['deleteAccount'] = (id) =>
    wrap(async () => {
      const { error: e } = await supabase.from('accounts').delete().eq('id', id)
      if (e) throw e
      await refresh()
    })

  const addCategory: FinanceContextValue['addCategory'] = (c) =>
    wrap(async () => {
      const uid = requireUser()
      const { error: e } = await supabase.from('categories').insert({ user_id: uid, ...c })
      if (e) throw e
      await refresh()
    })

  const updateCategory: FinanceContextValue['updateCategory'] = (id, c) =>
    wrap(async () => {
      const { error: e } = await supabase.from('categories').update(c).eq('id', id)
      if (e) throw e
      await refresh()
    })

  const deleteCategory: FinanceContextValue['deleteCategory'] = (id) =>
    wrap(async () => {
      const { error: e } = await supabase.from('categories').delete().eq('id', id)
      if (e) throw e
      await refresh()
    })

  const upsertBudget: FinanceContextValue['upsertBudget'] = (categoryId, amount) =>
    wrap(async () => {
      const uid = requireUser()
      const month = monthStart(selectedMonth)
      const { error: e } = await supabase
        .from('budgets')
        .upsert(
          { user_id: uid, category_id: categoryId, amount, month },
          { onConflict: 'user_id,category_id,month' },
        )
      if (e) throw e
      await loadMonthly()
    })

  const deleteBudget: FinanceContextValue['deleteBudget'] = (id) =>
    wrap(async () => {
      const { error: e } = await supabase.from('budgets').delete().eq('id', id)
      if (e) throw e
      await loadMonthly()
    })

  const addGoal: FinanceContextValue['addGoal'] = (g) =>
    wrap(async () => {
      const uid = requireUser()
      const { error: e } = await supabase.from('goals').insert({ user_id: uid, ...g })
      if (e) throw e
      await loadStatic()
    })

  const updateGoal: FinanceContextValue['updateGoal'] = (id, g) =>
    wrap(async () => {
      const { error: e } = await supabase.from('goals').update(g).eq('id', id)
      if (e) throw e
      await loadStatic()
    })

  const deleteGoal: FinanceContextValue['deleteGoal'] = (id) =>
    wrap(async () => {
      const { error: e } = await supabase.from('goals').delete().eq('id', id)
      if (e) throw e
      await loadStatic()
    })

  const totalBalance = useMemo(
    () => accounts.filter((a) => !a.archived).reduce((sum, a) => sum + Number(a.balance), 0),
    [accounts],
  )

  const value: FinanceContextValue = {
    loading,
    error,
    selectedMonth,
    setSelectedMonth,
    accounts,
    categories,
    transactions,
    budgets,
    goals,
    totalBalance,
    refresh,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    upsertBudget,
    deleteBudget,
    addGoal,
    updateGoal,
    deleteGoal,
  }

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance deve ser usado dentro de <FinanceProvider>')
  return ctx
}
