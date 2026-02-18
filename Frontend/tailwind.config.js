/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Bu satır src altındaki HER ŞEYİ kapsar, doğru.
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        },
        cyber: {
          blue: '#3b82f6',
          red: '#ef4444',
          green: '#22c55e',
          yellow: '#eab308'
        }
      }
    },
  },
  plugins: [],
}