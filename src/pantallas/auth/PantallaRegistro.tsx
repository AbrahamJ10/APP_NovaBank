import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Pantalla from '../../componentes/Pantalla';
import { BotonVolver, PasosProgreso } from '../../componentes/Primitivas';
import CampoTexto from '../../componentes/CampoTexto';
import { BotonPrimario } from '../../componentes/Botones';
import Icono from '../../componentes/Icono';
import { usarTema } from '../../tema/ContextoTema';
import { fuentes } from '../../tema/estilos';
import { ListaParametrosAuth } from '../../navegacion/tipos';
import { usarEstadoApp } from '../../estado/ContextoEstadoApp';
import { usarIdioma } from '../../i18n/ContextoIdioma';

function cumpleRegla(regex: RegExp, valor: string) {
  return regex.test(valor);
}

export default function PantallaRegistro() {
  const nav = useNavigation<NativeStackNavigationProp<ListaParametrosAuth>>();
  const { tema } = usarTema();
  const { t } = usarIdioma();
  const { iniciarRegistro, dniEscaneado, setDniEscaneado } = usarEstadoApp();

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
      if (dniEscaneado) {
        if (dniEscaneado.dni) setDni(dniEscaneado.dni);
        if (dniEscaneado.nombres) setNombres(dniEscaneado.nombres);
        if (dniEscaneado.apellidoPaterno) setApellidoPaterno(dniEscaneado.apellidoPaterno);
        if (dniEscaneado.apellidoMaterno) setApellidoMaterno(dniEscaneado.apellidoMaterno);
        setDniEscaneado(null);
      }
    }, [dniEscaneado])
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
    iniciarRegistro({ name: nombreCompleto, email: correo, dni, phone: telefono, password: contrasena });
    nav.navigate('RegisterFace');
  };

  return (
    <Pantalla bg={tema.oscuro ? tema.fondo : '#fff'}>
      <BotonVolver onPress={() => nav.goBack()} />
      <PasosProgreso total={2} current={1} />
      <View>
        <Text style={{ fontFamily: fuentes.heading, fontSize: 26, color: tema.tinta, letterSpacing: -0.9 }}>{t('register.title')}</Text>
        <Text style={{ marginTop: 7, fontFamily: fuentes.body, fontSize: 13.5, color: tema.medio }}>{t('register.step')}</Text>
      </View>

      <View style={{ marginTop: 22, gap: 15 }}>
        <CampoTexto label={t('register.names')} icon="person" value={nombres} editable={false} />
        <CampoTexto label={t('register.firstLastName')} icon="badge" value={apellidoPaterno} editable={false} />
        <CampoTexto label={t('register.secondLastName')} icon="badge" value={apellidoMaterno} editable={false} />
        <CampoTexto label={t('register.dni')} icon="fingerprint" value={dni} editable={false} status="success" pista={t('register.verifiedReniec')} />

        <CampoTexto
          label={t('register.email')}
          icon="mail"
          placeholder="tucorreo@gmail.com"
          value={correo}
          onChangeText={setCorreo}
          autoCapitalize="none"
          keyboardType="email-address"
          status={correo.length === 0 ? 'default' : correoValido ? 'success' : 'error'}
        />
        <CampoTexto
          label={t('register.phone')}
          icon="call"
          placeholder="987 214 550"
          value={telefono}
          onChangeText={(v) => setTelefono(v.replace(/\D/g, '').slice(0, 9))}
          keyboardType="phone-pad"
          status={telefono.length === 0 ? 'default' : telefonoValido ? 'success' : 'error'}
        />
        <View>
          <CampoTexto
            label={t('register.password')}
            icon="lock"
            placeholder={t('register.passwordPlaceholder')}
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry={!contrasenaVisible}
            iconoAccion={contrasenaVisible ? 'visibility_off' : 'visibility'}
            alPresionarIconoAccion={() => setContrasenaVisible((v) => !v)}
          />
          <View style={{ marginTop: 10, gap: 6 }}>
            <LineaRegla ok={reglaLargo} label={t('register.ruleLen')} />
            <LineaRegla ok={reglaNumero} label={t('register.ruleNum')} />
            <LineaRegla ok={reglaMayuscula} label={t('register.ruleUp')} />
            <LineaRegla ok={reglaMinuscula} label={t('register.ruleLow')} />
          </View>
          <View style={{ marginTop: 12, height: 6, borderRadius: 3, backgroundColor: tema.linea, overflow: 'hidden' }}>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: fortaleza.color, width: fortaleza.pct as any }} />
          </View>
          {fortaleza.label ? <Text style={{ marginTop: 6, fontFamily: fuentes.bodyBold, fontSize: 11.5, color: fortaleza.color }}>{fortaleza.label}</Text> : null}
        </View>

        <CampoTexto
          label={t('register.confirmPassword')}
          icon="lock"
          placeholder={t('register.confirmPasswordPlaceholder')}
          value={confirmarContrasena}
          onChangeText={setConfirmarContrasena}
          secureTextEntry={!confirmarContrasenaVisible}
          iconoAccion={confirmarContrasenaVisible ? 'visibility_off' : 'visibility'}
          alPresionarIconoAccion={() => setConfirmarContrasenaVisible((v) => !v)}
          status={confirmarContrasena.length === 0 ? 'default' : confirmacionValida ? 'success' : 'error'}
          pista={confirmarContrasena.length > 0 && !confirmacionValida ? t('register.passwordMismatch') : undefined}
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
            borderColor: tema.linea,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {aceptado ? <Icono name="check" size={15} color="#fff" /> : null}
        </View>
        <Text style={{ flex: 1, fontFamily: fuentes.body, fontSize: 12, lineHeight: 17, color: tema.medio }}>
          {t('register.termsPrefix')}<Text style={{ color: '#C9A227' }}>{t('register.termsLink')}</Text>{t('register.termsSuffix')}
        </Text>
      </Pressable>

      <BotonPrimario label={t('register.continue')} iconoDerecho="arrow_forward" disabled={!puedeContinuar} onPress={alContinuar} style={{ marginTop: 22 }} />
    </Pantalla>
  );
}

function LineaRegla({ ok, label }: { ok: boolean; label: string }) {
  const { tema } = usarTema();
  const color = ok ? '#21A26B' : tema.suave;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <Icono name={ok ? 'check_circle' : 'radio_button_unchecked'} size={15} color={color} />
      <Text style={{ fontFamily: fuentes.bodyMed, fontSize: 11.5, color }}>{label}</Text>
    </View>
  );
}
