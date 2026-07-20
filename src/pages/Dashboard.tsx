import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import { Icon } from '../components/Icon'
import { MonthSwitcher } from '../components/MonthSwitcher'
import { TransactionList } from '../components/TransactionList'
import { EmptyState, FullPageLoader } from '../components/ui'
import { useFinance } from '../context/FinanceContext'
import { useModals } from '../context/ModalsContext'
import { supabase } from '../lib/supabase'
import { addMonths, formatCurrency, monthEnd, monthStart } from '../lib/format'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function Dashboard() {
  const { loading, transactions, totalBalance, accounts, selectedMonth } = useFinance()
  const { openTransactionForm } = useModals()

  const { income, expense, byCategory } = useMemo(() => {
    let income = 0
    let expense = 0
    const cat = new Map<string, { name: string; color: string; value: number }>()
    for (const t of transactions) {
      const amount = Number(t.amount)
      if (t.type === 'income') income += amount
      else if (t.type === 'expense') {
        expense += amount
        const key = t.category?.id ?? 'sem'
        const prev = cat.get(key)
        cat.set(key, {
          name: t.category?.name ?? 'Sem categoria',
          color: t.category?.color ?? '#94a3b8',
          value: (prev?.value ?? 0) + amount,
        })
      }
    }
    const byCategory = Array.from(cat.values()).sort((a, b) => b.value - a.value)
    return { income, expense, byCategory }
  }, [transactions])

  const balanceMonth = income - expense

  if (loading) return <FullPageLoader />

  return (
    <div className="space-y-5">
      {/* Cartão de saldo total */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-card-lg">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/5" />
        <p className="text-sm font-medium text-white/70">Saldo total</p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight">{formatCurrency(totalBalance)}</p>
        <p className="mt-2 text-xs text-white/60">
          {accounts.filter((a) => !a.archived).length} conta(s) ativa(s)
        </p>
      </div>

      <MonthSwitcher />

      {/* Receitas / Despesas do mês */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-income/10 text-income">
            <Icon name="arrow-down-left" size={18} />
          </div>
          <p className="text-xs text-slate-400">Receitas</p>
          <p className="text-lg font-bold text-income">{formatCurrency(income)}</p>
        </div>
        <div className="card p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-expense/10 text-expense">
            <Icon name="arrow-up-right" size={18} />
          </div>
          <p className="text-xs text-slate-400">Despesas</p>
          <p className="text-lg font-bold text-expense">{formatCurrency(expense)}</p>
        </div>
      </div>

      <div className="card flex items-center justify-between p-4">
        <span className="text-sm font-medium text-slate-500">Resultado do mês</span>
        <span className={`text-lg font-bold ${balanceMonth >= 0 ? 'text-income' : 'text-expense'}`}>
          {balanceMonth >= 0 ? '+' : ''}
          {formatCurrency(balanceMonth)}
        </span>
      </div>

      {/* Gráfico de gastos por categoria */}
      {byCategory.length > 0 && (
        <div className="card p-5">
          <h3 className="mb-3 font-bold">Gastos por categoria</h3>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {byCategory.map((c) => (
                      <Cell key={c.name} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v)}
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-2">
              {byCategory.slice(0, 5).map((c) => (
                <div key={c.name} className="flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="font-semibold">{formatCurrency(c.value)}</span>
                  <span className="w-11 text-right text-xs text-slate-400">
                    {expense ? Math.round((c.value / expense) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Evolução dos últimos 6 meses */}
      <MonthlyEvolution referenceMonth={selectedMonth} />

      {/* Últimas transações */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-bold">Últimos lançamentos</h3>
          <Link to="/transacoes" className="text-sm font-semibold text-brand-600">
            Ver todos
          </Link>
        </div>
        {transactions.length === 0 ? (
          <EmptyState
            icon="receipt"
            title="Nenhum lançamento neste mês"
            description="Toque no + para registrar sua primeira receita ou despesa."
            action={
              <button className="btn-primary" onClick={() => openTransactionForm()}>
                <Icon name="plus" size={18} /> Novo lançamento
              </button>
            }
          />
        ) : (
          <TransactionList transactions={transactions.slice(0, 6)} />
        )}
      </div>
    </div>
  )
}

const tooltipStyle = {
  borderRadius: 12,
  border: 'none',
  boxShadow: '0 8px 24px -8px rgba(15,23,42,0.3)',
  fontSize: 13,
  background: '#1e293b',
  color: '#fff',
}

function MonthlyEvolution({ referenceMonth }: { referenceMonth: Date }) {
  const [data, setData] = useState<{ label: string; receitas: number; despesas: number }[]>([])

  useEffect(() => {
    let active = true
    const start = monthStart(addMonths(referenceMonth, -5))
    const end = monthEnd(referenceMonth)
    supabase
      .from('transactions')
      .select('type, amount, date')
      .gte('date', start)
      .lte('date', end)
      .then(({ data: rows }) => {
        if (!active) return
        const buckets = new Map<string, { receitas: number; despesas: number }>()
        for (let i = 5; i >= 0; i--) {
          const d = addMonths(referenceMonth, -i)
          buckets.set(monthStart(d), { receitas: 0, despesas: 0 })
        }
        for (const r of rows ?? []) {
          const key = monthStart(new Date((r.date as string) + 'T00:00:00'))
          const b = buckets.get(key)
          if (!b) continue
          if (r.type === 'income') b.receitas += Number(r.amount)
          else if (r.type === 'expense') b.despesas += Number(r.amount)
        }
        setData(
          Array.from(buckets.entries()).map(([k, v]) => ({
            label: format(new Date(k + 'T00:00:00'), 'MMM', { locale: ptBR }),
            ...v,
          })),
        )
      })
    return () => {
      active = false
    }
  }, [referenceMonth])

  const hasData = data.some((d) => d.receitas > 0 || d.despesas > 0)
  if (!hasData) return null

  return (
    <div className="card p-5">
      <h3 className="mb-3 font-bold">Evolução (6 meses)</h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2}>
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
            <Tooltip
              formatter={(v: number) => formatCurrency(v)}
              contentStyle={tooltipStyle}
              cursor={{ fill: 'rgba(148,163,184,0.1)' }}
            />
            <Bar dataKey="receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex justify-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-income" /> Receitas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-expense" /> Despesas
        </span>
      </div>
    </div>
  )
}
