import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { Modal } from '../components/Modal'
import { ColorPicker, EmptyState, FullPageLoader } from '../components/ui'
import { PageHeader } from '../components/PageHeader'
import { useFinance, type CategoryInput } from '../context/FinanceContext'
import type { Category, CategoryType } from '../lib/types'

const ICON_OPTIONS = [
  'tag', 'utensils', 'car', 'home', 'gamepad-2', 'heart', 'book-open', 'shopping-bag',
  'receipt', 'briefcase', 'laptop', 'trending-up', 'banknote', 'piggy-bank', 'credit-card', 'target',
]

export function Categories() {
  const { loading, categories } = useFinance()
  const [tab, setTab] = useState<CategoryType>('expense')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const list = useMemo(() => categories.filter((c) => c.type === tab), [categories, tab])

  if (loading) return <FullPageLoader />

  return (
    <div className="space-y-4">
      <PageHeader title="Categorias" backTo="/mais" />

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              tab === t ? 'bg-surface text-brand-600 shadow-card dark:bg-surface-dark-muted' : 'text-slate-500'
            }`}
          >
            {t === 'expense' ? 'Despesas' : 'Receitas'}
          </button>
        ))}
      </div>

      <button
        className="btn-secondary w-full"
        onClick={() => {
          setEditing(null)
          setFormOpen(true)
        }}
      >
        <Icon name="plus" size={18} /> Nova categoria de {tab === 'expense' ? 'despesa' : 'receita'}
      </button>

      {list.length === 0 ? (
        <EmptyState icon="tag" title="Sem categorias" />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {list.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setEditing(c)
                setFormOpen(true)
              }}
              className="card flex items-center gap-3 p-4 text-left transition hover:shadow-card-lg"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${c.color}1a`, color: c.color }}
              >
                <Icon name={c.icon} size={20} />
              </div>
              <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
              <Icon name="pencil" size={14} className="text-slate-300" />
            </button>
          ))}
        </div>
      )}

      <CategoryForm open={formOpen} onClose={() => setFormOpen(false)} editing={editing} defaultType={tab} />
    </div>
  )
}

function CategoryForm({
  open,
  onClose,
  editing,
  defaultType,
}: {
  open: boolean
  onClose: () => void
  editing: Category | null
  defaultType: CategoryType
}) {
  const { addCategory, updateCategory, deleteCategory } = useFinance()
  const [name, setName] = useState('')
  const [type, setType] = useState<CategoryType>(defaultType)
  const [color, setColor] = useState('#64748b')
  const [icon, setIcon] = useState('tag')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setErr(null)
    if (editing) {
      setName(editing.name)
      setType(editing.type)
      setColor(editing.color)
      setIcon(editing.icon)
    } else {
      setName('')
      setType(defaultType)
      setColor('#64748b')
      setIcon('tag')
    }
  }, [open, editing, defaultType])

  const handleSubmit = async () => {
    if (!name.trim()) return setErr('Informe um nome.')
    const payload: CategoryInput = { name: name.trim(), type, color, icon }
    setSaving(true)
    try {
      if (editing) await updateCategory(editing.id, payload)
      else await addCategory(payload)
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editing) return
    if (confirm(`Excluir a categoria "${editing.name}"? Os lançamentos ficarão sem categoria.`)) {
      setSaving(true)
      try {
        await deleteCategory(editing.id)
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
      title={editing ? 'Editar categoria' : 'Nova categoria'}
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
        <div className="flex justify-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${color}1a`, color }}
          >
            <Icon name={icon} size={30} />
          </div>
        </div>
        <div>
          <label className="label">Nome</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Restaurante" autoFocus />
        </div>
        <div>
          <label className="label">Tipo</label>
          <div className="grid grid-cols-2 gap-2">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-xl border-2 py-2.5 text-sm font-medium transition ${
                  type === t ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-transparent bg-slate-100 dark:bg-white/5'
                }`}
              >
                {t === 'expense' ? 'Despesa' : 'Receita'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Ícone</label>
          <div className="flex flex-wrap gap-2">
            {ICON_OPTIONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 transition ${
                  icon === ic ? 'border-brand-500 text-brand-600' : 'border-transparent bg-slate-100 text-slate-500 dark:bg-white/5'
                }`}
              >
                <Icon name={ic} size={20} />
              </button>
            ))}
          </div>
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
