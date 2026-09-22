import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as LocalAuthentication from 'expo-local-authentication';
import Pantalla from '../../componentes/Pantalla';
import CampoTexto from '../../componentes/CampoTexto';
import { BotonPrimario } from '../../componentes/Botones';
import Icono from '../../componentes/Icono';
import { MarcaLogo } from '../../componentes/Logo';
import SelectorIdioma from '../../componentes/SelectorIdioma';
import { usarTema } from '../../tema/ContextoTema';
import { fuentes } from '../../tema/estilos';
import { mmss } from '../../libreria/formato';
import { ListaParametrosAuth } from '../../navegacion/tipos';
import { usarEstadoApp } from '../../estado/ContextoEstadoApp';
import { usarIdioma } from '../../i18n/ContextoIdioma';
import { limpiarUltimaCuenta, obtenerUltimaCuenta } from '../../libreria/tokensSeguros';

export default function PantallaIniciarSesion() {
  const nav = useNavigation<NativeStackNavigationProp<ListaParametrosAuth>>();
  const { tema } = usarTema();
  const { t } = usarIdioma();
  const { iniciarSesion, bloqueadoHasta, tiempoBloqueoRestante, restaurarSesion } = usarEstadoApp();

  const [recordado, setRecordado] = useState<{ email: string; fullName: string } | null | undefined>(undefined);
  const [biometriaDisponible, setBiometriaDisponible] = useState(false);
  const [verificandoBiometria, setVerificandoBiometria] = useState(false);
  const [mensajeBiometria, setMensajeBiometria] = useState<string | null>(null);

  const [identificador, setIdentificador] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [contrasenaVisible, setContrasenaVisible] = useState(false);
  const [error, setError] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const bloqueado = !!bloqueadoHasta && tiempoBloqueoRestante > 0;

  useEffect(() => {
    obtenerUltimaCuenta().then(setRecordado);
    Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()])
      .then(([hw, inscrita]) => setBiometriaDisponible(hw && inscrita))
      .catch(() => setBiometriaDisponible(false));
  }, []);

  const accesoRapido = !!recordado;
  const correo = accesoRapido ? recordado!.email : identificador;

  const enviar = async () => {
    if (enviando) return;
    setEnviando(true);
    try {
      const res = await iniciarSesion(correo, contrasena);
      if (!res.ok) {
        setError(true);
        setMensajeError('message' in res ? res.message ?? null : null);
      } else {
        setError(false);
        setMensajeError(null);
      }
    } finally {
      setEnviando(false);
    }
  };

  const intentarBiometria = async () => {
    if (verificandoBiometria) return;
    setVerificandoBiometria(true);
    setMensajeBiometria(null);
    try {
      if (!biometriaDisponible) {
        setMensajeBiometria(t('login.bioUnavailable'));
        return;
      }
      const resultado = await LocalAuthentication.authenticateAsync({
        promptMessage: t('login.bioPrompt'),
        cancelLabel: t('login.bioCancel'),
      });
      if (!resultado.success) return;
      // Un desbloqueo exitoso del dispositivo solo prueba que es el dueño
      // de este celular — igual tiene que combinarse con una sesión que de
      // verdad sea válida, igual que la restauración silenciosa en el
      // arranque en frío.
      const restaurada = await restaurarSesion();
      if (!restaurada) setMensajeBiometria(t('login.bioSessionExpired'));
    } finally {
      setVerificandoBiometria(false);
    }
  };

  return (
    <Pantalla bg={tema.oscuro ? tema.fondo : '#fff'}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <MarcaLogo size={52} />
        <SelectorIdioma />
      </View>
      <Text style={{ marginTop: 14, fontFamily: fuentes.displaySemi, fontSize: 15, letterSpacing: 3, textTransform: 'uppercase', color: tema.dorado }}>
        NovaBank
      </Text>
      <Text style={{ marginTop: 16, fontFamily: fuentes.heading, fontSize: 28, lineHeight: 32, color: tema.tinta, letterSpacing: -1 }}>
        {accesoRapido ? (
          <>
            {t('login.greeting')}
            {'\n'}
            {recordado!.fullName.split(' ')[0]}.
          </>
        ) : (
          t('login.greeting')
        )}
      </Text>
      <Text style={{ marginTop: 8, fontFamily: fuentes.body, fontSize: 13.5, color: tema.medio }}>{t('login.subtitle')}</Text>

      {bloqueado ? (
        <View style={{ marginTop: 20, borderRadius: 16, backgroundColor: '#FFF4F3', borderWidth: 1, borderColor: '#F6CFCA', padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icono name="lock_clock" size={18} color="#C2352B" />
            <Text style={{ fontFamily: fuentes.headingBold, fontSize: 13.5, color: '#C2352B' }}>{t('login.blockedTitle')}</Text>
          </View>
          <Text style={{ marginTop: 7, fontFamily: fuentes.body, fontSize: 12, lineHeight: 17, color: '#8A4741' }}>
            {t('login.blockedBody')}
          </Text>
          <Text style={{ marginTop: 10, fontFamily: fuentes.heading, fontSize: 28, color: '#C2352B', letterSpacing: -1 }}>{mmss(tiempoBloqueoRestante)}</Text>
          <Pressable onPress={() => nav.navigate('Recover')}>
            <Text style={{ marginTop: 8, fontFamily: fuentes.bodyBold, fontSize: 12, color: '#C2352B' }}>{t('login.recoverNow')}</Text>
          </Pressable>
        </View>
      ) : error ? (
        <View style={{ marginTop: 20, borderRadius: 14, backgroundColor: '#FFF4F3', borderWidth: 1, borderColor: '#F6CFCA', padding: 14, flexDirection: 'row', gap: 10 }}>
          <Icono name="error" size={18} color="#C2352B" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fuentes.headingBold, fontSize: 12.5, color: '#C2352B' }}>{t('login.errorTitle')}</Text>
            <Text style={{ marginTop: 3, fontFamily: fuentes.body, fontSize: 11.5, color: '#8A4741' }}>{mensajeError ?? t('login.errorDefault')}</Text>
          </View>
        </View>
      ) : mensajeBiometria ? (
        <View style={{ marginTop: 20, borderRadius: 14, backgroundColor: tema.matiz, padding: 14, flexDirection: 'row', gap: 10 }}>
          <Icono name="fingerprint" size={18} color={tema.dorado} />
          <Text style={{ flex: 1, fontFamily: fuentes.body, fontSize: 12, lineHeight: 17, color: tema.medio }}>{mensajeBiometria}</Text>
        </View>
      ) : null}

      {!bloqueado && (
        <View style={{ marginTop: 22, gap: 14 }}>
          {!accesoRapido && (
            <CampoTexto label={t('login.email')} icon="person" placeholder="tucorreo@gmail.com" autoCapitalize="none" value={identificador} onChangeText={setIdentificador} />
          )}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }}>
              <Text style={{ fontFamily: fuentes.headingSemi, fontSize: 12, color: tema.medio }}>{t('login.password')}</Text>
              <Pressable onPress={() => nav.navigate('Recover')}>
                <Text style={{ fontFamily: fuentes.headingSemi, fontSize: 12, color: tema.dorado }}>{t('login.forgot')}</Text>
              </Pressable>
            </View>
            <CampoTexto
              placeholder={t('login.passwordPlaceholder')}
              icon="lock"
              secureTextEntry={!contrasenaVisible}
              value={contrasena}
              onChangeText={setContrasena}
              rightIcon={contrasenaVisible ? 'visibility_off' : 'visibility'}
              onRightIconPress={() => setContrasenaVisible((v) => !v)}
            />
          </View>
        </View>
      )}

      {!bloqueado && <BotonPrimario label={enviando ? t('login.submitting') : t('login.submit')} disabled={enviando} onPress={enviar} style={{ marginTop: 22 }} />}

      {accesoRapido && (
        <Pressable
          onPress={() => {
            limpiarUltimaCuenta().catch(() => {});
            setRecordado(null);
            setIdentificador('');
            setContrasena('');
          }}
          style={{ marginTop: 14, alignSelf: 'center' }}
        >
          <Text style={{ fontFamily: fuentes.body, fontSize: 12.5, color: tema.medio }}>
            {t('login.notYou')}
            <Text style={{ fontFamily: fuentes.bodyBold, color: tema.dorado }}>{t('login.useOtherAccount')}</Text>
          </Text>
        </Pressable>
      )}

      {accesoRapido && (
        <Pressable onPress={intentarBiometria} disabled={verificandoBiometria} style={{ marginTop: 26, alignSelf: 'center', alignItems: 'center' }}>
          <View
            style={{
              width: 92,
              height: 92,
              borderRadius: 30,
              backgroundColor: tema.oscuro ? tema.matiz : '#EDF2F8',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {verificandoBiometria ? <ActivityIndicator color={tema.dorado} /> : <Icono name="fingerprint" size={50} color={tema.dorado} />}
          </View>
          <Text style={{ marginTop: 12, fontFamily: fuentes.headingBold, fontSize: 13.5, color: tema.tinta }}>{t('login.faceId')}</Text>
          <Text style={{ marginTop: 4, fontFamily: fuentes.body, fontSize: 11.5, color: tema.suave }}>{t('login.faceIdSub')}</Text>
        </Pressable>
      )}
    </Pantalla>
  );
}
