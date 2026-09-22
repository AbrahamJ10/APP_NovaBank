// Tokens de diseño de NovaBank — trasladados 1:1 desde los mockups de escritorio/web de Qubank (Canvas.dc.html)
// El azul marino principal de la marca se mantiene fijo entre temas; las superficies/textos cambian entre claro y oscuro.

export const MARCA = {
  navy: '#133A63',
  navyDeep: '#061626',
  navyMid: '#0E2C4E',
  navyGlow: '#1B4E80',
  gold: '#C9A227',
  goldSoft: '#E7CE92',
  goldBronze: '#B98B33',
  goldPale: '#F0DCA8',
};

export const GRADIENTE_DORADO = ['#B98B33', '#E7CE92', '#C9A227'] as const;
export const GRADIENTE_MARINO = ['#0E2C4E', '#061626'] as const;
export const GRADIENTE_MARINO_BRILLO = ['#1B4E80', 'transparent'] as const;

export type Tema = {
  oscuro: boolean;
  fondo: string;
  superficie: string;
  linea: string;
  tinta: string;
  medio: string;
  suave: string;
  matiz: string;
  dorado: string;
  fondoSel: string;
  sombra: object;
  verde: string;
  rojo: string;
  ambar: string;
  fondoOk: string;
  fondoAdvertencia: string;
  fondoNav: string;
};

const sombraClara = {
  shadowColor: '#0C1C30',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};
const sombraOscura = {
  shadowColor: '#000',
  shadowOpacity: 0.35,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

export const temaClaro: Tema = {
  oscuro: false,
  fondo: '#F4F6F9',
  superficie: '#FFFFFF',
  linea: '#E2E7EE',
  tinta: '#0F1A26',
  medio: '#4C5966',
  suave: '#5F6B78',
  matiz: '#EDF2F8',
  dorado: '#8A6B12',
  fondoSel: '#FDF8EC',
  sombra: sombraClara,
  verde: '#17784E',
  rojo: '#B02B22',
  ambar: '#8A6B12',
  fondoOk: '#EAF9F1',
  fondoAdvertencia: '#FFF9EC',
  fondoNav: 'rgba(255,255,255,.92)',
};

export const temaOscuro: Tema = {
  oscuro: true,
  fondo: '#0A1119',
  superficie: '#111E2B',
  linea: '#1E2E3E',
  tinta: '#F2F5F8',
  medio: '#B9C6D2',
  suave: '#9FB0C0',
  matiz: '#152637',
  dorado: '#E7CE92',
  fondoSel: '#2A2415',
  sombra: sombraOscura,
  verde: '#5FD3A0',
  rojo: '#FF8C7A',
  ambar: '#E8C46A',
  fondoOk: '#16302A',
  fondoAdvertencia: '#2E2716',
  fondoNav: 'rgba(17,30,43,.92)',
};

export const PELIGRO = '#C2352B';
export const EXITO = '#21A26B';
export const PANICO = '#B02B22';
export const FONDO_INFO = '#EAF3FF';
export const TEXTO_INFO = '#2C6FD1';

export const radios = { sm: 9, md: 13, lg: 16, xl: 20, xxl: 26 };

export const fuentes = {
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
