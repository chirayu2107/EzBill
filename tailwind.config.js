/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        number: ['DM Mono', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        gray: {
          750: '#2D3748',
        },
        surface: {
          light: '#FAFAFA',
        }
      },
      boxShadow: {
        // Naina multi-layer card shadows
        'ez': 'inset 0 0 0 1px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
        'ez-hover': 'inset 0 0 0 1px rgba(16,185,129,0.15), 0 2px 4px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.06), 0 0 24px rgba(16,185,129,0.08)',
        'ez-elevated': 'inset 0 0 0 1px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.08), 0 24px 64px rgba(0,0,0,0.06)',
        'ez-glow': '0 0 20px rgba(16,185,129,0.12), 0 0 60px rgba(16,185,129,0.06)',
        // Dark mode variants
        'ez-dark': 'inset 0 0 0 1px rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)',
        'ez-dark-hover': 'inset 0 0 0 1px rgba(16,185,129,0.2), 0 2px 4px rgba(0,0,0,0.3), 0 16px 48px rgba(0,0,0,0.3), 0 0 24px rgba(16,185,129,0.1)',
        'ez-dark-elevated': 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 4px 8px rgba(0,0,0,0.4), 0 24px 64px rgba(0,0,0,0.3)',
      },
      letterSpacing: {
        'heading': '-0.025em',
        'heading-tight': '-0.04em',
        'eyebrow': '0.12em',
      },
      lineHeight: {
        'body': '1.6',
      },
      backdropBlur: {
        'glass': '30px',
        'glass-heavy': '40px',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease-out',
        'fade-up-delay': 'fadeUp 0.4s ease-out 0.08s both',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'loading-bar': 'loadingBar 1.5s ease-in-out infinite',
        'slide-pill': 'slidePill 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        loadingBar: {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
          '50%': { transform: 'scaleX(1)', transformOrigin: 'left' },
          '51%': { transformOrigin: 'right' },
          '100%': { transform: 'scaleX(0)', transformOrigin: 'right' },
        },
        slidePill: {
          '0%': { transform: 'scale(0.95)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
