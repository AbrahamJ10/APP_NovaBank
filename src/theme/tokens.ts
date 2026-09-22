// NovaBank design tokens — ported 1:1 from the Qubank desktop/web mockups (Canvas.dc.html)
// Primary brand navy stays fixed across themes; surfaces/text switch between light and dark.

export const BRAND = {
  navy: '#133A63',
  navyDeep: '#061626',
  navyMid: '#0E2C4E',
  navyGlow: '#1B4E80',
  gold: '#C9A227',
  goldSoft: '#E7CE92',
  goldBronze: '#B98B33',
  goldPale: '#F0DCA8',
};

export const GOLD_GRADIENT = ['#B98B33', '#E7CE92', '#C9A227'] as const;
export const NAVY_GRADIENT = ['#0E2C4E', '#061626'] as const;
export const NAVY_GRADIENT_GLOW = ['#1B4E80', 'transparent'] as const;

export type Theme = {
  dark: boolean;
  bg: string;
  surf: string;
  line: string;
  ink: string;
  mid: string;
  soft: string;
  tint: string;
  gold: string;
  selBg: string;
  shadow: object;
  green: string;
  red: string;
  amber: string;
  okBg: string;
  warnBg: string;
  navBg: string;
};

const shadowLight = {
  shadowColor: '#0C1C30',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};
const shadowDark = {
  shadowColor: '#000',
  shadowOpacity: 0.35,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

export const lightTheme: Theme = {
  dark: false,
  bg: '#F4F6F9',
  surf: '#FFFFFF',
  line: '#E2E7EE',
  ink: '#0F1A26',
  mid: '#4C5966',
  soft: '#5F6B78',
  tint: '#EDF2F8',
  gold: '#8A6B12',
  selBg: '#FDF8EC',
  shadow: shadowLight,
  green: '#17784E',
  red: '#B02B22',
  amber: '#8A6B12',
  okBg: '#EAF9F1',
  warnBg: '#FFF9EC',
  navBg: 'rgba(255,255,255,.92)',
};

export const darkTheme: Theme = {
  dark: true,
  bg: '#0A1119',
  surf: '#111E2B',
  line: '#1E2E3E',
  ink: '#F2F5F8',
  mid: '#B9C6D2',
  soft: '#9FB0C0',
  tint: '#152637',
  gold: '#E7CE92',
  selBg: '#2A2415',
  shadow: shadowDark,
  green: '#5FD3A0',
  red: '#FF8C7A',
  amber: '#E8C46A',
  okBg: '#16302A',
  warnBg: '#2E2716',
  navBg: 'rgba(17,30,43,.92)',
};

export const DANGER = '#C2352B';
export const SUCCESS = '#21A26B';
export const PANIC = '#B02B22';
export const INFO_BG = '#EAF3FF';
export const INFO_FG = '#2C6FD1';

export const radii = { sm: 9, md: 13, lg: 16, xl: 20, xxl: 26 };

export const fonts = {
  display: 'CormorantGaramond_700Bold',
  displaySemi: 'CormorantGaramond_600SemiBold',
  heading: 'Manrope_800ExtraBold',
  headingBold: 'Manrope_700Bold',
  headingSemi: 'Manrope_600SemiBold',
  headingMed: 'Manrope_500Medium',
  body: 'DMSans_400Regular',
  bodyMed: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
};
