import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme, Theme } from './tokens';

type ThemeCtx = {
  theme: Theme;
  dark: boolean;
  toggle: () => void;
};

const Ctx = createContext<ThemeCtx>({ theme: lightTheme, dark: false, toggle: () => {} });

const STORAGE_KEY = 'novabank.theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(Appearance.getColorScheme() === 'dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'dark') setDark(true);
      if (v === 'light') setDark(false);
    });
  }, []);

  const toggle = () => {
    setDark((d) => {
      const next = !d;
      AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  };

  const theme = useMemo(() => (dark ? darkTheme : lightTheme), [dark]);

  return <Ctx.Provider value={{ theme, dark, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
