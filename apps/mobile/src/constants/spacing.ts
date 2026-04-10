import { ViewStyle } from 'react-native'

// Base unit = 4px
export const Spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  3: 12,
  4: 16,   // ← Padding มาตรฐาน
  5: 20,
  6: 24,   // ← Section gap
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
} as const

export const Radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  '2xl': 14,
  '3xl': 16,
  '4xl': 20,
  '5xl': 24,
  full: 9999,
  // Presets
  card: 12,
  button: 10,
  input: 10,
  badge: 20,
} as const

export const Shadow = {
  none: {} as ViewStyle,
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  } satisfies ViewStyle,
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 4,
  } satisfies ViewStyle,
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  } satisfies ViewStyle,
  emerald: {
    shadowColor: '#00C896',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 16,
    elevation: 6,
  } satisfies ViewStyle,
  gold: {
    shadowColor: '#F5C842',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  } satisfies ViewStyle,
} as const

export const Layout = {
  screenPaddingH: Spacing[4],   // 16px
  screenPaddingV: Spacing[4],   // 16px
  cardPadding: Spacing[3],      // 12px
  sectionGap: Spacing[5],       // 20px
  itemGap: Spacing[2],          // 8px
  bottomNavHeight: 80,
  statusBarHeight: 44,
  headerHeight: 56,
} as const