/** @type {import('tailwindcss').Config} */

/*  PRAKALP-DRISHTI — SOVEREIGN INSTITUTIONAL DESIGN SYSTEM */

const ink = {
  900: '#071320',
  800: '#0B1D2E',
  700: '#102A40',
  600: '#1A3A55',
  500: '#2C5070',
  400: '#46586B',
  300: '#637384',
  200: '#9AA8B6',
  100: '#C9CFD6',
};

export default {
  darkMode: ["class"],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './amey/**/*.{js,ts,jsx,tsx}',
    './tanmay/**/*.{js,ts,jsx,tsx}',
    './parth/**/*.{js,ts,jsx,tsx}',
    './janhavi/**/*.{js,ts,jsx,tsx}',
    './aditya/**/*.{js,ts,jsx,tsx}',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink,

        /* ── Sovereign chrome ─────────────────────────────────────── */
        'gov-navy': '#0B1D2E',
        'gov-navy-dark': '#071320',
        'gov-navy-hover': '#102A40',
        'gov-navy-light': '#1A3A55',
        'gov-slate-footer': '#050D16',

        /* Saffron is the state accent. One hue, used sparingly. */
        'gov-saffron': '#E4610A',
        'gov-saffron-vibrant': '#F0700F',
        'gov-saffron-dark': '#A8410A',
        'gov-saffron-light': '#FFF4EA',

        /* Gold reads as authority on deep navy: active nav, seals,
           cryptographic provenance. It is what gov-accent-* now means. */
        'gov-accent': '#F2B441',
        'gov-accent-hover': '#FFC65C',
        'gov-accent-dark': '#8A6A18',
        'gov-gold-parchment': '#FCF7EC',
        'gov-gold-border': '#E4D3A8',

        /* ── Paper & structure ────────────────────────────────────── */
        'page-bg': '#FBFBFA',
        surface: '#FFFFFF',
        'gov-surface': '#F7F8F9',
        'gov-muted-surface': '#F1F3F5',
        'gov-border': '#E3E6EA',
        'border-default': '#E3E6EA',
        'border-strong': '#C9CFD6',

        /* ── Text ─────────────────────────────────────────────────── */
        'gov-text-main': '#14212E',
        'gov-text-body': '#46586B',
        'text-primary': '#14212E',
        'text-secondary': '#46586B',
        'text-muted': '#637384',
        'gov-muted': '#637384',
        'gov-muted-dark': '#46586B',
        'gov-muted-light': '#9AA8B6',

        /* Body text one step softer than --ink but still comfortably AA. Added
           because the audit replaced ~169 uses of text-slate-400 (2.56:1 on
           white — a 1.4.3 failure) and needed a readable secondary that is not
           the same weight as primary text. Mirrors --ink-soft in tokens.css. */
        'gov-soft': '#46586B',   /* 7.6:1 on #FFFFFF */
        'gov-dim': '#9AA8B6',    /* decorative tint only, never body text */

        /* Surface aliases matching --surface-* in tokens.css, so a component can
           name the paper it sits on without hardcoding a slate/zinc step. */
        'surface-2': '#F7F8F9',
        'surface-3': '#F1F3F5',

        /* Status washes, matching --*-wash in tokens.css. */
        'gold-wash': '#FCF7EC',
        'azure-wash': '#EDF3F8',
        'emerald-wash': '#EAF6F0',
        'crimson-wash': '#FCEFF0',

        amber: {
          50: '#FDF8EE', 100: '#F8EFD9', 200: '#EADFC0', 300: '#DCC48A',
          400: '#C99A38', 500: '#B57F14', 600: '#A9680A', 700: '#8A5308',
          800: '#6E4207', 900: '#573406', 950: '#3F2604',
        },
        rose: {
          50: '#FCF1F2', 100: '#F8E2E4', 200: '#EDCBCF', 300: '#DDA3AA',
          400: '#C56872', 500: '#B23A47', 600: '#A81F2D', 700: '#8A1925',
          800: '#6E141D', 900: '#571017', 950: '#3E0C11',
        },
        emerald: {
          50: '#EDF6F1', 100: '#DCEDE4', 200: '#C1DFCE', 300: '#93C6AC',
          400: '#4EA07B', 500: '#17855A', 600: '#0E7A4A', 700: '#0B6239',
          800: '#094E2E', 900: '#073E25', 950: '#052B1A',
        },
        sky: {
          50: '#EEF4F9', 100: '#DEEAF3', 200: '#C4DAE9', 300: '#95BCD6',
          400: '#4F8DB5', 500: '#22699A', 600: '#17557F', 700: '#134668',
          800: '#0F3752', 900: '#0C2C42', 950: '#08202F',
        },

        /* ── Named semantic tokens ────────────────────────────────── */
        'gov-success': '#0E7A4A',
        'gov-green-map': '#0E7A4A',
        'gov-green-light': '#EAF6F0',
        'gov-warning': '#A9680A',
        'gov-danger': '#A81F2D',
        'gov-blue': '#17557F',
        'gov-blue-light': '#EDF3F8',

        // Shadcn UI Colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        // Tremor Colors
        tremor: {
          brand: {
            faint: "#eff6ff",
            muted: "#bfdbfe",
            subtle: "#60a5fa",
            DEFAULT: "#3b82f6",
            emphasis: "#1d4ed8",
            inverted: "#ffffff",
          },
          background: {
            muted: "#f9fafb",
            subtle: "#f3f4f6",
            DEFAULT: "#ffffff",
            emphasis: "#374151",
          },
          border: {
            DEFAULT: "#e5e7eb",
          },
          ring: {
            DEFAULT: "#e5e7eb",
          },
          content: {
            subtle: "#9ca3af",
            DEFAULT: "#6b7280",
            emphasis: "#374151",
            strong: "#111827",
            inverted: "#ffffff",
          },
        },
      },

      fontFamily: {
        sans: ['"Inter"', '"Segoe UI"', 'system-ui', '"Noto Sans"', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', '"Inter"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"Plus Jakarta Sans"', '"Inter"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        num: ['"Plus Jakarta Sans"', '"Inter"', 'sans-serif'],
        cinzel: ['"Cinzel"', 'Georgia', 'serif'],
        devanagari: ['"Noto Sans Devanagari"', '"Nirmala UI"', '"Inter"', 'sans-serif'],
      },

      fontSize: {
        micro: ['10px', { lineHeight: '1.35', letterSpacing: '0.09em' }],
        caption: ['11px', { lineHeight: '1.45' }],
        'body-sm': ['12.5px', { lineHeight: '1.55' }],
        body: ['13.5px', { lineHeight: '1.6' }],
        lead: ['15px', { lineHeight: '1.6' }],
        'metric-sm': ['17px', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        metric: ['23px', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        'metric-lg': ['31px', { lineHeight: '1.04', letterSpacing: '-0.025em' }],
      },

      borderRadius: {
        none: '0',
        sm: 'calc(var(--radius) - 4px)',
        DEFAULT: '3px',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: '6px',
        '2xl': '6px',
        '3xl': '8px',
      },

      boxShadow: {
        none: 'none',
        xs: '0 1px 0 rgba(11,29,46,0.03)',
        soft: '0 1px 0 rgba(11,29,46,0.04)',
        subtle: '0 1px 0 rgba(11,29,46,0.04)',
        card: '0 1px 0 rgba(11,29,46,0.04)',
        elevated: '0 1px 2px rgba(11,29,46,0.06)',
        menu: '0 12px 32px -8px rgba(7,19,32,0.28)',
        'parchment-glow': '0 1px 0 rgba(11,29,46,0.04)',
        rail: 'inset 3px 0 0 currentColor',
        // Tremor
        "tremor-input": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "tremor-card": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "tremor-dropdown": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },

      dropShadow: { xs: '0 1px 0 rgba(11,29,46,0.06)' },

      maxWidth: { content: '1240px', shell: '1440px' },
      spacing: { section: '80px', 'section-sm': '48px', rail: '3px' },
      letterSpacing: { institutional: '0.09em' },
    },
  },
  safelist: [
    {
      pattern:
        /^(bg-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ["hover", "ui-selected"],
    },
    {
      pattern:
        /^(text-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ["hover", "ui-selected"],
    },
    {
      pattern:
        /^(border-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ["hover", "ui-selected"],
    },
    {
      pattern:
        /^(ring-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
    {
      pattern:
        /^(stroke-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
    {
      pattern:
        /^(fill-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
  ],
  plugins: [require('tailwindcss-animate')],
};
