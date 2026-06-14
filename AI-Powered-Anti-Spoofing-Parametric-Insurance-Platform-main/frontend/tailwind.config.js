/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      colors: {
        ink: '#111827',
        steel: '#334155',
        mint: '#19a974',
        amber: '#f59e0b',
        coral: '#ef4444'
      }
    }
  },
  plugins: []
};
