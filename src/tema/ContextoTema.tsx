import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { temaOscuro, temaClaro, Tema } from './estilos';

type ContextoTema = {
  tema: Tema;
  oscuro: boolean;
  alternar: () => void;
};

const Contexto = createContext<ContextoTema>({ tema: temaClaro, oscuro: false, alternar: () => {} });

const CLAVE_ALMACENAMIENTO = 'novabank.tema';

export function ProveedorTema({ children }: { children: React.ReactNode }) {
  const [oscuro, setOscuro] = useState(Appearance.getColorScheme() === 'dark');

  useEffect(() => {
    AsyncStorage.getItem(CLAVE_ALMACENAMIENTO).then((valor) => {
      if (valor === 'dark') setOscuro(true);
      if (valor === 'light') setOscuro(false);
    });
  }, []);

  const alternar = () => {
    setOscuro((actual) => {
      const siguiente = !actual;
      AsyncStorage.setItem(CLAVE_ALMACENAMIENTO, siguiente ? 'dark' : 'light');
      return siguiente;
    });
  };

  const tema = useMemo(() => (oscuro ? temaOscuro : temaClaro), [oscuro]);

  return <Contexto.Provider value={{ tema, oscuro, alternar }}>{children}</Contexto.Provider>;
}

export const usarTema = () => useContext(Contexto);
