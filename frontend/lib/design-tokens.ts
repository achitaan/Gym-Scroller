// Design tokens for mobile-first strength training app
// High-contrast dark theme first

export const tokens = {
  colors: {
    // Dark theme primary
    background: {
      primary: '#0A0A0A',
      secondary: '#141414',
      tertiary: '#1F1F1F',
      elevated: '#2A2A2A',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#A3A3A3',
      tertiary: '#737373',
      disabled: '#525252',
    },
    accent: {
      primary: '#FFFFFF', // White for primary actions (black & white theme)
      secondary: '#8B5CF6', // Purple for secondary
      success: '#10B981', // Green for success/PRs
      warning: '#F59E0B', // Amber for warnings
      error: '#EF4444', // Red for errors
    },
    // Velocity Loss (VL) bands
    vl: {
      minimal: '#10B981', // 0-10% - green
      low: '#34D399', // 10-20% - light green
      moderate: '#FBBF24', // 20-30% - yellow
      high: '#FB923C', // 30-40% - orange
      critical: '#EF4444', // 40%+ - red
    },
    border: {
      subtle: '#262626',
      default: '#404040',
      strong: '#525252',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  typography: {
    // Mobile-first sizing
    title: {
      size: '28px',
      weight: '700',
      lineHeight: '1.2',
    },
    heading: {
      size: '20px',
      weight: '600',
      lineHeight: '1.3',
    },
    body: {
      size: '16px',
      weight: '400',
      lineHeight: '1.5',
    },
    caption: {
      size: '14px',
      weight: '400',
      lineHeight: '1.4',
    },
    label: {
      size: '12px',
      weight: '500',
      lineHeight: '1.3',
      letterSpacing: '0.5px',
    },
    number: {
      large: '48px',
      medium: '32px',
      small: '24px',
      weight: '700',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.4)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.6)',
  },
  transition: {
    fast: '100ms',
    base: '200ms',
    slow: '300ms',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
  },
  touchTarget: {
    min: '44px', // Minimum touch target size
  },
} as const;

// CSS custom properties generator
export function generateCSSVars() {
  return `
    :root {
      --bg-primary: ${tokens.colors.background.primary};
      --bg-secondary: ${tokens.colors.background.secondary};
      --bg-tertiary: ${tokens.colors.background.tertiary};
      --bg-elevated: ${tokens.colors.background.elevated};

      --text-primary: ${tokens.colors.text.primary};
      --text-secondary: ${tokens.colors.text.secondary};
      --text-tertiary: ${tokens.colors.text.tertiary};

      --accent-primary: ${tokens.colors.accent.primary};
      --accent-secondary: ${tokens.colors.accent.secondary};
      --accent-success: ${tokens.colors.accent.success};
      --accent-warning: ${tokens.colors.accent.warning};
      --accent-error: ${tokens.colors.accent.error};

      --vl-minimal: ${tokens.colors.vl.minimal};
      --vl-low: ${tokens.colors.vl.low};
      --vl-moderate: ${tokens.colors.vl.moderate};
      --vl-high: ${tokens.colors.vl.high};
      --vl-critical: ${tokens.colors.vl.critical};

      --border-subtle: ${tokens.colors.border.subtle};
      --border-default: ${tokens.colors.border.default};
      --border-strong: ${tokens.colors.border.strong};

      --shadow-sm: ${tokens.shadows.sm};
      --shadow-md: ${tokens.shadows.md};
      --shadow-lg: ${tokens.shadows.lg};
      --shadow-xl: ${tokens.shadows.xl};
    }
  `;
}

// Utility function to get VL color
export function getVLColor(vlPercentage: number): string {
  if (vlPercentage <= 10) return tokens.colors.vl.minimal;
  if (vlPercentage <= 20) return tokens.colors.vl.low;
  if (vlPercentage <= 30) return tokens.colors.vl.moderate;
  if (vlPercentage <= 40) return tokens.colors.vl.high;
  return tokens.colors.vl.critical;
}
