import { TouchableOpacity, Text, ActivityIndicator } from 'react-native'

type ButtonProps = {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
  disabled?: boolean
  className?: string
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
}: ButtonProps) {
  const baseClass = 'rounded-2xl py-4 items-center justify-center'
  const variantClass = {
    primary: 'bg-emerald-500',
    secondary: 'bg-white/5 border border-white/10',
    ghost: 'bg-transparent',
  }[variant]
  const textClass = {
    primary: 'text-navy-800 font-sarabun-extrabold text-[15px]',
    secondary: 'text-white/90 font-sarabun-bold text-[15px]',
    ghost: 'text-emerald-400 font-sarabun-bold text-[15px]',
  }[variant]

  return (
    <TouchableOpacity
      className={`${baseClass} ${variantClass} ${disabled ? 'opacity-50' : ''} ${className}`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#060F1E' : '#00C896'} />
      ) : (
        <Text className={textClass}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}
