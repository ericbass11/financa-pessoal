import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { FinanceProvider } from './context/FinanceContext'
import { ModalsProvider } from './context/ModalsContext'
import { isSupabaseConfigured } from './lib/supabase'
import { Layout } from './components/Layout'
import { FullPageLoader } from './components/ui'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Transactions } from './pages/Transactions'
import { Accounts } from './pages/Accounts'
import { More } from './pages/More'
import { Categories } from './pages/Categories'
import { Budgets } from './pages/Budgets'
import { Goals } from './pages/Goals'
import { SetupNeeded } from './pages/SetupNeeded'

function ProtectedApp() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen">
        <FullPageLoader label="Iniciando…" />
      </div>
    )
  }

  if (!session) return <Login />

  return (
    <FinanceProvider>
      <ModalsProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="transacoes" element={<Transactions />} />
            <Route path="contas" element={<Accounts />} />
            <Route path="mais" element={<More />} />
            <Route path="orcamentos" element={<Budgets />} />
            <Route path="metas" element={<Goals />} />
            <Route path="categorias" element={<Categories />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ModalsProvider>
    </FinanceProvider>
  )
}

export default function App() {
  if (!isSupabaseConfigured) return <SetupNeeded />

  return (
    <BrowserRouter>
      <AuthProvider>
        <ProtectedApp />
      </AuthProvider>
    </BrowserRouter>
  )
}
