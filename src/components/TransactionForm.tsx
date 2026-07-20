import { useEffect, useMemo, useState } from 'react'
import { Modal } from './Modal'
import { CurrencyInput } from './ui'
import { Icon } from './Icon'
import { useFinance, type TransactionInput } from '../context/FinanceContext'
import { parseCurrencyInput, todayISO } from '../lib/format'
import type { TransactionType, TransactionWithRelations } from '../lib/types'

interface Props {
  open: boolean
  onClose: () => void
  editing?: TransactionWithRelations | null
}

const TYPES: { value: TransactionType; label: string; icon: string; color: string }[] = [
  { value: 'expense', label: 'Despesa', icon: 'arrow-up-right', color: 'text-expense' },
  { value: 'income', label: 'Receita', icon: 'arrow-down-left', color: 'text-income' },
  { value: 'transfer', label: 'Transferência', icon: 'arrow-left-right', color: 'text-brand-500' },
]

export function TransactionForm({ open, onClose, editing }: Props) {
  const { accounts, categories, addTransaction, updateTransaction } = useFinance()
  const [type, setType] = useState<TransactionType>('expense')
  const [amountRaw, setAmountRaw] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayISO())
  const [accountId, setAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const activeAccounts = useMemo(() => accounts.filter((a) => !a.archived), [accounts])
  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  )

  useEffect(() => {
    if (!open) return
    setErr(null)
    if (editing) {
      setType(editing.type)
      setAmountRaw(String(editing.amount).replace('.', ','))
      setDescription(editing.description)
      setDate(editing.date)
      setAccountId(editing.account_id)
      setToAccountId(editing.transfer_account_id ?? '')
      setCategoryId(editing.category_id ?? '')
    } else {
      setType('expense')
      setAmountRaw('')
      setDescription('')
      setDate(todayISO())
      setAccountId(activeAccounts[0]?.account_id ?? '')
      setToAccountId(activeAccounts[1]?.account_id ?? '')
      setCategoryId('')
    }
  }, [open, editing, activeAccounts])

  // Garante uma categoria selecionada válida ao trocar de tipo
  useEffect(() => {
    if (type !== 'transfer' && filteredCategories.length && !filteredCategories.some((c) => c.id === categoryId)) {
      setCategoryId(filteredCategories[0].id)
    }
  }, [type, filteredCategories, categoryId])

  const handleSubmit = async () => {
    setErr(null)
    const amount = parseCurrencyInput(amountRaw)
    if (amount <= 0) return setErr('Informe um valor maior que zero.')
    if (!accountId) return setErr('Selecione uma conta.')
    if (type === 'transfer') {
      if (!toAccountId) return setErr('Selecione a conta de destino.')
      if (toAccountId === accountId) return setErr('As contas de origem e destino devem ser diferentes.')
    }

    const payload: TransactionInput = {
      type,
      amount,
      description: description.trim(),
      date,
      account_id: accountId,
      transfer_account_id: type === 'transfer' ? toAccountId : null,
      category_id: type === 'transfer' ? null : categoryId || null,
    }

    setSaving(true)
    try {
      if (editing) await updateTransaction(editing.id, payload)
      else await addTransaction(payload)
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const noAccounts = activeAccounts.length === 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar lançamento' : 'Novo lançamento'}
      footer={
        <button className="btn-primary w-full" onClick={handleSubmit} disabled={saving || noAccounts}>
          {saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Adicionar'}
        </button>
      }
    >
      {noAccounts ? (
        <p className="py-6 text-center text-sm text-slate-500">
          Você precisa criar uma conta antes de lançar transações.
        </p>
      ) : (
        <div className="space-y-4">
          {/* Seletor de tipo */}
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 text-xs font-semibold transition ${
                  type === t.value
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                    : 'border-transparent bg-slate-100 dark:bg-white/5'
                }`}
              >
                <Icon name={t.icon} size={20} className={type === t.value ? t.color : 'text-slate-400'} />
                {t.label}
              </button>
            ))}
          </div>

          <div>
            <label className="label">Valor</label>
            <CurrencyInput value={amountRaw} onValueChange={setAmountRaw} autoFocus />
          </div>

          <div>
            <label className="label">Descrição</label>
            <input
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'income' ? 'Ex.: Salário' : 'Ex.: Mercado'}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Data</label>
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="label">{type === 'transfer' ? 'De' : 'Conta'}</label>
              <select className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                {activeAccounts.map((a) => (
                  <option key={a.account_id} value={a.account_id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {type === 'transfer' ? (
            <div>
              <label className="label">Para</label>
              <select className="input" value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
                <option value="">Selecione…</option>
                {activeAccounts
                  .filter((a) => a.account_id !== accountId)
                  .map((a) => (
                    <option key={a.account_id} value={a.account_id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="label">Categoria</label>
              {filteredCategories.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhuma categoria de {type === 'income' ? 'receita' : 'despesa'}. Crie uma em "Categorias".
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {filteredCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className="chip"
                      style={{
                        backgroundColor: categoryId === c.id ? c.color : 'transparent',
                        color: categoryId === c.id ? '#fff' : c.color,
                        border: `1.5px solid ${c.color}`,
                      }}
                    >
                      <Icon name={c.icon} size={15} />
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {err && <p className="text-sm font-medium text-expense">{err}</p>}
        </div>
      )}
    </Modal>
  )
}
