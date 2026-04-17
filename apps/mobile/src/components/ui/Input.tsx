import { View, Text, TextInput, TextInputProps } from 'react-native'

type InputProps = TextInputProps & {
  label?: string
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-[11px] font-sarabun-extrabold text-white/40 uppercase tracking-wider mb-2">
          {label}
        </Text>
      )}
      <TextInput
        className={`bg-white/[0.06] border border-white/[0.08] rounded-[14px] px-4 py-3.5 text-[15px] font-sarabun-medium text-white/95 ${className}`}
        placeholderTextColor="rgba(255,255,255,0.28)"
        {...props}
      />
    </View>
  )
}
