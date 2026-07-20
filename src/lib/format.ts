import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value ?? 0)
}

/** Formata sem o símbolo (ex.: "1.234,56") — útil para inputs. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0)
}

/** Converte texto digitado (ex.: "1.234,56" ou "1234.56") em número. */
export function parseCurrencyInput(input: string): number {
  if (!input) return 0
  const cleaned = input
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '') // remove separador de milhar
    .replace(',', '.')
  const value = parseFloat(cleaned)
  return Number.isFinite(value) ? value : 0
}

export function formatDate(date: string | Date, pattern = "dd 'de' MMM"): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: ptBR })
}

export function formatMonthLabel(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  const label = format(d, 'MMMM yyyy', { locale: ptBR })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Retorna a data de hoje no formato yyyy-MM-dd (sem fuso horário). */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/** Primeiro dia do mês de uma data, no formato yyyy-MM-dd. */
export function monthStart(date: Date): string {
  return format(new Date(date.getFullYear(), date.getMonth(), 1), 'yyyy-MM-dd')
}

/** Último dia do mês de uma data, no formato yyyy-MM-dd. */
export function monthEnd(date: Date): string {
  return format(new Date(date.getFullYear(), date.getMonth() + 1, 0), 'yyyy-MM-dd')
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}
