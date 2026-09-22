import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Pantalla from '../../components/Pantalla';
import { BotonVolver, CasillasOtp } from '../../components/Primitivas';
import CampoTexto from '../../components/CampoTexto';
import { BotonPrimario } from '../../components/Botones';
import Icono from '../../components/Icono';
import { usarTema } from '../../theme/ContextoTema';
import { fuentes } from '../../theme/estilos';
import { mmss } from '../../lib/formato';
import { ListaParametrosAuth } from '../../navigation/tipos';
import { usarEstadoApp } from '../../state/ContextoEstadoApp';
import { usarIdioma } from '../../i18n/ContextoIdioma';
import { ApiError, authApi } from '../../lib/api';

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// El "Datos inválidos" (400) genérico del backend cubre cualquier falla de
// validación de Zod — esto extrae el mensaje específico del campo cuando
// existe, para que un desajuste entre las reglas de esta pantalla y las
// del backend nunca sea un callejón sin salida para quien lo encuentre.
function describirErrorApi(error: unknown, reserva: string): string {
  if (!(error instanceof ApiError)) return reserva;
  const erroresCampo = (error.details as any)?.fieldErrors as Record<string, string[]> | undefined;
  const primerCampo = erroresCampo && Object.values(erroresCampo).find((msgs) => msgs?.length);
  return primerCampo?.[0] ?? error.message ?? reserva;
}
// Coincide con la expiración propia del OTP del backend (otp.service.ts,
// OTP_TTL_MS) — una vez que se pide un código, toda la ventana de "ingresa
// el código + pon la nueva contraseña" se cierra en el mismo momento en
// que el código deja de ser válido del lado del servidor.
const DURACION_FLUJO_MS = 10 * 60 * 1000;

