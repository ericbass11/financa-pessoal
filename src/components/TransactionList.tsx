import { useMemo } from 'react'
import { Icon } from './Icon'
import { useModals } from '../context/ModalsContext'
import { useFinance } from '../context/FinanceContext'
import { formatCurrency, formatDate } from '../lib/format'
import type { TransactionWithRelations } from '../lib/types'

function groupByDate(transactions: TransactionWithRelations[]) {
  const groups = new Map<string, TransactionWithRelations[]>()
  for (const t of transactions) {
    const list = groups.get(t.date) ?? []
    list.push(t)
    groups.set(t.date, list)
  }
  return Array.from(groups.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
}

export function TransactionList({ transactions }: { transactions: TransactionWithRelations[] }) {
  const groups = useMemo(() => groupByDate(transactions), [transactions])

  return (
    <div className="space-y-5">
      {groups.map(([date, items]) => {
        const dayTotal = items.reduce((sum, t) => {
          if (t.type === 'income') return sum + Number(t.amount)
          if (t.type === 'expense') return sum - Number(t.amount)
          return sum
        }, 0)
        return (
          <div key={date}>
            <div className="mb-1.5 flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {formatDate(date, "EEEE, dd 'de' MMMM")}
              </span>
              {dayTotal !== 0 && (
                <span className={`text-xs font-semibold ${dayTotal > 0 ? 'text-income' : 'text-expense'}`}>
                  {dayTotal > 0 ? '+' : ''}
                  {formatCurrency(dayTotal)}
                </span>
              )}
            </div>
            <div className="card divide-y divide-slate-100 overflow-hidden dark:divide-white/5">
              {items.map((t) => (
                <TransactionRow key={t.id} tx={t} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TransactionRow({ tx }: { tx: TransactionWithRelations }) {
  const { openTransactionForm } = useModals()
  const { deleteTransaction } = useFinance()

  const isIncome = tx.type === 'income'
  const isTransfer = tx.type === 'transfer'
  const color = tx.category?.color ?? (isTransfer ? '#6366f1' : isIncome ? '#10b981' : '#ef4444')
  const icon = isTransfer ? 'arrow-left-right' : tx.category?.icon ?? (isIncome ? 'arrow-down-left' : 'arrow-up-right')
  const title = tx.description || tx.category?.name || (isTransfer ? 'Transferência' : isIncome ? 'Receita' : 'Despesa')
  const subtitle = isTransfer
    ? 'Transferência'
    : [tx.category?.name, tx.account?.name].filter(Boolean).join(' · ')

  const amountText = `${isIncome ? '+' : isTransfer ? '' : '−'} ${formatCurrency(Number(tx.amount))}`

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Excluir este lançamento?')) await deleteTransaction(tx.id)
  }

  return (
    <div
      onClick={() => openTransactionForm(tx)}
      className="group flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-white/5"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}1a`, color }}
      >
        <Icon name={icon} size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{title}</p>
        <p className="truncate text-xs text-slate-400">{subtitle || '—'}</p>
      </div>
      <div className="text-right">
        <p className={`font-bold ${isIncome ? 'text-income' : isTransfer ? 'text-slate-500' : 'text-expense'}`}>
          {amountText}
        </p>
      </div>
      <button
        onClick={handleDelete}
        className="ml-1 hidden shrink-0 rounded-lg p-2 text-slate-400 hover:bg-expense/10 hover:text-expense group-hover:block"
        aria-label="Excluir"
      >
        <Icon name="trash-2" size={16} />
      </button>
    </div>
  )
}
