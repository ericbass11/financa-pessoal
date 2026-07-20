import { Icon } from '../components/Icon'

export function SetupNeeded() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-600 to-brand-800 px-5 py-10">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10">
          <Icon name="settings" size={26} />
        </div>
        <h1 className="text-xl font-extrabold">Configuração necessária</h1>
        <p className="mt-2 text-sm text-slate-500">
          As credenciais do Supabase ainda não foram configuradas. Para o app funcionar:
        </p>
        <ol className="mt-4 space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">1</span>
            <span>
              Crie um projeto em <strong>supabase.com</strong> e rode o SQL de{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-white/10">supabase/schema.sql</code>.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">2</span>
            <span>
              Copie <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-white/10">.env.example</code> para{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-white/10">.env</code> e preencha a URL e a chave{' '}
              <strong>anon</strong>.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">3</span>
            <span>Reinicie o servidor com <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-white/10">npm run dev</code>.</span>
          </li>
        </ol>
        <p className="mt-4 text-xs text-slate-400">
          Passo a passo completo no <strong>README.md</strong> do projeto.
        </p>
      </div>
    </div>
  )
}
