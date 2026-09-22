import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, translations } from './translations';

type ContextoIdioma = {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggle: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const CLAVE_ALMACENAMIENTO = 'novabank.language';

const Contexto = createContext<ContextoIdioma | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    AsyncStorage.getItem(CLAVE_ALMACENAMIENTO).then((valor) => {
      if (valor === 'es' || valor === 'en') setLanguageState(valor);
    });
  }, []);

  const setLanguage = (idioma: Language) => {
    setLanguageState(idioma);
    AsyncStorage.setItem(CLAVE_ALMACENAMIENTO, idioma).catch(() => {});
  };

  const toggle = () => setLanguage(language === 'es' ? 'en' : 'es');

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string | number>) => {
      let texto = translations[language][key] ?? translations.es[key] ?? key;
      if (vars) {
        for (const [clave, valor] of Object.entries(vars)) {
          texto = texto.replace(`{${clave}}`, String(valor));
        }
      }
      return texto;
    };
  }, [language]);

  return <Contexto.Provider value={{ language, setLanguage, toggle, t }}>{children}</Contexto.Provider>;
}

export function useLanguage() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useLanguage must be used within LanguageProvider');
  return contexto;
}
