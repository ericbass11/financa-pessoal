import { Icon } from './Icon'
import { useFinance } from '../context/FinanceContext'
import { addMonths, formatMonthLabel } from '../lib/format'

export function MonthSwitcher() {
  const { selectedMonth, setSelectedMonth } = useFinance()
  const isCurrent =
    selectedMonth.getMonth() === new Date().getMonth() &&
    selectedMonth.getFullYear() === new Date().getFullYear()

  return (
    <div className="flex items-center justify-between gap-2">
      <button
        className="btn-ghost !p-2"
        onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
        aria-label="Mês anterior"
      >
        <Icon name="chevron-left" size={20} />
      </button>
      <button
        className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-white/5"
        onClick={() => setSelectedMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
      >
        <Icon name="calendar" size={16} className="text-slate-400" />
        {formatMonthLabel(selectedMonth)}
        {!isCurrent && <span className="text-[10px] font-bold text-brand-500">• hoje</span>}
      </button>
      <button
        className="btn-ghost !p-2"
        onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
        aria-label="Próximo mês"
      >
        <Icon name="chevron-right" size={20} />
      </button>
    </div>
  )
}
