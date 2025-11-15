/**
 * SENTIMARK DESIGN TOKENS - TypeScript Type Definitions
 *
 * Matches INTERFACE_CONTRACTS.ts SentimarkDesignTokens interface exactly
 *
 * Created: 2025-11-15
 * Last Updated: 2025-11-15
 */

/**
 * SentimarkDesignTokens Interface
 * EXACT MATCH from INTERFACE_CONTRACTS.ts (lines 19-113)
 *
 * This is the contract that all agents must adhere to.
 */
export interface SentimarkDesignTokens {
  colors: {
    // Primary brand colors
    primary: '#27E0A3'      // Emerald green
    secondary: '#2D7BFF'    // Electric blue

    // Gradient (used in hero sections, CTAs)
    gradient: 'linear-gradient(90deg, #27E0A3 0%, #2D7BFF 100%)'

    // Background colors (dark theme)
    background: {
      primary: '#0A0F16'      // Deep dark blue
      secondary: '#0F1419'    // Slightly lighter
      surface: '#1A1F26'      // Card backgrounds
      elevated: '#242931'     // Modal/dropdown backgrounds
    }

    // Text colors
    text: {
      primary: '#E6F2FF'      // Light blue-white (14.2:1 contrast)
      secondary: '#B8C5D0'    // Muted light blue
      tertiary: '#8A96A3'     // Subtle gray-blue
      disabled: '#4A5157'     // Disabled state
    }

    // Semantic colors
    success: '#27E0A3'        // Matches primary
    danger: '#FF4757'         // Error red
    warning: '#FFA502'        // Warning orange
    info: '#2D7BFF'           // Matches secondary
  }

  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      mono: '"SF Mono", "Consolas", "Monaco", monospace'
    }

    fontSize: {
      xs: '0.75rem'    // 12px
      sm: '0.875rem'   // 14px
      base: '1rem'     // 16px
      lg: '1.125rem'   // 18px
      xl: '1.25rem'    // 20px
      '2xl': '1.5rem'  // 24px
      '3xl': '1.875rem' // 30px
      '4xl': '2.25rem' // 36px
    }

    fontWeight: {
      normal: 400
      medium: 500
      semibold: 600
      bold: 700
      extrabold: 800
    }
  }

  spacing: {
    // 4px base unit system
    0: '0'
    1: '0.25rem'  // 4px
    2: '0.5rem'   // 8px
    3: '0.75rem'  // 12px
    4: '1rem'     // 16px
    6: '1.5rem'   // 24px
    8: '2rem'     // 32px
    12: '3rem'    // 48px
    16: '4rem'    // 64px
    24: '6rem'    // 96px
    32: '8rem'    // 128px
  }

  borderRadius: {
    none: '0'
    sm: '0.25rem'    // 4px
    DEFAULT: '0.5rem' // 8px
    md: '0.75rem'    // 12px
    lg: '1rem'       // 16px
    xl: '1.5rem'     // 24px
    '2xl': '2rem'    // 32px
    full: '9999px'   // Pills
  }

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    glow: '0 0 20px rgba(39, 224, 163, 0.3)'          // Emerald glow
    glowBlue: '0 0 20px rgba(45, 123, 255, 0.3)'      // Blue glow
  }
}

/**
 * Design Token Constants
 * Runtime access to design tokens
 */
export const SENTIMARK_DESIGN_TOKENS: SentimarkDesignTokens = {
  colors: {
    primary: '#27E0A3',
    secondary: '#2D7BFF',
    gradient: 'linear-gradient(90deg, #27E0A3 0%, #2D7BFF 100%)',
    background: {
      primary: '#0A0F16',
      secondary: '#0F1419',
      surface: '#1A1F26',
      elevated: '#242931',
    },
    text: {
      primary: '#E6F2FF',
      secondary: '#B8C5D0',
      tertiary: '#8A96A3',
      disabled: '#4A5157',
    },
    success: '#27E0A3',
    danger: '#FF4757',
    warning: '#FFA502',
    info: '#2D7BFF',
  },
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"SF Mono", "Consolas", "Monaco", monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    6: '1.5rem',
    8: '2rem',
    12: '3rem',
    16: '4rem',
    24: '6rem',
    32: '8rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    DEFAULT: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glow: '0 0 20px rgba(39, 224, 163, 0.3)',
    glowBlue: '0 0 20px rgba(45, 123, 255, 0.3)',
  },
}

/**
 * CSS Variable Helper
 * Generate CSS custom property reference
 */
export function cssVar(token: string): string {
  return `var(--${token})`
}

/**
 * Tailwind Class Name Helper
 * Build Tailwind class names conditionally
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Type-safe color access
 */
export type ColorToken = keyof Omit<SentimarkDesignTokens['colors'], 'background' | 'text' | 'gradient'>
export type BackgroundColorToken = keyof SentimarkDesignTokens['colors']['background']
export type TextColorToken = keyof SentimarkDesignTokens['colors']['text']

/**
 * Type-safe spacing access
 */
export type SpacingToken = keyof SentimarkDesignTokens['spacing']

/**
 * Type-safe typography access
 */
export type FontSizeToken = keyof SentimarkDesignTokens['typography']['fontSize']
export type FontWeightToken = keyof SentimarkDesignTokens['typography']['fontWeight']

/**
 * Type-safe border radius access
 */
export type BorderRadiusToken = keyof SentimarkDesignTokens['borderRadius']

/**
 * Type-safe shadow access
 */
export type ShadowToken = keyof SentimarkDesignTokens['shadows']

/**
 * Utility: Get color value from token
 */
export function getColor(token: ColorToken | BackgroundColorToken | TextColorToken): string {
  // This would need runtime logic to resolve nested paths
  // For now, return the CSS variable reference
  return cssVar(`color-${token}`)
}

/**
 * Utility: Get spacing value from token
 */
export function getSpacing(token: SpacingToken): string {
  return SENTIMARK_DESIGN_TOKENS.spacing[token]
}

/**
 * Utility: Get font size value from token
 */
export function getFontSize(token: FontSizeToken): string {
  return SENTIMARK_DESIGN_TOKENS.typography.fontSize[token]
}

/**
 * Utility: Get shadow value from token
 */
export function getShadow(token: ShadowToken): string {
  return SENTIMARK_DESIGN_TOKENS.shadows[token]
}

/**
 * Export all tokens and utilities
 */
export default SENTIMARK_DESIGN_TOKENS
