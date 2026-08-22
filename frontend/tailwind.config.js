/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./tanmay/**/*.{js,ts,jsx,tsx}",
    "./janhavi/**/*.{js,ts,jsx,tsx}",
    "./purva/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Corporate Government Design System Tokens (Flat Keys)
        'gov-bg': '#FFFFFF',
        'gov-surface': '#F7F8FA',
        'gov-border': '#E2E8F0',
        'gov-border-dark': '#CBD5E1',

        'gov-navy': {
          DEFAULT: '#1E2A45',
          dark: '#141D30',
          light: '#28385C',
          hover: '#253456',
        },

        'gov-accent': {
          DEFAULT: '#C5D86D',
          hover: '#B5C85D',
          light: '#F4F7E6',
          dark: '#9CB33B',
        },

        'gov-muted': {
          DEFAULT: '#5B6B8C',
          light: '#8896B3',
          dark: '#43506D',
          surface: '#EEF2F6',
        },

        'gov-text-main': '#1E2A45',
        'gov-text-body': '#4B5563',
        'gov-text-muted': '#64748B',

        // Nested gov object support
        gov: {
          bg: '#FFFFFF',
          surface: '#F7F8FA',
          border: '#E2E8F0',
          navy: {
            DEFAULT: '#1E2A45',
            dark: '#141D30',
            light: '#28385C',
            hover: '#253456',
          },
          accent: {
            DEFAULT: '#C5D86D',
            hover: '#B5C85D',
            light: '#F4F7E6',
            dark: '#9CB33B',
          },
          muted: {
            DEFAULT: '#5B6B8C',
            light: '#8896B3',
            dark: '#43506D',
            surface: '#EEF2F6',
          },
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        soft: '0 1px 3px 0 rgba(30, 42, 69, 0.05), 0 1px 2px -1px rgba(30, 42, 69, 0.05)',
        card: '0 4px 6px -1px rgba(30, 42, 69, 0.06), 0 2px 4px -2px rgba(30, 42, 69, 0.04)',
        elevated: '0 10px 15px -3px rgba(30, 42, 69, 0.08), 0 4px 6px -4px rgba(30, 42, 69, 0.04)',
      }
    },
  },
  plugins: [],
}
