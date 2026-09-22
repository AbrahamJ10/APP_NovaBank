import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Pantalla from '../../componentes/Pantalla';
import { BotonVolver, CasillasOtp, PasosProgreso } from '../../componentes/Primitivas';
import { BotonPrimario } from '../../componentes/Botones';
import Icono from '../../componentes/Icono';
import { usarTema } from '../../tema/ContextoTema';
import { fuentes } from '../../tema/estilos';
import { mmss, enmascararCorreo } from '../../libreria/formato';
import { ListaParametrosAuth } from '../../navegacion/tipos';
import { usarEstadoApp } from '../../estado/ContextoEstadoApp';
import { verificationApi } from '../../libreria/api';
import { usarIdioma } from '../../i18n/ContextoIdioma';

const ESPERA_REENVIO_S = 60;
// Coincide con la expiración propia del OTP del backend (otp.service.ts,
// OTP_TTL_MS) — el código se acaba de pedir justo antes de que se abriera
// esta pantalla, así que la ventana empieza ahora y se cierra exactamente
// cuando el código deja de ser válido del lado del servidor. No se debe
// dejar que alguien se quede en esta pantalla indefinidamente.
const DURACION_FLUJO_MS = 10 * 60 * 1000;

export default function PantallaOtp() {
  const nav = useNavigation<NativeStackNavigationProp<ListaParametrosAuth>>();
  const { tema } = usarTema();
  const { t } = usarIdioma();
  const { completarRegistro, usuarioPendiente } = usarEstadoApp();
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [espera, setEspera] = useState(ESPERA_REENVIO_S);
  const [limiteFlujo, setLimiteFlujo] = useState(() => Date.now() + DURACION_FLUJO_MS);
  const [ahora, setAhora] = useState(Date.now());
  const refEntrada = useRef<TextInput>(null);

  useEffect(() => {
    if (espera <= 0) return;
    const id = setInterval(() => setEspera((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [espera]);

  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const tiempoRestante = Math.max(0, Math.round((limiteFlujo - ahora) / 1000));

  useEffect(() => {
    if (tiempoRestante > 0) return;
    Alert.alert(t('otp.timeExpiredTitle'), t('otp.timeExpired'), [{ text: t('otp.timeExpiredOk'), onPress: () => nav.goBack() }]);
  }, [tiempoRestante, nav, t]);

  const enviar = async (valor: string) => {
    if (valor.length !== 6 || enviando) return;
    setEnviando(true);
    try {
      const resultado = await completarRegistro(valor);
      if (resultado.ok) {
        setError(false);
        nav.replace('RegisterDone');
      } else {
        setError(true);
        setMensajeError(resultado.message);
        setCodigo('');
      }
    } finally {
      setEnviando(false);
    }
  };

  const reenviar = async () => {
    if (!usuarioPendiente || reenviando || espera > 0) return;
    setReenviando(true);
    try {
      await verificationApi.requestRegisterOtp(usuarioPendiente.email);
      setEspera(ESPERA_REENVIO_S);
      setLimiteFlujo(Date.now() + DURACION_FLUJO_MS);
      setError(false);
      setMensajeError(null);
    } catch {
      setMensajeError(t('otp.resendFail'));
      setError(true);
    } finally {
      setReenviando(false);
    }
  };

  return (
    <Pantalla bg={tema.oscuro ? tema.fondo : '#fff'}>
      <BotonVolver onPress={() => nav.goBack()} />
      <PasosProgreso total={2} current={2} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <Icono name="timer" size={14} color={tiempoRestante <= 60 ? '#C2352B' : tema.suave} />
        <Text style={{ fontFamily: fuentes.bodyMed, fontSize: 11.5, color: tiempoRestante <= 60 ? '#C2352B' : tema.suave }}>
          {t('otp.timeLeft', { time: mmss(tiempoRestante) })}
        </Text>
      </View>

      <View style={{ width: 52, height: 52, borderRadius: 17, backgroundColor: tema.matiz, alignItems: 'center', justifyContent: 'center' }}>
        <Icono name="mail" size={25} color={tema.dorado} />
      </View>
      <Text style={{ marginTop: 20, fontFamily: fuentes.heading, fontSize: 26, color: tema.tinta, letterSpacing: -0.9 }}>{t('otp.title')}</Text>
      <Text style={{ marginTop: 8, fontFamily: fuentes.body, fontSize: 13.5, lineHeight: 19, color: tema.medio }}>
        {t('otp.subtitle')}
        <Text style={{ fontFamily: fuentes.bodyBold, color: tema.tinta }}>{enmascararCorreo(usuarioPendiente?.email ?? '')}</Text>.
      </Text>

      <Pressable onPress={() => refEntrada.current?.focus()} style={{ marginTop: 26 }}>
        <CasillasOtp value={codigo} />
      </Pressable>
      <TextInput
        ref={refEntrada}
        value={codigo}
        onChangeText={(v) => {
          const digitos = v.replace(/\D/g, '').slice(0, 6);
          setCodigo(digitos);
          setError(false);
          if (digitos.length === 6) enviar(digitos);
        }}
        keyboardType="number-pad"
        maxLength={6}
        style={{ position: 'absolute', opacity: 0, height: 0 }}
        autoFocus
      />
      {error ? (
        <Text style={{ marginTop: 10, fontFamily: fuentes.bodyBold, fontSize: 12, color: '#C2352B' }}>
          {mensajeError ?? t('otp.errorDefault')}
        </Text>
      ) : null}

      <View style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: fuentes.body, fontSize: 12.5, color: tema.medio }}>
          {espera > 0 ? (
            <>
              {t('otp.resendIn')}<Text style={{ fontFamily: fuentes.bodyBold, color: tema.dorado }}>{mmss(espera)}</Text>
            </>
          ) : (
            t('otp.canResend')
          )}
        </Text>
        <Pressable disabled={espera > 0 || reenviando} onPress={reenviar}>
          <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 12.5, color: espera > 0 || reenviando ? tema.suave : tema.dorado }}>
            {reenviando ? t('otp.resending') : t('otp.resend')}
          </Text>
        </Pressable>
      </View>

      <BotonPrimario label={enviando ? t('otp.verifying') : t('otp.verify')} onPress={() => enviar(codigo)} disabled={codigo.length !== 6 || enviando} style={{ marginTop: 26 }} />
    </Pantalla>
  );
}
