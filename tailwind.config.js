/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          primary: '#0f172a',
          secondary: '#1e293b',
          accent: '#3b82f6',
          danger: '#ef4444',
          success: '#10b981',
          background: '#f8fafc',
          card: '#ffffff',
          text: {
            primary: '#0f172a',
            secondary: '#64748b',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
