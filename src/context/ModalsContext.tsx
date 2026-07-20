import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { TransactionForm } from '../components/TransactionForm'
import type { TransactionWithRelations } from '../lib/types'

interface ModalsContextValue {
  openTransactionForm: (editing?: TransactionWithRelations | null) => void
}

const ModalsContext = createContext<ModalsContextValue | undefined>(undefined)

export function ModalsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TransactionWithRelations | null>(null)

  const openTransactionForm = useCallback((tx?: TransactionWithRelations | null) => {
    setEditing(tx ?? null)
    setOpen(true)
  }, [])

  return (
    <ModalsContext.Provider value={{ openTransactionForm }}>
      {children}
      <TransactionForm open={open} onClose={() => setOpen(false)} editing={editing} />
    </ModalsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useModals(): ModalsContextValue {
  const ctx = useContext(ModalsContext)
  if (!ctx) throw new Error('useModals deve ser usado dentro de <ModalsProvider>')
  return ctx
}
