import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import { ColorPicker, CurrencyInput, EmptyState, FullPageLoader } from '../components/ui'
import { useFinance, type GoalInput } from '../context/FinanceContext'
import { formatCurrency, formatDate, parseCurrencyInput } from '../lib/format'
import type { Goal } from '../lib/types'

export function Goals() {
  const { loading, goals, deleteGoal } = useFinance()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)

  if (loading) return <FullPageLoader />

  return (
    <div className="space-y-4">
      <PageHeader title="Metas de economia" backTo="/mais" />

      <button
        className="btn-primary w-full"
        onClick={() => {
          setEditing(null)
          setOpen(true)
        }}
      >
        <Icon name="plus" size={18} /> Nova meta
      </button>

      {goals.length === 0 ? (
        <EmptyState
          icon="target"
          title="Nenhuma meta"
          description="Defina objetivos (viagem, reserva de emergência…) e acompanhe quanto já juntou."
        />
      ) : (
        <div className="space-y-3">
          {goals.map((g) => {
            const pct = g.target_amount ? Math.min((g.current_amount / g.target_amount) * 100, 100) : 0
            const done = g.current_amount >= g.target_amount
            return (
              <button
                key={g.id}
                onClick={() => {
                  setEditing(g)
                  setOpen(true)
                }}
                className="card w-full p-5 text-left transition hover:shadow-card-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${g.color}1a`, color: g.color }}
                  >
                    <Icon name={done ? 'check' : 'target'} size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{g.name}</p>
                    {g.target_date && (
                      <p className="text-xs text-slate-400">até {formatDate(g.target_date, 'dd/MM/yyyy')}</p>
                    )}
                  </div>
                  {done && (
                    <span className="chip bg-income/10 text-income">
                      <Icon name="check" size={14} /> Concluída
                    </span>
                  )}
                </div>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: g.color }} />
                </div>
                <div className="mt-1.5 flex justify-between text-sm">
                  <span className="font-semibold">{formatCurrency(g.current_amount)}</span>
                  <span className="text-slate-400">
                    {Math.round(pct)}% de {formatCurrency(g.target_amount)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <GoalForm open={open} onClose={() => setOpen(false)} editing={editing} onDelete={deleteGoal} />
    </div>
  )
}

function GoalForm({
  open,
  onClose,
  editing,
  onDelete,
}: {
  open: boolean
  onClose: () => void
  editing: Goal | null
  onDelete: (id: string) => Promise<void>
}) {
  const { addGoal, updateGoal } = useFinance()
  const [name, setName] = useState('')
  const [targetRaw, setTargetRaw] = useState('')
  const [currentRaw, setCurrentRaw] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [color, setColor] = useState('#10b981')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setErr(null)
    if (editing) {
      setName(editing.name)
      setTargetRaw(String(editing.target_amount).replace('.', ','))
      setCurrentRaw(String(editing.current_amount).replace('.', ','))
      setTargetDate(editing.target_date ?? '')
      setColor(editing.color)
    } else {
      setName('')
      setTargetRaw('')
      setCurrentRaw('')
      setTargetDate('')
      setColor('#10b981')
    }
  }, [open, editing])

  const handleSubmit = async () => {
    if (!name.trim()) return setErr('Informe um nome.')
    const target = parseCurrencyInput(targetRaw)
    if (target <= 0) return setErr('Informe um valor-alvo maior que zero.')
    const payload: GoalInput = {
      name: name.trim(),
      target_amount: target,
      current_amount: parseCurrencyInput(currentRaw),
      target_date: targetDate || null,
      color,
    }
    setSaving(true)
    try {
      if (editing) await updateGoal(editing.id, payload)
      else await addGoal(payload)
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editing) return
    if (confirm(`Excluir a meta "${editing.name}"?`)) {
      setSaving(true)
      try {
        await onDelete(editing.id)
        onClose()
      } finally {
        setSaving(false)
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar meta' : 'Nova meta'}
      footer={
        <div className="flex gap-2">
          {editing && (
            <button className="btn-secondary !text-expense" onClick={handleDelete} disabled={saving}>
              <Icon name="trash-2" size={18} />
            </button>
          )}
          <button className="btn-primary flex-1" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Nome da meta</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Reserva de emergência" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Valor-alvo</label>
            <CurrencyInput value={targetRaw} onValueChange={setTargetRaw} />
          </div>
          <div>
            <label className="label">Já juntei</label>
            <CurrencyInput value={currentRaw} onValueChange={setCurrentRaw} />
          </div>
        </div>
        <div>
          <label className="label">Data-alvo (opcional)</label>
          <input type="date" className="input" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </div>
        <div>
          <label className="label">Cor</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        {err && <p className="text-sm font-medium text-expense">{err}</p>}
      </div>
    </Modal>
  )
}
