import { View } from 'react-native'

type CardProps = {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'emerald' | 'subtle'
}

export function Card({ children, className = '', variant = 'default' }: CardProps) {
  const variantClass = {
    default: 'bg-white/[0.04] border border-white/[0.08]',
    emerald: 'bg-emerald-500/[0.07] border border-emerald-500/30',
    subtle: 'bg-white/[0.03]',
  }[variant]

  return (
    <View className={`rounded-2xl p-4 ${variantClass} ${className}`}>
      {children}
    </View>
  )
}
