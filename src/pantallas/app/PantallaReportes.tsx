import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Pantalla from '../../componentes/Pantalla';
import { BotonVolver, TituloPantalla } from '../../componentes/Primitivas';
import { BotonFantasma, BotonPrimario } from '../../componentes/Botones';
import Icono from '../../componentes/Icono';
import { usarTema } from '../../tema/ContextoTema';
import { fuentes } from '../../tema/estilos';
import { usarEstadoApp } from '../../estado/ContextoEstadoApp';
import { ApiError, statementsApi } from '../../libreria/api';
import { usarIdioma } from '../../i18n/ContextoIdioma';

function ultimos6Meses(locale: string) {
  const ahora = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const etiqueta = fecha.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    return { month: fecha.getMonth() + 1, year: fecha.getFullYear(), label: etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1) };
  });
}

export default function PantallaReportes() {
  const nav = useNavigation();
  const { tema } = usarTema();
  const { t, language } = usarIdioma();
  const { usuario } = usarEstadoApp();

  const meses = useMemo(() => ultimos6Meses(language === 'es' ? 'es-PE' : 'en-US'), [language]);
  const [seleccionado, setSeleccionado] = useState(meses[0]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const enviar = async () => {
    if (enviando) return;
    setEnviando(true);
    setError(null);
    try {
      await statementsApi.send(seleccionado.month, seleccionado.year);
      setEnviado(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo enviar el estado de cuenta. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <Pantalla bg={tema.fondo}>
        <BotonVolver onPress={() => nav.goBack()} />
        <View style={{ alignItems: 'center', paddingTop: 60 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: tema.fondoOk, alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="mark_email_read" size={44} color={tema.verde} />
          </View>
          <Text style={{ marginTop: 20, fontFamily: fuentes.heading, fontSize: 22, letterSpacing: -0.7, color: tema.tinta }}>{t('reports.sentTitle')}</Text>
          <Text style={{ marginTop: 9, textAlign: 'center', fontFamily: fuentes.body, fontSize: 13.5, lineHeight: 19, color: tema.medio, maxWidth: 280 }}>
            {t('reports.sentBody', { email: usuario.email })}
          </Text>
          <BotonFantasma label={t('reports.requestAnother')} onPress={() => setEnviado(false)} style={{ marginTop: 22, width: 200 }} />
        </View>
      </Pantalla>
    );
  }

  return (
    <Pantalla bg={tema.fondo}>
      <BotonVolver onPress={() => nav.goBack()} />
      <TituloPantalla title={t('reports.title')} note={t('reports.note')} />

      <View style={{ marginTop: 20, borderRadius: 20, backgroundColor: tema.superficie, borderWidth: 1, borderColor: tema.linea, padding: 22 }}>
        <Text style={{ fontFamily: fuentes.headingBold, fontSize: 13.5, color: tema.tinta }}>{t('reports.chooseMonth')}</Text>
        <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
          {meses.map((mes) => {
            const activo = seleccionado.month === mes.month && seleccionado.year === mes.year;
            return (
              <Pressable
                key={`${mes.year}-${mes.month}`}
                onPress={() => setSeleccionado(mes)}
                style={{ width: '47%', height: 48, borderRadius: 13, borderWidth: 1.5, borderColor: activo ? tema.dorado : tema.linea, backgroundColor: activo ? tema.fondoSel : tema.fondo, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 13, color: tema.tinta }}>{mes.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View
          style={{ marginTop: 18, padding: 14, borderRadius: 14, backgroundColor: tema.fondo, flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          <Icono name="mail" size={19} color={tema.dorado} />
          <Text style={{ flex: 1, fontFamily: fuentes.body, fontSize: 12, color: tema.tinta }}>{usuario.email}</Text>
        </View>
      </View>

      {error ? (
        <Text style={{ marginTop: 12, color: '#C2352B', fontFamily: fuentes.bodyBold, fontSize: 12 }}>{error}</Text>
      ) : null}

      <BotonPrimario
        label={enviando ? t('reports.sending') : t('reports.sendToEmail')}
        icon="send"
        onPress={enviar}
        disabled={enviando}
        style={{ marginTop: 18 }}
      />
    </Pantalla>
  );
}
