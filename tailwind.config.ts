import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-poppins)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-garamond)', 'Georgia', 'Cambria', 'serif'],
        // Brand utilities used throughout the marketing/registration pages.
        garamond: ['var(--font-garamond)', 'Georgia', 'Cambria', 'serif'],
        poppins: ['var(--font-poppins)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Landing-page palette (blue "ocean" theme + warm cream).
        // Additive only — the shared brand scale below is untouched.
        cream: '#f5efe3',
        ocean: {
          50:  '#eef5fc',
          100: '#d9e8f7',
          200: '#b3d0ee',
          300: '#7fa8d8',
          400: '#4882bf',
          500: '#1e5aa0',
          600: '#134a86',
          700: '#0f3b6b',
          800: '#0a2f5a',
          900: '#072544',
          950: '#03182f',
        },
        brand: {
          50:  '#f0f9f4',
          100: '#dcf0e6',
          200: '#bbe3ce',
          300: '#89ceaf',
          400: '#54b38c',
          500: '#329870',
          600: '#227a58',
          700: '#1c6248',
          800: '#194f3a',
          900: '#163d2d',
          950: '#0b211a',
        },
      },
    },
  },
  plugins: [],
}
export default config
