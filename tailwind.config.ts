import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'table-green': '#166534',
        'table-dark': '#14532d',
        'card-back': '#1e3a5f',
      },
    },
  },
  plugins: [],
}

export default config
