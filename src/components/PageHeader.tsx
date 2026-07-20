import { useNavigate } from 'react-router-dom'
import { Icon } from './Icon'

export function PageHeader({ title, backTo }: { title: string; backTo?: string }) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
        className="btn-ghost -ml-2 !p-2"
        aria-label="Voltar"
      >
        <Icon name="chevron-left" size={22} />
      </button>
      <h2 className="text-xl font-extrabold">{title}</h2>
    </div>
  )
}
