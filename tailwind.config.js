/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary:     { DEFAULT: 'hsl(var(--primary))',     foreground: 'hsl(var(--primary-foreground))' },
        secondary:   { DEFAULT: 'hsl(var(--secondary))',   foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted:       { DEFAULT: 'hsl(var(--muted))',       foreground: 'hsl(var(--muted-foreground))' },
        accent:      { DEFAULT: 'hsl(var(--accent))',      foreground: 'hsl(var(--accent-foreground))' },
        card:        { DEFAULT: 'hsl(var(--card))',        foreground: 'hsl(var(--card-foreground))' },
        popover:     { DEFAULT: 'hsl(var(--popover))',     foreground: 'hsl(var(--popover-foreground))' },
      },
      borderRadius: {
        lg:  'var(--radius)',
        md:  'calc(var(--radius) - 2px)',
        sm:  'var(--radius-sm)',
        xl:  'var(--radius-lg)',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'flow-water': {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'pulse-red': {
          '0%,100%': { opacity: '1'  },
          '50%':     { opacity: '.4' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(.92)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'slide-right': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'pop-in': {
          '0%':   { opacity: '0', transform: 'scale(.7) translateY(8px)' },
          '70%':  { opacity: '1', transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        'flow-water':  'flow-water 1.8s linear infinite',
        'flow-slow':   'flow-water 4.5s linear infinite',
        'flow-clog':   'flow-water 9s linear infinite',
        'pulse-red':   'pulse-red 1s ease infinite',
        'fade-up':     'fade-up .4s ease both',
        'fade-in':     'fade-in .3s ease both',
        'scale-in':    'scale-in .3s ease both',
        'slide-right': 'slide-right .3s ease both',
        'pop-in':      'pop-in .4s cubic-bezier(.34,1.56,.64,1) both',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}