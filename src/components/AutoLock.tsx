import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Icon } from './Icon'
import { Spinner } from './ui'

const IDLE_MS = 5 * 60 * 1000 // bloqueia após 5 minutos de inatividade
const LAST_ACTIVITY_KEY = 'financa:lastActivity'
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']

/**
 * Envolve o app autenticado e o bloqueia após 5 minutos de inatividade,
 * exigindo a senha novamente. O estado sobrevive a recarregamentos: se a
 * última atividade foi há mais de 5 min, o app já abre bloqueado.
 */
export function AutoLock({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [locked, setLocked] = useState(false)
  const lockedRef = useRef(false)
  lockedRef.current = locked

  const touch = useCallback(() => {
    if (lockedRef.current) return
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
  }, [])

  // Ao montar (ou logar): bloqueia se já passou o tempo desde a última atividade.
  useEffect(() => {
    if (!user) return
    const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0)
    if (last && Date.now() - last > IDLE_MS) setLocked(true)
    else touch()
  }, [user, touch])

  // Escuta atividade (throttled) e verifica inatividade periodicamente.
  useEffect(() => {
    if (!user) return
    let lastWrite = 0
    const onActivity = () => {
      const now = Date.now()
      if (now - lastWrite > 5000) {
        lastWrite = now
        touch()
      }
    }
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))

    const check = () => {
      if (lockedRef.current) return
      const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0)
      if (last && Date.now() - last > IDLE_MS) setLocked(true)
    }
    const interval = window.setInterval(check, 15000)
    const onVisible = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity))
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [user, touch])

  const unlock = useCallback(() => {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
    setLocked(false)
  }, [])

  return (
    <>
      {children}
      {locked && user && <LockScreen email={user.email ?? ''} onUnlock={unlock} />}
    </>
  )
}

function LockScreen({ email, onUnlock }: { email: string; onUnlock: () => void }) {
  const { signOut } = useAuth()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      setError('Senha incorreta. Tente novamente.')
      return
    }
    setPassword('')
    onUnlock()
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-brand-600 to-brand-800 px-5">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
        <Icon name="landmark" size={30} />
      </div>
      <h1 className="text-xl font-extrabold text-white">App bloqueado</h1>
      <p className="mt-1 mb-6 max-w-xs text-center text-sm text-white/70">
        Por segurança, o app foi bloqueado após 5 minutos de inatividade. Informe sua senha para continuar.
      </p>

      <form onSubmit={handleSubmit} className="card w-full max-w-sm p-6">
        <p className="mb-4 truncate text-center text-sm font-medium text-slate-500">{email}</p>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          className="input text-center"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="mt-3 text-center text-sm font-medium text-expense">{error}</p>}
        <button type="submit" className="btn-primary mt-4 w-full" disabled={loading || !password}>
          {loading ? <Spinner size={20} /> : 'Desbloquear'}
        </button>
        <button
          type="button"
          onClick={() => signOut()}
          className="btn-ghost mt-1 w-full text-sm"
        >
          Sair da conta
        </button>
      </form>
    </div>
  )
}
