/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#030B17',
          800: '#060F1E',
          700: '#0B1F3A',
          600: '#112952',
          500: '#162D50',
          400: '#1A3A6B',
          300: '#2A4E8A',
          200: '#3D6BAD',
        },
        emerald: {
          300: '#4DFFC4',
          400: '#00E5AA',
          500: '#00C896',
          600: '#00A878',
          700: '#007A58',
        },
        gold: {
          400: '#F9D96A',
          500: '#F5C842',
          600: '#D4A820',
        },
        error: {
          400: '#FF85A0',
          500: '#FF5C7A',
          600: '#E03058',
        },
        info: {
          400: '#6BB8F0',
          500: '#4A9EDB',
          600: '#2980C0',
        },
        accent: {
          purple: '#A78BFA',
          orange: '#FB923C',
        },
      },
      fontFamily: {
        sarabun: ['Sarabun_400Regular'],
        'sarabun-medium': ['Sarabun_500Medium'],
        'sarabun-semibold': ['Sarabun_600SemiBold'],
        'sarabun-bold': ['Sarabun_700Bold'],
        'sarabun-extrabold': ['Sarabun_800ExtraBold'],
        mono: ['DMMono_400Regular'],
        'mono-medium': ['DMMono_500Medium'],
        'mono-semibold': ['DMMono_600SemiBold'],
      },
    },
  },
  plugins: [],
}
