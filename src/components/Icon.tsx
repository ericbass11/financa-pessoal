import type { SVGProps } from 'react'

// Conjunto de ícones em linha (estilo traço, 24x24, herda currentColor).
// Evita dependência externa e mantém o bundle enxuto.
const PATHS: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5',
  receipt: 'M5 3v18l2-1.2 2 1.2 2-1.2 2 1.2 2-1.2 2 1.2V3l-2 1.2L14 3l-2 1.2L10 3 8 4.2 6 3 5 3ZM8 8h8M8 12h8M8 16h5',
  wallet: 'M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7ZM3 9h14M16 13h2',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  'layout-grid': 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z',
  'pie-chart': 'M12 3v9l7.5 5A9 9 0 1 1 12 3ZM12 3a9 9 0 0 1 9 9h-9',
  tag: 'M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9ZM7.5 7.5h.01',
  settings:
    'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM19 12a7 7 0 0 0-.1-1.1l2-1.6-2-3.4-2.4 1a7 7 0 0 0-1.9-1.1l-.4-2.6h-4l-.4 2.6a7 7 0 0 0-1.9 1.1l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .7.1 1.1l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 1.9 1.1l.4 2.6h4l.4-2.6a7 7 0 0 0 1.9-1.1l2.4 1 2-3.4-2-1.6c.1-.4.1-.7.1-1.1Z',
  sun: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  'log-out': 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3',
  'chevron-left': 'M15 18l-6-6 6-6',
  'chevron-right': 'M9 18l6-6-6-6',
  'chevron-down': 'M6 9l6 6 6-6',
  'trash-2': 'M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6',
  pencil: 'M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3ZM13.5 6.5l3 3',
  x: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12l5 5L20 7',
  'arrow-down-left': 'M17 7L7 17M7 7v10h10',
  'arrow-up-right': 'M7 17L17 7M7 7h10v10',
  'arrow-left-right': 'M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4',
  'piggy-bank':
    'M4 12a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v4a2 2 0 0 1-2 2h-1v-2h-3v2H8v-2a6 6 0 0 1-4-4ZM2 11h2M15 9h.01',
  'credit-card': 'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6ZM3 10h18M7 15h4',
  landmark: 'M3 21h18M4 10h16M12 3l8 5H4l8-5ZM6 10v8M10 10v8M14 10v8M18 10v8',
  banknote: 'M2 7a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM6 9h.01M18 15h.01',
  'trending-up': 'M3 17l6-6 4 4 8-8M15 7h6v6',
  utensils: 'M4 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M6 12v9M17 3c-1.5 0-3 1.5-3 5s1.5 4 3 4v9',
  car: 'M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13M5 13h14v4a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-4ZM7.5 15.5h.01M16.5 15.5h.01',
  'gamepad-2': 'M6 9v3M4.5 10.5h3M15 10h.01M17.5 12h.01M8 7h8a5 5 0 0 1 5 5 3 3 0 0 1-5.5 1.7L14 12H10l-.5 1.7A3 3 0 0 1 4 12a5 5 0 0 1 5-5Z',
  heart: 'M12 20s-7-4.6-9-9a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c-2 4.4-9 9-9 9Z',
  'book-open': 'M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13c-3-.5-6 0-8 1.5ZM12 6v13',
  'shopping-bag': 'M6 8h12l-1 12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 8ZM9 8V6a3 3 0 0 1 6 0v2',
  briefcase: 'M4 8h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1ZM9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18',
  laptop: 'M5 6a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v9H5V6ZM3 19h18l-1-4H4l-1 4Z',
  calendar: 'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM4 10h16M8 3v4M16 3v4',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM20 20l-4-4',
  wallet2: 'M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z',
}

interface IconProps extends SVGProps<SVGSVGElement> {
  name: string
  size?: number
}

export function Icon({ name, size = 24, ...props }: IconProps) {
  const d = PATHS[name] ?? PATHS.tag
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {d.split('M').filter(Boolean).map((seg, i) => (
        <path key={i} d={'M' + seg} />
      ))}
    </svg>
  )
}

/** Ícone associado ao tipo de conta. */
export function accountIcon(type: string): string {
  switch (type) {
    case 'cash':
      return 'banknote'
    case 'credit':
      return 'credit-card'
    case 'savings':
      return 'piggy-bank'
    case 'investment':
      return 'trending-up'
    default:
      return 'landmark'
  }
}
