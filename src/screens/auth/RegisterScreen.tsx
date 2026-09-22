import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Screen from '../../components/Screen';
import { BackButton, ProgressSteps } from '../../components/Primitives';
import TextField from '../../components/TextField';
import { PrimaryButton } from '../../components/Buttons';
import Icon from '../../components/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { AuthStackParamList } from '../../navigation/types';
import { useAppState } from '../../state/AppStateContext';
import { useLanguage } from '../../i18n/LanguageContext';

function cumpleRegla(regex: RegExp, valor: string) {
  return regex.test(valor);
}

export default function RegisterScreen() {
  const nav = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { beginRegister, scannedDni, setScannedDni } = useAppState();

  // Vienen del escaneo del DNI/consulta a RENIEC hecha antes en el flujo —
  // solo lectura, el usuario nunca los escribe.
  const [nombres, setNombres] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [dni, setDni] = useState('');

  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [contrasenaVisible, setContrasenaVisible] = useState(false);
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [confirmarContrasenaVisible, setConfirmarContrasenaVisible] = useState(false);
  const [aceptado, setAceptado] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (scannedDni) {
        if (scannedDni.dni) setDni(scannedDni.dni);
        if (scannedDni.nombres) setNombres(scannedDni.nombres);
        if (scannedDni.apellidoPaterno) setApellidoPaterno(scannedDni.apellidoPaterno);
        if (scannedDni.apellidoMaterno) setApellidoMaterno(scannedDni.apellidoMaterno);
        setScannedDni(null);
      }
    }, [scannedDni])
  );

  const correoValido = cumpleRegla(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, correo);
  const telefonoValido = cumpleRegla(/^\d{9}$/, telefono);
  const identidadLista = nombres.length > 0 && apellidoPaterno.length > 0 && /^\d{8}$/.test(dni);

  const reglaLargo = contrasena.length >= 10;
  const reglaNumero = /\d/.test(contrasena);
  const reglaMayuscula = /[A-Z]/.test(contrasena);
  const reglaMinuscula = /[a-z]/.test(contrasena);
  const puntaje = [reglaLargo, reglaNumero, reglaMayuscula, reglaMinuscula].filter(Boolean).length;
  const fortaleza =
    puntaje <= 1 ? { label: puntaje === 0 ? '' : t('register.strengthWeak'), color: '#C2352B', pct: `${puntaje * 25}%` } :
    puntaje === 2 ? { label: t('register.strengthMedium'), color: '#B07D07', pct: '50%' } :
    puntaje === 3 ? { label: t('register.strengthGood'), color: '#B07D07', pct: '75%' } :
    { label: t('register.strengthStrong'), color: '#21A26B', pct: '100%' };

  const confirmacionValida = confirmarContrasena.length > 0 && confirmarContrasena === contrasena;
  const puedeContinuar = identidadLista && correoValido && telefonoValido && puntaje === 4 && confirmacionValida && aceptado;

  const alContinuar = () => {
    const nombreCompleto = [nombres, apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ');
    beginRegister({ name: nombreCompleto, email: correo, dni, phone: telefono, password: contrasena });
    nav.navigate('RegisterFace');
  };

  return (
    <Screen bg={theme.dark ? theme.bg : '#fff'}>
      <BackButton onPress={() => nav.goBack()} />
      <ProgressSteps total={2} current={1} />
      <View>
        <Text style={{ fontFamily: fonts.heading, fontSize: 26, color: theme.ink, letterSpacing: -0.9 }}>{t('register.title')}</Text>
        <Text style={{ marginTop: 7, fontFamily: fonts.body, fontSize: 13.5, color: theme.mid }}>{t('register.step')}</Text>
      </View>

      <View style={{ marginTop: 22, gap: 15 }}>
        <TextField label={t('register.names')} icon="person" value={nombres} editable={false} />
        <TextField label={t('register.firstLastName')} icon="badge" value={apellidoPaterno} editable={false} />
        <TextField label={t('register.secondLastName')} icon="badge" value={apellidoMaterno} editable={false} />
        <TextField label={t('register.dni')} icon="fingerprint" value={dni} editable={false} status="success" hint={t('register.verifiedReniec')} />

        <TextField
          label={t('register.email')}
          icon="mail"
          placeholder="tucorreo@gmail.com"
          value={correo}
          onChangeText={setCorreo}
          autoCapitalize="none"
          keyboardType="email-address"
          status={correo.length === 0 ? 'default' : correoValido ? 'success' : 'error'}
        />
        <TextField
          label={t('register.phone')}
          icon="call"
          placeholder="987 214 550"
          value={telefono}
          onChangeText={(v) => setTelefono(v.replace(/\D/g, '').slice(0, 9))}
          keyboardType="phone-pad"
          status={telefono.length === 0 ? 'default' : telefonoValido ? 'success' : 'error'}
        />
        <View>
          <TextField
            label={t('register.password')}
            icon="lock"
            placeholder={t('register.passwordPlaceholder')}
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry={!contrasenaVisible}
            rightIcon={contrasenaVisible ? 'visibility_off' : 'visibility'}
            onRightIconPress={() => setContrasenaVisible((v) => !v)}
          />
          <View style={{ marginTop: 10, gap: 6 }}>
            <LineaRegla ok={reglaLargo} label={t('register.ruleLen')} />
            <LineaRegla ok={reglaNumero} label={t('register.ruleNum')} />
            <LineaRegla ok={reglaMayuscula} label={t('register.ruleUp')} />
            <LineaRegla ok={reglaMinuscula} label={t('register.ruleLow')} />
          </View>
          <View style={{ marginTop: 12, height: 6, borderRadius: 3, backgroundColor: theme.line, overflow: 'hidden' }}>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: fortaleza.color, width: fortaleza.pct as any }} />
          </View>
          {fortaleza.label ? <Text style={{ marginTop: 6, fontFamily: fonts.bodyBold, fontSize: 11.5, color: fortaleza.color }}>{fortaleza.label}</Text> : null}
        </View>

        <TextField
          label={t('register.confirmPassword')}
          icon="lock"
          placeholder={t('register.confirmPasswordPlaceholder')}
          value={confirmarContrasena}
          onChangeText={setConfirmarContrasena}
          secureTextEntry={!confirmarContrasenaVisible}
          rightIcon={confirmarContrasenaVisible ? 'visibility_off' : 'visibility'}
          onRightIconPress={() => setConfirmarContrasenaVisible((v) => !v)}
          status={confirmarContrasena.length === 0 ? 'default' : confirmacionValida ? 'success' : 'error'}
          hint={confirmarContrasena.length > 0 && !confirmacionValida ? t('register.passwordMismatch') : undefined}
        />
      </View>

      <Pressable onPress={() => setAceptado((a) => !a)} style={{ marginTop: 22, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            backgroundColor: aceptado ? '#133A63' : 'transparent',
            borderWidth: aceptado ? 0 : 1.5,
            borderColor: theme.line,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {aceptado ? <Icon name="check" size={15} color="#fff" /> : null}
        </View>
        <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: theme.mid }}>
          {t('register.termsPrefix')}<Text style={{ color: '#C9A227' }}>{t('register.termsLink')}</Text>{t('register.termsSuffix')}
        </Text>
      </Pressable>

      <PrimaryButton label={t('register.continue')} iconRight="arrow_forward" disabled={!puedeContinuar} onPress={alContinuar} style={{ marginTop: 22 }} />
    </Screen>
  );
}

function LineaRegla({ ok, label }: { ok: boolean; label: string }) {
  const { theme } = useTheme();
  const color = ok ? '#21A26B' : theme.soft;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <Icon name={ok ? 'check_circle' : 'radio_button_unchecked'} size={15} color={color} />
      <Text style={{ fontFamily: fonts.bodyMed, fontSize: 11.5, color }}>{label}</Text>
    </View>
  );
}
