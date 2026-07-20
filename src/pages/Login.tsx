import { useState, type FormEvent } from 'react'
import { Icon } from '../components/Icon'
import { Spinner } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password)
        if (error) setError(error)
      } else {
        const { error, needsConfirmation } = await signUp(email, password)
        if (error) setError(error)
        else if (needsConfirmation)
          setInfo('Conta criada! Confirme o e-mail que enviamos e depois faça login.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-600 to-brand-800 px-5 py-10">
      <div className="mb-8 flex flex-col items-center text-center text-white">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
          <Icon name="trending-up" size={34} />
        </div>
        <h1 className="text-2xl font-extrabold">Finança Pessoal</h1>
        <p className="mt-1 text-sm text-white/70">Controle simples e bonito das suas finanças.</p>
      </div>

      <div className="card w-full max-w-sm p-6">
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-white/5">
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m)
                setError(null)
                setInfo(null)
              }}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                mode === m ? 'bg-surface text-brand-600 shadow-card dark:bg-surface-dark-muted' : 'text-slate-500'
              }`}
            >
              {m === 'signin' ? 'Entrar' : 'Criar conta'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">E-mail</label>
            <input
              type="email"
              autoComplete="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
            />
          </div>
          <div>
            <label className="label">Senha</label>
            <input
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm font-medium text-expense">{error}</p>}
          {info && <p className="text-sm font-medium text-income">{info}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? <Spinner size={20} /> : mode === 'signin' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>

      <p className="mt-6 max-w-xs text-center text-xs text-white/60">
        Seus dados ficam protegidos no Supabase e isolados por usuário.
      </p>
    </div>
  )
}
