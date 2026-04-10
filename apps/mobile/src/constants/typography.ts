import { Platform, TextStyle } from 'react-native'

export const FontFamily = {
  sarabun: {
    light: 'Sarabun_300Light',
    regular: 'Sarabun_400Regular',
    medium: 'Sarabun_500Medium',
    semiBold: 'Sarabun_600SemiBold',
    bold: 'Sarabun_700Bold',
    extraBold: 'Sarabun_800ExtraBold',
  },
  mono: {
    regular: 'DMMono_400Regular',
    medium: 'DMMono_500Medium',
    semiBold: 'DMMono_600SemiBold',
  },
  system: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
} as const

export const FontSize = {
  xs: 10,
  sm: 11,
  base: 13,
  md: 14,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 38,
} as const

export const FontWeight = {
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
} as const

// Text Style Presets
export const TextStyles = {
  display: {
    fontFamily: FontFamily.sarabun.extraBold,
    fontSize: FontSize['4xl'],
    letterSpacing: -0.8,
    color: 'rgba(255,255,255,0.95)',
  } satisfies TextStyle,

  h1: {
    fontFamily: FontFamily.sarabun.extraBold,
    fontSize: FontSize['2xl'],
    color: 'rgba(255,255,255,0.95)',
  } satisfies TextStyle,

  h2: {
    fontFamily: FontFamily.sarabun.bold,
    fontSize: FontSize.xl,
    color: 'rgba(255,255,255,0.95)',
  } satisfies TextStyle,

  h3: {
    fontFamily: FontFamily.sarabun.bold,
    fontSize: FontSize.lg,
    color: 'rgba(255,255,255,0.95)',
  } satisfies TextStyle,

  bodyLg: {
    fontFamily: FontFamily.sarabun.medium,
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.85)',
  } satisfies TextStyle,

  bodyMd: {
    fontFamily: FontFamily.sarabun.regular,
    fontSize: FontSize.base,
    color: 'rgba(255,255,255,0.70)',
  } satisfies TextStyle,

  bodySm: {
    fontFamily: FontFamily.sarabun.regular,
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.55)',
  } satisfies TextStyle,

  caption: {
    fontFamily: FontFamily.sarabun.medium,
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.55)',
  } satisfies TextStyle,

  label: {
    fontFamily: FontFamily.sarabun.extraBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.40)',
  } satisfies TextStyle,

  // Mono — ตัวเลข
  monoLg: {
    fontFamily: FontFamily.mono.semiBold,
    fontSize: FontSize['2xl'],
    letterSpacing: -0.5,
    color: 'rgba(255,255,255,0.95)',
  } satisfies TextStyle,

  monoMd: {
    fontFamily: FontFamily.mono.medium,
    fontSize: FontSize.lg,
    color: 'rgba(255,255,255,0.85)',
  } satisfies TextStyle,

  monoSm: {
    fontFamily: FontFamily.mono.regular,
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.45)',
  } satisfies TextStyle,

  // Amount — ยอดเงิน
  amountHero: {
    fontFamily: FontFamily.mono.semiBold,
    fontSize: FontSize['5xl'],
    letterSpacing: -1,
    color: 'rgba(255,255,255,0.95)',
  } satisfies TextStyle,

  amountLg: {
    fontFamily: FontFamily.mono.semiBold,
    fontSize: FontSize['2xl'],
    color: 'rgba(255,255,255,0.95)',
  } satisfies TextStyle,

  amountMd: {
    fontFamily: FontFamily.mono.medium,
    fontSize: FontSize.lg,
    color: 'rgba(255,255,255,0.95)',
  } satisfies TextStyle,
} as const