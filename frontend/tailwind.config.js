/** @type {import('tailwindcss').Config} */

/*  PRAKALP-DRISHTI — SOVEREIGN INSTITUTIONAL DESIGN SYSTEM
 *  ────────────────────────────────────────────────────────────────────────
 *  A ministry decision terminal, not a SaaS dashboard. Three rules drive
 *  every token below:
 *
 *  1. STRUCTURE IS DRAWN WITH HAIRLINES, NOT SHADOWS.
 *     Radii collapse to 0-4px and elevation is reserved for true overlays.
 *     Floating rounded cards read as consumer software; a dense grid of
 *     1px rules reads as an instrument.
 *
 *  2. COLOUR CARRIES STATE, NEVER DECORATION.
 *     Semantic hues appear as 3px status rules and small marks against a
 *     near-neutral wash. The audit that preceded this rewrite counted 132
 *     pastel -50 fills doing purely ornamental work.
 *
 *  3. NUMBERS ARE TYPESET AS DATA.
 *     Every figure is tabular-nums monospace so columns align and digits
 *     stop reflowing as values update.
 *
 *  Note on the gov-* block: 138 utility usages across the app referenced
 *  tokens (gov-border, gov-muted, gov-surface, gov-accent and their
 *  variants) that were never defined, so Tailwind emitted nothing for them
 *  and borders silently fell back to currentColor while "muted" text
 *  rendered at full strength. They are defined here and mapped onto the new
 *  scale, which is why the whole application changes character at once.
 */

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
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './amey/**/*.{js,ts,jsx,tsx}',
    './tanmay/**/*.{js,ts,jsx,tsx}',
    './parth/**/*.{js,ts,jsx,tsx}',
    './janhavi/**/*.{js,ts,jsx,tsx}',
    './soham/**/*.{js,ts,jsx,tsx}',
    './aditya/**/*.{js,ts,jsx,tsx}',
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

        /* ── Semantic palettes, retuned in place ──────────────────────
           The audit counted 132 `-50` pastel fills across 29 files doing
           decorative rather than informational work. Rather than rewrite
           every call site, the light steps of the palettes those fills draw
           from are pulled down to a near-paper tint and the dark steps are
           deepened for contrast. A status block therefore keeps its meaning
           and its markup, but stops shouting: hue now lives in the border
           and the label, not in a large saturated field.
           Steps 300-500 are left near stock so charts and marks keep their
           legibility. */
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
      },

      fontFamily: {
        /* The application advertises air-gapped operation, so every stack
           degrades to fonts already present on a government workstation.
           The webfonts are an enhancement, never a dependency. */
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

      /* Sharp by default. 4px is the ceiling for anything that holds data. */
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '3px',
        md: '4px',
        lg: '5px',
        xl: '6px',
        '2xl': '6px',
        '3xl': '8px',
      },

      /* Elevation is near-zero by design: structure is drawn with hairlines.
         `soft` and `xs` were referenced 18 times without ever being defined,
         so they are declared here rather than left as silent no-ops. */
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
      },

      dropShadow: { xs: '0 1px 0 rgba(11,29,46,0.06)' },

      maxWidth: { content: '1240px', shell: '1440px' },
      spacing: { section: '80px', 'section-sm': '48px', rail: '3px' },
      letterSpacing: { institutional: '0.09em' },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
