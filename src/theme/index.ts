import { useColorScheme } from 'react-native';

const lightColors = {
  primary: '#143B59', onPrimary: '#FFFFFF', background: '#F5F6F8', surface: '#FFFFFF',
  textPrimary: '#152B44', textSecondary: '#5F7083', success: '#17684E',
  successSurface: '#E3F2EB', warning: '#854B0A', warningSurface: '#FFF2DC',
  border: '#DFE5EC', mutedSurface: '#EDF1F5'
};
const darkColors: typeof lightColors = {
  primary: '#A8D9F0', onPrimary: '#142633', background: '#151E29', surface: '#1E2B3A',
  textPrimary: '#EAF0F7', textSecondary: '#B1BFD0', success: '#8DD4B4',
  successSurface: '#213C34', warning: '#F4CB85', warningSurface: '#3A2D1D',
  border: '#384659', mutedSurface: '#263544'
};
export const lineColors: Record<string, string> = {
  '1': '#C21C34', '2': '#D69638', '3': '#2D4491', '5': '#8C481D', '7': '#0F766E'
};
export const lineTextColor = (line: string) => line === '2' ? '#152B44' : '#FFFFFF';
export const theme = {
  isDark: false,
  colors: lightColors,
  spacing: (factor: number) => factor * 8,
  fonts: { regular: 'System', medium: 'System', bold: 'System' },
  borderRadius: { sm: 10, md: 20, lg: 26 }
};
const darkTheme: typeof theme = { ...theme, isDark: true, colors: darkColors };
export type Theme = typeof theme;
export function useAppTheme(): Theme {
  return useColorScheme() === 'dark' ? darkTheme : theme;
}
