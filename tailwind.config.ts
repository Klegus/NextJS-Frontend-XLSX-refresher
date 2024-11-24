import type { Config } from "tailwindcss";

export default {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'wspia-red': '#e31e24',
        'wspia-gray': '#58595b',
        'wspia-light-gray': '#e5e7eb',
      },
    },
  },
  plugins: [],
} satisfies Config;
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'wspia-red': 'var(--wspaa-red)',
        'wspia-gray': 'var(--wspia-gray)',
        'wspia-light-gray': 'var(--wspia-light-gray)',
      },
    },
  },
  plugins: [],
}

export default config
