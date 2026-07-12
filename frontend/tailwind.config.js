/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0F0F12',
          card: '#17171C',
          border: '#2A2A32',
          muted: '#1A1A22'
        }
      }
    },
  },
  plugins: [],
}
