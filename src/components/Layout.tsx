import { NavLink, Outlet } from 'react-router-dom'
import { Icon } from './Icon'
import { useModals } from '../context/ModalsContext'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useFinance } from '../context/FinanceContext'

const NAV = [
  { to: '/', label: 'Início', icon: 'home', end: true },
  { to: '/transacoes', label: 'Transações', icon: 'receipt', end: false },
  { to: '/contas', label: 'Contas', icon: 'wallet', end: false },
  { to: '/mais', label: 'Mais', icon: 'layout-grid', end: false },
]

export function Layout() {
  const { openTransactionForm } = useModals()
  const { theme, toggle } = useTheme()
  const { user, signOut } = useAuth()
  const { error } = useFinance()

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col">
      {/* Cabeçalho */}
      <header className="safe-top sticky top-0 z-30 border-b border-slate-100 bg-surface-muted/80 backdrop-blur-lg dark:border-white/5 dark:bg-surface-dark/80">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-glow">
              <Icon name="trending-up" size={20} />
            </div>
            <div>
              <h1 className="text-sm font-extrabold leading-none">Finança Pessoal</h1>
              <p className="text-[11px] text-slate-400">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggle} className="btn-ghost !p-2" aria-label="Alternar tema">
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
            </button>
            <button onClick={() => signOut()} className="btn-ghost !p-2" aria-label="Sair">
              <Icon name="log-out" size={20} />
            </button>
          </div>
        </div>
        {error && (
          <div className="bg-expense/10 px-4 py-2 text-center text-xs font-medium text-expense">
            {error}
          </div>
        )}
      </header>

      {/* Conteúdo */}
      <main className="flex-1 px-4 pb-28 pt-4">
        <Outlet />
      </main>

      {/* Navegação inferior */}
      <nav className="safe-bottom fixed bottom-0 left-1/2 z-30 w-full max-w-2xl -translate-x-1/2 border-t border-slate-100 bg-surface/90 backdrop-blur-lg dark:border-white/5 dark:bg-surface-dark-muted/90">
        <div className="relative grid grid-cols-5 items-center px-2 py-1.5">
          {NAV.slice(0, 2).map((item) => (
            <NavItem key={item.to} {...item} />
          ))}

          {/* Botão central de adicionar */}
          <div className="flex justify-center">
            <button
              onClick={() => openTransactionForm()}
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-glow transition active:scale-95 hover:bg-brand-700"
              aria-label="Adicionar lançamento"
            >
              <Icon name="plus" size={26} />
            </button>
          </div>

          {NAV.slice(2).map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>
      </nav>
    </div>
  )
}

function NavItem({ to, label, icon, end }: { to: string; label: string; icon: string; end: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition ${
          isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon name={icon} size={22} strokeWidth={isActive ? 2.4 : 2} />
          {label}
        </>
      )}
    </NavLink>
  )
}
