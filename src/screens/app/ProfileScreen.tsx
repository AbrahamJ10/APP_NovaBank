import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as LocalAuthentication from 'expo-local-authentication';
import Pantalla from '../../components/Pantalla';
import { Insignia, CasillasOtp } from '../../components/Primitivas';
import CampoTexto from '../../components/CampoTexto';
import { BotonPeligroContorno, BotonFantasma, BotonPrimario } from '../../components/Botones';
import HojaInferior from '../../components/HojaInferior';
import Icono from '../../components/Icono';
import SelectorIdioma from '../../components/SelectorIdioma';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { useAppState } from '../../state/AppStateContext';
import { RootStackParamList, TabParamList } from '../../navigation/types';
import { useLanguage } from '../../i18n/LanguageContext';
import { obtenerUltimaCuenta } from '../../lib/tokensSeguros';

type Navegacion = CompositeNavigationProp<NativeStackNavigationProp<RootStackParamList>, BottomTabNavigationProp<TabParamList>>;

export default function ProfileScreen() {
  const nav = useNavigation<Navegacion>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, logout, requestProfileOtp, confirmEmailChange, confirmPhoneChange, changePassword } = useAppState();

  // Refleja la misma verificación de LoginScreen — Face ID aquí significa
  // "el desbloqueo nativo por huella/rostro de este dispositivo de verdad
  // está registrado y puede hacer login rápido de esta cuenta", no alguna
  // configuración separada por cuenta.
  const [faceIdActivo, setFaceIdActivo] = useState(false);
  useEffect(() => {
    Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync(), obtenerUltimaCuenta()])
      .then(([hw, enrolled, remembered]) => setFaceIdActivo(hw && enrolled && !!remembered))
      .catch(() => setFaceIdActivo(false));
  }, []);

  const [editando, setEditando] = useState<{ field: 'email' | 'phone'; label: string } | null>(null);
  const [valor, setValor] = useState('');
  const [codigo, setCodigo] = useState('');
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);
  const [enviandoOtp, setEnviandoOtp] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);
  const refEntrada = useRef<TextInput>(null);

  const [pwAbierto, setPwAbierto] = useState(false);
  const [pwPaso, setPwPaso] = useState<'form' | 'otp' | 'done'>('form');
  const [pwActual, setPwActual] = useState('');
  const [errorPwActual, setErrorPwActual] = useState(false);
  const [pwNueva, setPwNueva] = useState('');
  const [pwConfirmar, setPwConfirmar] = useState('');
  const [pwCodigo, setPwCodigo] = useState('');
  const [pwErrorCodigo, setPwErrorCodigo] = useState<string | null>(null);
  const [pwEnviandoOtp, setPwEnviandoOtp] = useState(false);
  const [pwErrorEnvio, setPwErrorEnvio] = useState<string | null>(null);
  const [pwEnviando, setPwEnviando] = useState(false);
  const refEntradaPw = useRef<TextInput>(null);

  const abrirEdicion = async (campo: 'email' | 'phone', etiqueta: string, actual: string) => {
    setEditando({ field: campo, label: etiqueta });
    setValor(actual);
    setCodigo('');
    setErrorCodigo(null);
    setErrorEnvio(null);
    setEnviandoOtp(true);
    const resultado = await requestProfileOtp();
    setEnviandoOtp(false);
    if (!resultado.ok) setErrorEnvio(resultado.message);
  };

  const enviarCambio = async (v: string) => {
    if (v.length !== 6 || !editando || enviandoCodigo) return;
    setEnviandoCodigo(true);
    setErrorCodigo(null);
    const resultado = editando.field === 'email' ? await confirmEmailChange(valor, v) : await confirmPhoneChange(valor, v);
    setEnviandoCodigo(false);
    if (!resultado.ok) {
      setErrorCodigo(resultado.message);
      setCodigo('');
      return;
    }
    setEditando(null);
  };

  const reglaLargo = pwNueva.length >= 10;
  const reglaNumero = /\d/.test(pwNueva);
  const reglaMayuscula = /[A-Z]/.test(pwNueva);
  const reglaMinuscula = /[a-z]/.test(pwNueva);
  const pwNuevaValida = reglaLargo && reglaNumero && reglaMayuscula && reglaMinuscula;
  const pwConfirmarValida = pwConfirmar.length > 0 && pwConfirmar === pwNueva;

  const cerrarHojaPassword = () => {
    setPwAbierto(false);
    setPwPaso('form');
    setPwActual('');
    setErrorPwActual(false);
    setPwNueva('');
    setPwConfirmar('');
    setPwCodigo('');
    setPwErrorCodigo(null);
    setPwErrorEnvio(null);
  };

  const enviarFormularioPassword = async () => {
    setErrorPwActual(false);
    setPwErrorEnvio(null);
    setPwEnviandoOtp(true);
    const resultado = await requestProfileOtp();
    setPwEnviandoOtp(false);
    if (!resultado.ok) {
      setPwErrorEnvio(resultado.message);
      return;
    }
    setPwPaso('otp');
  };

  const enviarOtpPassword = async (v: string) => {
    if (v.length !== 6 || pwEnviando) return;
    setPwEnviando(true);
    setPwErrorCodigo(null);
    const resultado = await changePassword(pwActual, pwNueva, v);
    setPwEnviando(false);
    if (!resultado.ok) {
      if (resultado.message.includes('contraseña actual')) {
        setPwPaso('form');
        setErrorPwActual(true);
      } else {
        setPwErrorCodigo(resultado.message);
      }
      setPwCodigo('');
      return;
    }
    setPwPaso('done');
  };

  const campos = [
    { label: t('profile.fullName'), value: user.name },
    { label: t('profile.dni'), value: user.dni },
    { label: t('profile.email'), value: user.email, edit: () => abrirEdicion('email', t('profile.emailField'), user.email) },
    { label: t('profile.phone'), value: '+51 ' + user.phone, edit: () => abrirEdicion('phone', t('profile.phoneField'), user.phone) },
  ];

  return (
    <Pantalla bg={theme.bg}>
      <View style={{ alignItems: 'flex-end' }}>
        <SelectorIdioma />
      </View>
      <View style={{ alignItems: 'center', marginTop: 4 }}>
        <View style={{ width: 86, height: 86, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B2340', borderWidth: 2, borderColor: '#C9A227' }}>
          <Text style={{ fontFamily: fonts.heading, fontSize: 30, color: '#fff' }}>{user.initials}</Text>
        </View>
        <Text style={{ marginTop: 14, fontFamily: fonts.heading, fontSize: 19, letterSpacing: -0.4, color: theme.ink }}>{user.name}</Text>
        <Text style={{ marginTop: 4, fontFamily: fonts.body, fontSize: 12, color: theme.soft }}>{t('profile.memberSince', { date: user.memberSince })}</Text>
        <View style={{ marginTop: 12 }}>
          <Insignia label={t('profile.identityVerified')} tone="green" />
        </View>
      </View>

      <View style={{ marginTop: 22, borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, paddingHorizontal: 16 }}>
        {campos.map((campo, i) => (
          <View key={campo.label} style={{ paddingVertical: 14, borderBottomWidth: i < campos.length - 1 ? 1 : 0, borderBottomColor: theme.line, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: theme.soft }}>{campo.label}</Text>
              <Text style={{ marginTop: 3, fontFamily: fonts.bodyBold, fontSize: 13.5, color: theme.ink }}>{campo.value}</Text>
            </View>
            {campo.edit ? (
              <Pressable onPress={campo.edit} hitSlop={8}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: theme.gold }}>{t('profile.edit')}</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      <View style={{ marginTop: 16, borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, paddingHorizontal: 16 }}>
        <FilaPerfil icono="password" etiqueta={t('profile.changePassword')} descripcion={t('profile.changePasswordDesc')} alPresionar={() => setPwAbierto(true)} />
        <FilaPerfil
          icono="fingerprint"
          etiqueta={t('profile.faceId')}
          descripcion={faceIdActivo ? t('profile.faceIdDesc') : t('profile.faceIdDescOff')}
          derecha={faceIdActivo ? <Insignia label={t('profile.active')} tone="green" /> : <Insignia label={t('profile.inactive')} tone="neutral" />}
        />
        <FilaPerfil icono="shield" etiqueta={t('profile.securityCenter')} descripcion={t('profile.securityCenterDesc')} alPresionar={() => nav.navigate('Security')} />
        <FilaPerfil icono="description" etiqueta={t('profile.accountStatement')} descripcion={t('profile.accountStatementDesc')} alPresionar={() => nav.navigate('Reports')} ultimo />
      </View>

      <BotonPeligroContorno label={t('profile.logout')} icon="logout" onPress={logout} style={{ marginTop: 16 }} />

      <HojaInferior visible={!!editando} onShow={() => refEntrada.current?.focus()} onClose={() => setEditando(null)}>
        {editando ? (
          <View>
            <Text style={{ fontFamily: fonts.heading, fontSize: 20, letterSpacing: -0.5, color: theme.ink }}>{t('profile.editField', { field: editando.label })}</Text>
            <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: theme.mid }}>
              {t('profile.criticalField')}
            </Text>
            <View style={{ marginTop: 18 }}>
              <CampoTexto
                value={valor}
                onChangeText={(v) => setValor(editando.field === 'phone' ? v.replace(/\D/g, '').slice(0, 9) : v)}
                autoCapitalize="none"
                keyboardType={editando.field === 'phone' ? 'number-pad' : 'email-address'}
              />
            </View>
            <Pressable onPress={() => refEntrada.current?.focus()} style={{ marginTop: 16 }}>
              <CasillasOtp value={codigo} />
            </Pressable>
            <TextInput
              ref={refEntrada}
              value={codigo}
              keyboardType="number-pad"
              maxLength={6}
              onChangeText={(v) => {
                const digitos = v.replace(/\D/g, '').slice(0, 6);
                setCodigo(digitos);
                setErrorCodigo(null);
                if (digitos.length === 6) enviarCambio(digitos);
              }}
              style={{ position: 'absolute', opacity: 0, height: 0 }}
            />
            {errorEnvio ? (
              <Text style={{ marginTop: 10, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{errorEnvio}</Text>
            ) : errorCodigo ? (
              <Text style={{ marginTop: 8, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{errorCodigo}</Text>
            ) : enviandoOtp ? (
              <Text style={{ marginTop: 10, fontFamily: fonts.body, fontSize: 12, color: theme.soft }}>{t('profile.sendingCode')}</Text>
            ) : null}
            <BotonPrimario
              label={enviandoCodigo ? t('profile.verifying') : t('profile.saveChange')}
              onPress={() => enviarCambio(codigo)}
              disabled={codigo.length !== 6 || enviandoCodigo || enviandoOtp}
              style={{ marginTop: 18 }}
            />
          </View>
        ) : null}
      </HojaInferior>

      <HojaInferior visible={pwAbierto} onClose={cerrarHojaPassword}>
        {pwPaso === 'form' && (
          <View>
            <Text style={{ fontFamily: fonts.heading, fontSize: 20, letterSpacing: -0.5, color: theme.ink }}>{t('profile.changePasswordTitle')}</Text>
            <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: theme.mid }}>
              {t('profile.changePasswordSubtitle')}
            </Text>
            <View style={{ marginTop: 18, gap: 12 }}>
              <CampoTexto
                label={t('profile.currentPassword')}
                icon="lock"
                secureTextEntry
                value={pwActual}
                onChangeText={(v) => {
                  setPwActual(v);
                  setErrorPwActual(false);
                }}
                status={errorPwActual ? 'error' : 'default'}
                hint={errorPwActual ? t('profile.currentPasswordMismatch') : undefined}
              />
              <CampoTexto label={t('profile.newPassword')} icon="lock" secureTextEntry value={pwNueva} onChangeText={setPwNueva} />
              <View style={{ gap: 6 }}>
                <LineaRegla cumple={reglaLargo} etiqueta={t('profile.ruleLen')} />
                <LineaRegla cumple={reglaNumero} etiqueta={t('profile.ruleNum')} />
                <LineaRegla cumple={reglaMayuscula} etiqueta={t('profile.ruleUp')} />
                <LineaRegla cumple={reglaMinuscula} etiqueta={t('profile.ruleLow')} />
              </View>
              <CampoTexto
                label={t('profile.repeatNewPassword')}
                icon="lock"
                secureTextEntry
                value={pwConfirmar}
                onChangeText={setPwConfirmar}
                status={pwConfirmar.length === 0 ? 'default' : pwConfirmarValida ? 'success' : 'error'}
              />
            </View>
            {pwErrorEnvio ? (
              <Text style={{ marginTop: 10, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{pwErrorEnvio}</Text>
            ) : null}
            <BotonPrimario
              label={pwEnviandoOtp ? t('profile.sendingCode') : t('profile.continue')}
              onPress={enviarFormularioPassword}
              disabled={pwActual.length === 0 || !pwNuevaValida || !pwConfirmarValida || pwEnviandoOtp}
              style={{ marginTop: 20 }}
            />
            <BotonFantasma label={t('profile.cancel')} onPress={cerrarHojaPassword} style={{ marginTop: 10 }} />
          </View>
        )}

        {pwPaso === 'otp' && (
          <View>
            <Text style={{ fontFamily: fonts.heading, fontSize: 20, letterSpacing: -0.5, color: theme.ink }}>{t('profile.confirmChangeTitle')}</Text>
            <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, color: theme.mid }}>
              {t('profile.confirmChangeSubtitle')}
            </Text>
            <Pressable onPress={() => refEntradaPw.current?.focus()} style={{ marginTop: 18 }}>
              <CasillasOtp value={pwCodigo} />
            </Pressable>
            <TextInput
              ref={refEntradaPw}
              value={pwCodigo}
              autoFocus
              keyboardType="number-pad"
              maxLength={6}
              onChangeText={(v) => {
                const digitos = v.replace(/\D/g, '').slice(0, 6);
                setPwCodigo(digitos);
                setPwErrorCodigo(null);
                if (digitos.length === 6) enviarOtpPassword(digitos);
              }}
              style={{ position: 'absolute', opacity: 0, height: 0 }}
            />
            {pwErrorCodigo ? <Text style={{ marginTop: 8, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{pwErrorCodigo}</Text> : null}
            <BotonPrimario
              label={pwEnviando ? t('profile.verifying') : t('profile.confirm')}
              onPress={() => enviarOtpPassword(pwCodigo)}
              disabled={pwCodigo.length !== 6 || pwEnviando}
              style={{ marginTop: 18 }}
            />
          </View>
        )}

        {pwPaso === 'done' && (
          <View style={{ alignItems: 'center', paddingVertical: 10 }}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: theme.okBg, alignItems: 'center', justifyContent: 'center' }}>
              <Icono name="check" size={36} color={theme.green} />
            </View>
            <Text style={{ marginTop: 16, fontFamily: fonts.heading, fontSize: 19, color: theme.ink }}>{t('profile.passwordUpdated')}</Text>
            <Text style={{ marginTop: 6, textAlign: 'center', fontFamily: fonts.body, fontSize: 12.5, color: theme.mid }}>
              {t('profile.passwordUpdatedBody')}
            </Text>
            <BotonPrimario label={t('profile.done')} onPress={cerrarHojaPassword} style={{ marginTop: 18, width: '100%' }} />
          </View>
        )}
      </HojaInferior>
    </Pantalla>
  );
}

function LineaRegla({ cumple, etiqueta }: { cumple: boolean; etiqueta: string }) {
  const { theme } = useTheme();
  const color = cumple ? theme.green : theme.soft;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <Icono name={cumple ? 'check_circle' : 'radio_button_unchecked'} size={15} color={color} />
      <Text style={{ fontFamily: fonts.bodyMed, fontSize: 11.5, color }}>{etiqueta}</Text>
    </View>
  );
}

function FilaPerfil({ icono, etiqueta, descripcion, alPresionar, derecha, ultimo }: { icono: string; etiqueta: string; descripcion: string; alPresionar?: () => void; derecha?: React.ReactNode; ultimo?: boolean }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={alPresionar}
      style={({ pressed }) => [
        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: ultimo ? 0 : 1, borderBottomColor: theme.line },
        pressed && alPresionar ? { opacity: 0.6 } : null,
      ]}
    >
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icono name={icono} size={19} color={theme.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: theme.ink }}>{etiqueta}</Text>
        <Text style={{ marginTop: 2, fontFamily: fonts.body, fontSize: 11, color: theme.soft }}>{descripcion}</Text>
      </View>
      {derecha ?? (alPresionar ? <Icono name="chevron_right" size={18} color="#A6B1BD" /> : null)}
    </Pressable>
  );
}
