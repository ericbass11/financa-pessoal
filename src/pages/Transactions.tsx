import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { MonthSwitcher } from '../components/MonthSwitcher'
import { TransactionList } from '../components/TransactionList'
import { EmptyState, FullPageLoader } from '../components/ui'
import { useFinance } from '../context/FinanceContext'
import { useModals } from '../context/ModalsContext'
import { formatCurrency } from '../lib/format'
import type { TransactionType } from '../lib/types'

const FILTERS: { value: 'all' | TransactionType; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'expense', label: 'Despesas' },
  { value: 'income', label: 'Receitas' },
  { value: 'transfer', label: 'Transferências' },
]

export function Transactions() {
  const { loading, transactions } = useFinance()
  const { openTransactionForm } = useModals()
  const [filter, setFilter] = useState<'all' | TransactionType>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return transactions.filter((t) => {
      if (filter !== 'all' && t.type !== filter) return false
      if (!q) return true
      return (
        t.description.toLowerCase().includes(q) ||
        (t.category?.name.toLowerCase().includes(q) ?? false) ||
        (t.account?.name.toLowerCase().includes(q) ?? false)
      )
    })
  }, [transactions, filter, query])

  const total = useMemo(
    () =>
      filtered.reduce((sum, t) => {
        if (t.type === 'income') return sum + Number(t.amount)
        if (t.type === 'expense') return sum - Number(t.amount)
        return sum
      }, 0),
    [filtered],
  )

  if (loading) return <FullPageLoader />

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold">Lançamentos</h2>
      <MonthSwitcher />

      <div className="relative">
        <Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input !pl-11"
          placeholder="Buscar por descrição, categoria…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`chip shrink-0 ${
              filter === f.value
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length > 0 && (
        <div className="card flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-slate-500">{filtered.length} lançamento(s)</span>
          <span className={`font-bold ${total >= 0 ? 'text-income' : 'text-expense'}`}>
            {total >= 0 ? '+' : ''}
            {formatCurrency(total)}
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon="receipt"
          title="Nada por aqui"
          description={query || filter !== 'all' ? 'Nenhum lançamento com esses filtros.' : 'Comece adicionando um lançamento.'}
          action={
            <button className="btn-primary" onClick={() => openTransactionForm()}>
              <Icon name="plus" size={18} /> Novo lançamento
            </button>
          }
        />
      ) : (
        <TransactionList transactions={filtered} />
      )}
    </div>
  )
}