export default function PantallaRecuperar() {
  const nav = useNavigation<NativeStackNavigationProp<ListaParametrosAuth>>();
  const { theme } = usarTema();
  const { t } = usarIdioma();
  const { iniciarRecuperacion, otpRestante, reenviarOtp } = usarEstadoApp();

  const [paso, setPaso] = useState(1);
  const [identificador, setIdentificador] = useState('');
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [errorConfirmacion, setErrorConfirmacion] = useState<string | null>(null);
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [repetirContrasena, setRepetirContrasena] = useState('');
  const [contrasenaVisible, setContrasenaVisible] = useState(false);
  const [repetirVisible, setRepetirVisible] = useState(false);
  const [limiteFlujo, setLimiteFlujo] = useState<number | null>(null);
  const [ahora, setAhora] = useState(Date.now());
  const refEntrada = useRef<TextInput>(null);

  const correo = identificador.trim().toLowerCase();

  // Una vez que un código sale, se limita cuánto tiempo alguien puede
  // quedarse en esta pantalla con un restablecimiento pendiente activo —
  // solo avanza mientras de verdad sea relevante.
  useEffect(() => {
    if (!limiteFlujo || (paso !== 2 && paso !== 3)) return;
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [limiteFlujo, paso]);

  const tiempoRestante = limiteFlujo ? Math.max(0, Math.round((limiteFlujo - ahora) / 1000)) : 0;

  useEffect(() => {
    if (!limiteFlujo || (paso !== 2 && paso !== 3)) return;
    if (tiempoRestante > 0) return;
    setLimiteFlujo(null);
    setCodigo('');
    setNuevaContrasena('');
    setRepetirContrasena('');
    setErrorEnvio(t('recover.timeExpired'));
    setPaso(1);
  }, [tiempoRestante, limiteFlujo, paso, t]);

  const reglaLargo = nuevaContrasena.length >= 10;
  const reglaNumero = /\d/.test(nuevaContrasena);
  const reglaMayuscula = /[A-Z]/.test(nuevaContrasena);
  const reglaMinuscula = /[a-z]/.test(nuevaContrasena);
  const contrasenaOk = reglaLargo && reglaNumero && reglaMayuscula && reglaMinuscula;
  const repetirOk = repetirContrasena.length > 0 && repetirContrasena === nuevaContrasena;

  const enviarCodigo = async () => {
    if (enviando) return;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      await authApi.requestPasswordReset(correo);
      iniciarRecuperacion(correo);
      setLimiteFlujo(Date.now() + DURACION_FLUJO_MS);
      setPaso(2);
    } catch (error) {
      setErrorEnvio(describirErrorApi(error, t('recover.sendError')));
    } finally {
      setEnviando(false);
    }
  };

  const confirmarRestablecimiento = async () => {
    if (confirmando) return;
    setConfirmando(true);
    setErrorConfirmacion(null);
    try {
      await authApi.confirmPasswordReset({ email: correo, code: codigo, newPassword: nuevaContrasena });
      setPaso(4);
    } catch (error) {
      setErrorConfirmacion(describirErrorApi(error, t('recover.confirmError')));
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <Pantalla bg={theme.dark ? theme.bg : '#fff'}>
      <BotonVolver
        onPress={() => {
          if (paso === 1) {
            nav.goBack();
            return;
          }
          if (paso === 2) setLimiteFlujo(null);
          setPaso((s) => s - 1);
        }}
      />
      <View style={{ flexDirection: 'row', gap: 5, marginBottom: 12 }}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ height: 4, flex: 1, borderRadius: 2, backgroundColor: i <= paso ? theme.gold : theme.line }} />
        ))}
      </View>
      {(paso === 2 || paso === 3) && limiteFlujo ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Icono name="timer" size={14} color={tiempoRestante <= 60 ? '#C2352B' : theme.soft} />
          <Text style={{ fontFamily: fuentes.bodyMed, fontSize: 11.5, color: tiempoRestante <= 60 ? '#C2352B' : theme.soft }}>
            {t('recover.timeLeft', { time: mmss(tiempoRestante) })}
          </Text>
        </View>
      ) : null}

      {paso === 1 && (
        <View>
          <InsigniaIcono name="lock_reset" />
          <Text style={estilos(theme).title}>{t('recover.title1')}</Text>
          <Text style={estilos(theme).sub}>{t('recover.sub1')}</Text>
          <View style={{ marginTop: 24 }}>
            <CampoTexto
              label={t('recover.email')}
              icon="person"
              autoCapitalize="none"
              keyboardType="email-address"
              value={identificador}
              onChangeText={(v) => {
                setIdentificador(v);
                setErrorEnvio(null);
              }}
            />
          </View>
          {errorEnvio ? (
            <Text style={{ marginTop: 10, color: '#C2352B', fontFamily: fuentes.bodyBold, fontSize: 12 }}>{errorEnvio}</Text>
          ) : null}
          <BotonPrimario
            label={enviando ? t('recover.sending') : t('recover.sendCode')}
            disabled={!REGEX_CORREO.test(correo) || enviando}
            onPress={enviarCodigo}
            style={{ marginTop: 22 }}
          />
          <View style={{ marginTop: 26, padding: 16, borderRadius: 16, backgroundColor: theme.tint, flexDirection: 'row', gap: 11 }}>
            <Icono name="shield" size={19} color={theme.gold} />
            <Text style={{ flex: 1, fontFamily: fuentes.body, fontSize: 12, lineHeight: 17, color: theme.mid }}>
              {t('recover.safetyNote')}
            </Text>
          </View>
        </View>
      )}

      {paso === 2 && (
        <View>
          <InsigniaIcono name="sms" />
          <Text style={estilos(theme).title}>{t('recover.title2')}</Text>
          <Text style={estilos(theme).sub}>{t('recover.sub2')}</Text>
          <Pressable onPress={() => refEntrada.current?.focus()} style={{ marginTop: 24 }}>
            <CasillasOtp value={codigo} />
          </Pressable>
          <TextInput
            ref={refEntrada}
            value={codigo}
            onChangeText={(v) => {
              const digitos = v.replace(/\D/g, '').slice(0, 6);
              setCodigo(digitos);
              if (digitos.length === 6) setPaso(3);
            }}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            style={{ position: 'absolute', opacity: 0, height: 0 }}
          />
          <Text style={{ marginTop: 16, fontFamily: fuentes.body, fontSize: 12.5, color: theme.mid }}>
            {otpRestante > 0 ? (
              <>
                {t('recover.resendIn')}<Text style={{ fontFamily: fuentes.bodyBold, color: theme.gold }}>{mmss(otpRestante)}</Text>
              </>
            ) : (
              <Text
                onPress={() => {
                  authApi.requestPasswordReset(correo).catch(() => {});
                  reenviarOtp();
                  setLimiteFlujo(Date.now() + DURACION_FLUJO_MS);
                }}
                style={{ fontFamily: fuentes.bodyBold, color: theme.gold }}
              >
                {t('recover.resend')}
              </Text>
            )}
          </Text>
        </View>
      )}

      {paso === 3 && (
        <View>
          <InsigniaIcono name="key" />
          <Text style={estilos(theme).title}>{t('recover.title3')}</Text>
          <Text style={estilos(theme).sub}>{t('recover.sub3')}</Text>
          <View style={{ marginTop: 22, gap: 12 }}>
            <CampoTexto
              label={t('recover.newPassword')}
              icon="lock"
              secureTextEntry={!contrasenaVisible}
              value={nuevaContrasena}
              onChangeText={setNuevaContrasena}
              rightIcon={contrasenaVisible ? 'visibility_off' : 'visibility'}
              onRightIconPress={() => setContrasenaVisible((v) => !v)}
            />
            <View style={{ gap: 6 }}>
              <LineaRegla ok={reglaLargo} label={t('recover.ruleLen')} />
              <LineaRegla ok={reglaNumero} label={t('recover.ruleNum')} />
              <LineaRegla ok={reglaMayuscula} label={t('recover.ruleUp')} />
              <LineaRegla ok={reglaMinuscula} label={t('recover.ruleLow')} />
            </View>
            <CampoTexto
              label={t('recover.repeatPassword')}
              icon="lock"
              secureTextEntry={!repetirVisible}
              value={repetirContrasena}
              onChangeText={setRepetirContrasena}
              status={repetirContrasena.length === 0 ? 'default' : repetirOk ? 'success' : 'error'}
              rightIcon={repetirVisible ? 'visibility_off' : 'visibility'}
              onRightIconPress={() => setRepetirVisible((v) => !v)}
            />
          </View>
          {errorConfirmacion ? (
            <Text style={{ marginTop: 10, color: '#C2352B', fontFamily: fuentes.bodyBold, fontSize: 12 }}>{errorConfirmacion}</Text>
          ) : null}
          <BotonPrimario
            label={confirmando ? t('recover.confirming') : t('recover.savePassword')}
            disabled={!contrasenaOk || !repetirOk || confirmando}
            onPress={confirmarRestablecimiento}
            style={{ marginTop: 22 }}
          />
        </View>
      )}

      {paso === 4 && (
        <View style={{ alignItems: 'center', paddingTop: 44 }}>
          <View style={{ width: 82, height: 82, borderRadius: 41, backgroundColor: '#EAF9F1', alignItems: 'center', justifyContent: 'center' }}>
            <Icono name="check" size={44} color="#21A26B" />
          </View>
          <Text style={[estilos(theme).title, { marginTop: 22, textAlign: 'center' }]}>{t('recover.title4')}</Text>
          <Text style={[estilos(theme).sub, { textAlign: 'center' }]}>{t('recover.sub4')}</Text>
          <BotonPrimario label={t('recover.signIn')} onPress={() => nav.replace('Login')} style={{ marginTop: 26, width: '100%' }} />
        </View>
      )}
    </Pantalla>
  );
}

function InsigniaIcono({ name }: { name: string }) {
  const { theme } = usarTema();
  return (
    <View style={{ width: 52, height: 52, borderRadius: 17, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}>
      <Icono name={name} size={25} color={theme.gold} />
    </View>
  );
}

function LineaRegla({ ok, label }: { ok: boolean; label: string }) {
  const { theme } = usarTema();
  const color = ok ? '#21A26B' : theme.soft;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <Icono name={ok ? 'check_circle' : 'radio_button_unchecked'} size={15} color={color} />
      <Text style={{ fontFamily: fuentes.bodyMed, fontSize: 11.5, color }}>{label}</Text>
    </View>
  );
}

const estilos = (theme: any) => ({
  title: { marginTop: 20, fontFamily: fuentes.heading, fontSize: 26, lineHeight: 30, color: theme.ink, letterSpacing: -0.9 },
  sub: { marginTop: 8, fontFamily: fuentes.body, fontSize: 13.5, lineHeight: 19, color: theme.mid },
});
