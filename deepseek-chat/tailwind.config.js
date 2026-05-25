/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: '#f0f4ff',
          dark: '#06061a',
        },
        chat: {
          DEFAULT: '#fafbff',
          dark: '#0a0a20',
        },
        accent: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
          light: '#eef2ff',
        },
        cyber: {
          cyan: '#00e5ff',
          purple: '#b366ff',
          green: '#00ff88',
          pink: '#ff69b4',
          blue: '#4488ff',
        },
        space: {
          dark: '#06061a',
          darker: '#030312',
          card: '#0d0d2b',
          border: '#1a1a40',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'message': '0.9375rem',
      },
      spacing: {
        'sidebar': '260px',
      },
      animation: {
        'scan': 'scan 8s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'glitch': 'glitch 0.5s ease-in-out',
        'data-flow': 'data-flow 3s linear infinite',
        'orbit': 'orbit 20s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0,229,255,0.3), 0 0 20px rgba(0,229,255,0.1)' },
          '50%': { boxShadow: '0 0 10px rgba(0,229,255,0.5), 0 0 40px rgba(0,229,255,0.2)' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 1px)' },
          '40%': { transform: 'translate(2px, -1px)' },
          '60%': { transform: 'translate(-1px, -1px)' },
          '80%': { transform: 'translate(1px, 1px)' },
        },
        'data-flow': {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
