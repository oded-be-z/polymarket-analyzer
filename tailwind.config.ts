/**
 * SENTIMARK TAILWIND CONFIGURATION
 *
 * Complete Tailwind theme matching SentimarkDesignTokens interface
 * Adheres to: INTERFACE_CONTRACTS.ts
 *
 * Created: 2025-11-15
 */

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      /* ============================================================
         COLORS - Matches SentimarkDesignTokens.colors
         ============================================================ */
      colors: {
        // Primary & Secondary (from interface)
        primary: '#27E0A3',           // Emerald green
        secondary: '#2D7BFF',         // Electric blue

        // Background colors (from interface.colors.background)
        bg: {
          primary: '#0A0F16',         // Deep dark blue
          secondary: '#0F1419',       // Slightly lighter
          surface: '#1A1F26',         // Card backgrounds
          elevated: '#242931',        // Modal/dropdown backgrounds
        },

        // Text colors (from interface.colors.text)
        text: {
          primary: '#E6F2FF',         // Light blue-white (14.2:1 contrast)
          secondary: '#B8C5D0',       // Muted light blue
          tertiary: '#8A96A3',        // Subtle gray-blue
          disabled: '#4A5157',        // Disabled state
        },

        // Semantic colors (from interface.colors)
        success: '#27E0A3',           // Matches primary
        danger: '#FF4757',            // Error red
        warning: '#FFA502',           // Warning orange
        info: '#2D7BFF',              // Matches secondary

        // Chart colors (for data visualization)
        bullish: '#1DB954',           // Long/bullish
        bearish: '#FF4D5D',           // Short/bearish
        neutral: '#8A96A3',           // Neutral
      },

      /* ============================================================
         BACKGROUND IMAGE - Gradient
         ============================================================ */
      backgroundImage: {
        'gradient-primary': 'linear-gradient(90deg, #27E0A3 0%, #2D7BFF 100%)',
      },

      /* ============================================================
         TYPOGRAPHY - Matches SentimarkDesignTokens.typography
         ============================================================ */
      fontFamily: {
        primary: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"SF Mono"', '"Consolas"', '"Monaco"', 'monospace'],
      },

      fontSize: {
        xs: '0.75rem',              // 12px
        sm: '0.875rem',             // 14px
        base: '1rem',               // 16px
        lg: '1.125rem',             // 18px
        xl: '1.25rem',              // 20px
        '2xl': '1.5rem',            // 24px
        '3xl': '1.875rem',          // 30px
        '4xl': '2.25rem',           // 36px
      },

      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },

      /* ============================================================
         SPACING - Matches SentimarkDesignTokens.spacing (4px base)
         ============================================================ */
      spacing: {
        0: '0',
        1: '0.25rem',               // 4px
        2: '0.5rem',                // 8px
        3: '0.75rem',               // 12px
        4: '1rem',                  // 16px
        6: '1.5rem',                // 24px
        8: '2rem',                  // 32px
        12: '3rem',                 // 48px
        16: '4rem',                 // 64px
        24: '6rem',                 // 96px
        32: '8rem',                 // 128px
      },

      /* ============================================================
         BORDER RADIUS - Matches SentimarkDesignTokens.borderRadius
         ============================================================ */
      borderRadius: {
        none: '0',
        sm: '0.25rem',              // 4px - tight
        DEFAULT: '0.5rem',          // 8px - standard
        md: '0.75rem',              // 12px - relaxed
        lg: '1rem',                 // 16px - large
        xl: '1.5rem',               // 24px - extra large
        '2xl': '2rem',              // 32px - very large
        full: '9999px',             // Pills/circular
      },

      /* ============================================================
         SHADOWS - Matches SentimarkDesignTokens.shadows
         ============================================================ */
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        glow: '0 0 20px rgba(39, 224, 163, 0.3)',           // Emerald glow
        glowBlue: '0 0 20px rgba(45, 123, 255, 0.3)',       // Blue glow
        none: 'none',
      },

      /* ============================================================
         ANIMATIONS
         ============================================================ */
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
        slower: '500ms',
      },

      transitionTimingFunction: {
        'in': 'cubic-bezier(0.4, 0, 1, 1)',
        'out': 'cubic-bezier(0, 0, 0.2, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },

      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.8s cubic-bezier(0, 0, 0.2, 1) forwards',
        'gradient-shift': 'gradientShift 3s cubic-bezier(0.4, 0, 0.2, 1) infinite',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },

      /* ============================================================
         Z-INDEX
         ============================================================ */
      zIndex: {
        base: '0',
        dropdown: '1000',
        sticky: '1100',
        fixed: '1200',
        'modal-backdrop': '1300',
        modal: '1400',
        popover: '1500',
        tooltip: '1600',
        notification: '1700',
      },
    },
  },
  plugins: [],
}

export default config
