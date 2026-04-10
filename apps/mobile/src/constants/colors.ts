export const Colors = {
  // ── BRAND ──
  emerald: {
    300: '#4DFFC4',
    400: '#00E5AA',
    500: '#00C896',  // ← Primary CTA
    600: '#00A878',
    700: '#007A58',
    dim: 'rgba(0, 200, 150, 0.13)',
    glow: 'rgba(0, 200, 150, 0.30)',
    border: 'rgba(0, 200, 150, 0.30)',
  },

  gold: {
    400: '#F9D96A',
    500: '#F5C842',  // ← Secondary / Warning
    600: '#D4A820',
    700: '#A87A00',
    dim: 'rgba(245, 200, 66, 0.13)',
    glow: 'rgba(245, 200, 66, 0.35)',
    border: 'rgba(245, 200, 66, 0.30)',
  },

  // ── NAVY (Background Scale) ──
  navy: {
    900: '#030B17',
    800: '#060F1E',  // ← App Background
    700: '#0B1F3A',  // ← Screen BG
    600: '#112952',  // ← Header
    500: '#162D50',  // ← Card
    400: '#1A3A6B',
    300: '#2A4E8A',
    200: '#3D6BAD',
  },

  // ── SEMANTIC ──
  error: {
    400: '#FF85A0',
    500: '#FF5C7A',  // ← Expense / Error
    600: '#E03058',
    dim: 'rgba(255, 92, 122, 0.13)',
    border: 'rgba(255, 92, 122, 0.30)',
  },

  success: {
    400: '#00E5AA',
    500: '#00C896',  // ← Income / Success
    600: '#00A878',
    dim: 'rgba(0, 200, 150, 0.13)',
  },

  warning: {
    500: '#F5C842',
    dim: 'rgba(245, 200, 66, 0.13)',
  },

  info: {
    400: '#6BB8F0',
    500: '#4A9EDB',  // ← Info / Scanner
    600: '#2980C0',
    dim: 'rgba(74, 158, 219, 0.13)',
    border: 'rgba(74, 158, 219, 0.30)',
  },

  purple: {
    400: '#C4B0FF',
    500: '#A78BFA',  // ← Feature / AI
    600: '#8B6EF0',
    dim: 'rgba(167, 139, 250, 0.13)',
    border: 'rgba(167, 139, 250, 0.30)',
  },

  orange: {
    400: '#FDBA74',
    500: '#FB923C',  // ← FAB
    dim: 'rgba(251, 146, 60, 0.13)',
  },

  // ── TEXT ──
  text: {
    primary: 'rgba(255, 255, 255, 0.95)',
    secondary: 'rgba(255, 255, 255, 0.70)',
    muted: 'rgba(255, 255, 255, 0.55)',
    disabled: 'rgba(255, 255, 255, 0.28)',
    placeholder: 'rgba(255, 255, 255, 0.28)',
  },

  // ── BORDER ──
  border: {
    default: 'rgba(255, 255, 255, 0.08)',
    subtle: 'rgba(255, 255, 255, 0.05)',
    emerald: 'rgba(0, 200, 150, 0.30)',
    gold: 'rgba(245, 200, 66, 0.30)',
  },

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const

// Type helper — ใช้ตอน prop drilling
export type ColorToken = typeof Colors