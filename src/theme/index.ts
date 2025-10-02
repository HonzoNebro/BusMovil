export const theme = {
  colors: {
    primary: '#004AAD',
    onPrimary: '#FFFFFF',
    background: '#F2F4F8',
    surface: '#FFFFFF',
    textPrimary: '#1B1D23',
    textSecondary: '#5C6270',
    success: '#22C55E',
    warning: '#FACC15'
  },
  spacing: (factor: number) => factor * 8,
  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System'
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24
  }
} as const;

export type Theme = typeof theme;
