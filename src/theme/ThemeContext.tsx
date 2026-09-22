import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme, Theme } from './tokens';

type ContextoTema = {
  theme: Theme;
  dark: boolean;
  toggle: () => void;
};

const Contexto = createContext<ContextoTema>({ theme: lightTheme, dark: false, toggle: () => {} });

const CLAVE_ALMACENAMIENTO = 'novabank.theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [oscuro, setOscuro] = useState(Appearance.getColorScheme() === 'dark');

  useEffect(() => {
    AsyncStorage.getItem(CLAVE_ALMACENAMIENTO).then((valor) => {
      if (valor === 'dark') setOscuro(true);
      if (valor === 'light') setOscuro(false);
    });
  }, []);

  const toggle = () => {
    setOscuro((actual) => {
      const siguiente = !actual;
      AsyncStorage.setItem(CLAVE_ALMACENAMIENTO, siguiente ? 'dark' : 'light');
      return siguiente;
    });
  };

  const theme = useMemo(() => (oscuro ? darkTheme : lightTheme), [oscuro]);

  return <Contexto.Provider value={{ theme, dark: oscuro, toggle }}>{children}</Contexto.Provider>;
}

export const useTheme = () => useContext(Contexto);
