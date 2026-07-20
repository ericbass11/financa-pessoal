import { useEffect, type ReactNode } from 'react'
import { Icon } from './Icon'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg animate-slide-up sm:animate-fade-in">
        <div className="card mx-auto max-h-[90vh] overflow-hidden rounded-b-none sm:rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/5">
            <h2 className="text-lg font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="btn-ghost -mr-2 !p-2"
              aria-label="Fechar"
            >
              <Icon name="x" size={20} />
            </button>
          </div>
          <div className="max-h-[calc(90vh-8rem)] overflow-y-auto px-5 py-5">{children}</div>
          {footer && (
            <div className="safe-bottom border-t border-slate-100 px-5 py-4 dark:border-white/5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
