/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./amey/**/*.{js,ts,jsx,tsx}",
    "./tanmay/**/*.{js,ts,jsx,tsx}",
    "./parth/**/*.{js,ts,jsx,tsx}",
    "./janhavi/**/*.{js,ts,jsx,tsx}",
    "./soham/**/*.{js,ts,jsx,tsx}",
    "./aditya/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gov-saffron': '#E87722',
        'gov-saffron-light': '#FFF4EA',
        'gov-saffron-dark': '#C76210',
        'gov-navy': '#163A59',
        'gov-navy-dark': '#0D2B43',
        'gov-navy-light': '#1E5175',
        'gov-blue': '#2474A8',
        'gov-blue-light': '#EDF4FA',
        'page-bg': '#F5F6F8',
        'surface': '#FFFFFF',
        'text-primary': '#1F2933',
        'text-secondary': '#52606D',
        'text-muted': '#7B8794',
        'border-default': '#D9E0E6',
        'border-strong': '#BCC5CE',
        'gov-success': '#18804B',
        'gov-warning': '#B76A00',
        'gov-danger': '#B42318',
      },
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      maxWidth: {
        content: '1240px',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '10px',
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(13,43,67,0.04)',
        card: '0 1px 4px rgba(13,43,67,0.06)',
        elevated: '0 4px 16px rgba(13,43,67,0.10)',
        menu: '0 8px 24px rgba(13,43,67,0.14)',
      },
      spacing: {
        'section': '72px',
        'section-sm': '48px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
