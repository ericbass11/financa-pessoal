import { useEffect, useState } from 'react'
import { Icon, accountIcon } from '../components/Icon'
import { Modal } from '../components/Modal'
import { ColorPicker, CurrencyInput, EmptyState, FullPageLoader } from '../components/ui'
import { useFinance, type AccountInput } from '../context/FinanceContext'
import { formatCurrency, parseCurrencyInput } from '../lib/format'
import { ACCOUNT_TYPE_LABELS, type AccountBalance, type AccountType } from '../lib/types'

export function Accounts() {
  const { loading, accounts, totalBalance, deleteAccount } = useFinance()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AccountBalance | null>(null)

  const openNew = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (a: AccountBalance) => {
    setEditing(a)
    setFormOpen(true)
  }

  const handleDelete = async (a: AccountBalance) => {
    if (
      confirm(
        `Excluir a conta "${a.name}"? Todos os lançamentos ligados a ela também serão removidos.`,
      )
    ) {
      await deleteAccount(a.account_id)
    }
  }

  if (loading) return <FullPageLoader />

  const active = accounts.filter((a) => !a.archived)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold">Contas</h2>
        <button className="btn-primary !py-2" onClick={openNew}>
          <Icon name="plus" size={18} /> Nova
        </button>
      </div>

      <div className="card bg-gradient-to-br from-slate-800 to-slate-900 p-5 text-white">
        <p className="text-sm text-white/60">Saldo consolidado</p>
        <p className="text-3xl font-extrabold">{formatCurrency(totalBalance)}</p>
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon="wallet"
          title="Nenhuma conta"
          description="Crie contas para organizar de onde entra e sai o dinheiro."
          action={
            <button className="btn-primary" onClick={openNew}>
              <Icon name="plus" size={18} /> Criar conta
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {active.map((a) => (
            <div key={a.account_id} className="card group flex items-center gap-3 p-4">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${a.color}1a`, color: a.color }}
              >
                <Icon name={accountIcon(a.type)} size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{a.name}</p>
                <p className="text-xs text-slate-400">{ACCOUNT_TYPE_LABELS[a.type]}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${Number(a.balance) < 0 ? 'text-expense' : ''}`}>
                  {formatCurrency(Number(a.balance))}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => openEdit(a)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-white/10"
                  aria-label="Editar"
                >
                  <Icon name="pencil" size={16} />
                </button>
                <button
                  onClick={() => handleDelete(a)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-expense/10 hover:text-expense"
                  aria-label="Excluir"
                >
                  <Icon name="trash-2" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AccountForm open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />
    </div>
  )
}

const ACCOUNT_TYPES = Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]

function AccountForm({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: AccountBalance | null
}) {
  const { addAccount, updateAccount } = useFinance()
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('checking')
  const [balanceRaw, setBalanceRaw] = useState('')
  const [color, setColor] = useState('#4f46e5')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setErr(null)
    if (editing) {
      setName(editing.name)
      setType(editing.type)
      setBalanceRaw(String(editing.initial_balance).replace('.', ','))
      setColor(editing.color)
    } else {
      setName('')
      setType('checking')
      setBalanceRaw('')
      setColor('#4f46e5')
    }
  }, [open, editing])

  const handleSubmit = async () => {
    if (!name.trim()) return setErr('Informe um nome.')
    const payload: AccountInput = {
      name: name.trim(),
      type,
      initial_balance: parseCurrencyInput(balanceRaw),
      color,
      icon: accountIcon(type),
    }
    setSaving(true)
    try {
      if (editing) await updateAccount(editing.account_id, payload)
      else await addAccount(payload)
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar conta' : 'Nova conta'}
      footer={
        <button className="btn-primary w-full" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Nome</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Nubank" autoFocus />
        </div>
        <div>
          <label className="label">Tipo</label>
          <div className="grid grid-cols-2 gap-2">
            {ACCOUNT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${
                  type === t
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                    : 'border-transparent bg-slate-100 dark:bg-white/5'
                }`}
              >
                <Icon name={accountIcon(t)} size={18} className="text-slate-500" />
                {ACCOUNT_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">{editing ? 'Saldo inicial' : 'Saldo atual'}</label>
          <CurrencyInput value={balanceRaw} onValueChange={setBalanceRaw} />
          <p className="mt-1 text-xs text-slate-400">
            O saldo é atualizado automaticamente conforme os lançamentos.
          </p>
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
