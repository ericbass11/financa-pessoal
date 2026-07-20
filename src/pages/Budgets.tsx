import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { Modal } from '../components/Modal'
import { MonthSwitcher } from '../components/MonthSwitcher'
import { PageHeader } from '../components/PageHeader'
import { CurrencyInput, EmptyState, FullPageLoader } from '../components/ui'
import { useFinance } from '../context/FinanceContext'
import { formatCurrency, parseCurrencyInput } from '../lib/format'
import type { Category } from '../lib/types'

export function Budgets() {
  const { loading, categories, budgets, transactions, upsertBudget, deleteBudget } = useFinance()
  const [editing, setEditing] = useState<Category | null>(null)
  const [open, setOpen] = useState(false)

  // gasto por categoria no mês selecionado
  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of transactions) {
      if (t.type !== 'expense' || !t.category_id) continue
      map.set(t.category_id, (map.get(t.category_id) ?? 0) + Number(t.amount))
    }
    return map
  }, [transactions])

  const expenseCategories = useMemo(() => categories.filter((c) => c.type === 'expense'), [categories])

  const budgetRows = useMemo(() => {
    return budgets
      .map((b) => {
        const cat = expenseCategories.find((c) => c.id === b.category_id)
        if (!cat) return null
        const spent = spentByCategory.get(b.category_id) ?? 0
        return { budget: b, category: cat, spent }
      })
      .filter(Boolean) as { budget: (typeof budgets)[number]; category: Category; spent: number }[]
  }, [budgets, expenseCategories, spentByCategory])

  const totalBudget = budgetRows.reduce((s, r) => s + Number(r.budget.amount), 0)
  const totalSpent = budgetRows.reduce((s, r) => s + r.spent, 0)

  const withoutBudget = expenseCategories.filter((c) => !budgets.some((b) => b.category_id === c.id))

  if (loading) return <FullPageLoader />

  return (
    <div className="space-y-4">
      <PageHeader title="Orçamentos" backTo="/mais" />
      <MonthSwitcher />

      {budgetRows.length > 0 && (
        <div className="card p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-400">Gasto do orçamento</p>
              <p className="text-2xl font-extrabold">{formatCurrency(totalSpent)}</p>
            </div>
            <p className="text-sm text-slate-400">de {formatCurrency(totalBudget)}</p>
          </div>
          <ProgressBar value={totalSpent} max={totalBudget} />
        </div>
      )}

      {budgetRows.length === 0 ? (
        <EmptyState
          icon="pie-chart"
          title="Nenhum orçamento definido"
          description="Defina um limite de gasto mensal para suas categorias e acompanhe o progresso."
        />
      ) : (
        <div className="space-y-3">
          {budgetRows.map(({ budget, category, spent }) => {
            const pct = budget.amount ? (spent / Number(budget.amount)) * 100 : 0
            const over = spent > Number(budget.amount)
            return (
              <div key={budget.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${category.color}1a`, color: category.color }}
                  >
                    <Icon name={category.icon} size={18} />
                  </div>
                  <span className="flex-1 font-semibold">{category.name}</span>
                  <button
                    onClick={() => {
                      setEditing(category)
                      setOpen(true)
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-brand-600"
                    aria-label="Editar orçamento"
                  >
                    <Icon name="pencil" size={15} />
                  </button>
                  <button
                    onClick={() => deleteBudget(budget.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-expense"
                    aria-label="Remover orçamento"
                  >
                    <Icon name="trash-2" size={15} />
                  </button>
                </div>
                <ProgressBar value={spent} max={Number(budget.amount)} color={category.color} />
                <div className="mt-1 flex justify-between text-xs">
                  <span className={over ? 'font-semibold text-expense' : 'text-slate-500'}>
                    {formatCurrency(spent)} {over ? '· ultrapassou!' : ''}
                  </span>
                  <span className="text-slate-400">
                    {Math.round(pct)}% de {formatCurrency(Number(budget.amount))}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {withoutBudget.length > 0 && (
        <div>
          <p className="mb-2 px-1 text-sm font-semibold text-slate-500">Adicionar orçamento</p>
          <div className="flex flex-wrap gap-2">
            {withoutBudget.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setEditing(c)
                  setOpen(true)
                }}
                className="chip bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300"
              >
                <Icon name={c.icon} size={15} style={{ color: c.color }} />
                {c.name}
                <Icon name="plus" size={14} />
              </button>
            ))}
          </div>
        </div>
      )}

      <BudgetForm
        open={open}
        onClose={() => setOpen(false)}
        category={editing}
        current={budgets.find((b) => b.category_id === editing?.id)?.amount ?? null}
        onSave={upsertBudget}
      />
    </div>
  )
}

function ProgressBar({ value, max, color = '#4f46e5' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const over = value > max && max > 0
  return (
    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: over ? '#ef4444' : color }}
      />
    </div>
  )
}

function BudgetForm({
  open,
  onClose,
  category,
  current,
  onSave,
}: {
  open: boolean
  onClose: () => void
  category: Category | null
  current: number | null
  onSave: (categoryId: string, amount: number) => Promise<void>
}) {
  const [raw, setRaw] = useState('')
  const [saving, setSaving] = useState(false)

  // sincroniza o valor inicial quando abre
  useEffect(() => {
    if (open) setRaw(current ? String(current).replace('.', ',') : '')
  }, [open, current])

  const handleSubmit = async () => {
    if (!category) return
    const amount = parseCurrencyInput(raw)
    if (amount <= 0) return
    setSaving(true)
    try {
      await onSave(category.id, amount)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Orçamento · ${category?.name ?? ''}`}
      footer={
        <button className="btn-primary w-full" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar orçamento'}
        </button>
      }
    >
      <div className="space-y-2">
        <label className="label">Limite de gasto mensal</label>
        <CurrencyInput value={raw} onValueChange={setRaw} autoFocus />
        <p className="text-xs text-slate-400">
          Você será avisado no dashboard quando os gastos desta categoria se aproximarem do limite.
        </p>
      </div>
    </Modal>
  )
}
