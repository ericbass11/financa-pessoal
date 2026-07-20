import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const ITEMS = [
  { to: '/orcamentos', icon: 'pie-chart', title: 'Orçamentos', desc: 'Limites de gasto por categoria', color: '#6366f1' },
  { to: '/metas', icon: 'target', title: 'Metas de economia', desc: 'Objetivos e progresso', color: '#10b981' },
  { to: '/categorias', icon: 'tag', title: 'Categorias', desc: 'Organize seus lançamentos', color: '#f97316' },
]

export function More() {
  const { user, signOut } = useAuth()
  const { theme, toggle } = useTheme()

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold">Mais</h2>

      <div className="space-y-3">
        {ITEMS.map((item) => (
          <Link key={item.to} to={item.to} className="card flex items-center gap-3 p-4 transition hover:shadow-card-lg">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${item.color}1a`, color: item.color }}
            >
              <Icon name={item.icon} size={22} />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{item.title}</p>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </div>
            <Icon name="chevron-right" size={20} className="text-slate-300" />
          </Link>
        ))}
      </div>

      <div className="card divide-y divide-slate-100 dark:divide-white/5">
        <button onClick={toggle} className="flex w-full items-center gap-3 p-4 text-left">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300">
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={22} />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Tema {theme === 'dark' ? 'escuro' : 'claro'}</p>
            <p className="text-xs text-slate-400">Toque para alternar</p>
          </div>
        </button>
        <button onClick={() => signOut()} className="flex w-full items-center gap-3 p-4 text-left">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-expense/10 text-expense">
            <Icon name="log-out" size={22} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-expense">Sair da conta</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </button>
      </div>

      <p className="pt-2 text-center text-xs text-slate-400">Finança Pessoal · v1.0</p>
    </div>
  )
}
