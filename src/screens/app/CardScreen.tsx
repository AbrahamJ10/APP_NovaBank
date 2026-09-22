import React, { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Pantalla from '../../components/Pantalla';
import { CasillasOtp, TituloPantalla, Interruptor } from '../../components/Primitivas';
import { BotonPeligro, BotonFantasma, BotonPrimario } from '../../components/Botones';
import HojaInferior from '../../components/HojaInferior';
import Icono from '../../components/Icono';
import { usarTema } from '../../theme/ContextoTema';
import { fuentes } from '../../theme/estilos';
import { usarEstadoApp } from '../../state/ContextoEstadoApp';
import { usarIdioma } from '../../i18n/ContextoIdioma';

export default function CardScreen() {
  const nav = useNavigation<any>();
  const { theme } = usarTema();
  const { t } = usarIdioma();
  const { user, cardBlocked, requestCardBlock, requestProfileOtp, revealCvv } = usarEstadoApp();

  const CONTROLES = [
    { key: 'pin', icon: 'pin', label: t('card.controlPinLabel'), desc: t('card.controlPinDesc') },
    { key: 'cvv', icon: 'visibility', label: t('card.controlCvvLabel'), desc: t('card.controlCvvDesc') },
    { key: 'limits', icon: 'place', label: t('card.controlLimitsLabel'), desc: t('card.controlLimitsDesc'), go: 'Limits' as const },
    { key: 'report', icon: 'report', label: t('card.controlReportLabel'), desc: t('card.controlReportDesc'), go: 'Security' as const },
  ];
  const [confirmarAbierto, setConfirmarAbierto] = useState(false);
  const [pinAbierto, setPinAbierto] = useState(false);
  const [pasoCvv, setPasoCvv] = useState<'closed' | 'otp' | 'shown'>('closed');
  const [codigoCvv, setCodigoCvv] = useState('');
  const [valorCvv, setValorCvv] = useState('');
  const [errorCvv, setErrorCvv] = useState<string | null>(null);
  const [enviandoCvv, setEnviandoCvv] = useState(false);
  const [verificandoCvv, setVerificandoCvv] = useState(false);
  const refEntradaCvv = useRef<TextInput>(null);

  const abrirControl = async (clave: string) => {
    if (clave === 'pin') setPinAbierto(true);
    if (clave === 'cvv') {
      setCodigoCvv('');
      setErrorCvv(null);
      setPasoCvv('otp');
      setEnviandoCvv(true);
      const resultado = await requestProfileOtp();
      setEnviandoCvv(false);
      if (!resultado.ok) setErrorCvv(resultado.message);
    }
  };

  const enviarCvv = async (v: string) => {
    if (v.length !== 6 || verificandoCvv) return;
    setVerificandoCvv(true);
    setErrorCvv(null);
    const resultado = await revealCvv(v);
    setVerificandoCvv(false);
    if (!resultado.ok) {
      setErrorCvv(resultado.message);
      setCodigoCvv('');
      return;
    }
    setValorCvv(resultado.cvv);
    setPasoCvv('shown');
  };

  return (
    <Pantalla bg={theme.bg}>
      <TituloPantalla title={t('card.title')} showLanguageSwitch />

      <LinearGradient
        colors={cardBlocked ? ['#5B6875', '#3A434C'] : ['#0E2C4E', '#061626']}
        style={{ marginTop: 18, borderRadius: 22, padding: 24, height: 216, justifyContent: 'space-between', overflow: 'hidden' }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={{ fontFamily: fuentes.displaySemi, fontSize: 17, letterSpacing: 2.4, textTransform: 'uppercase', color: '#E7CE92' }}>NovaBank</Text>
            <Text style={{ marginTop: 3, fontFamily: fuentes.body, fontSize: 10.5, color: 'rgba(255,255,255,.55)', letterSpacing: 1.2, textTransform: 'uppercase' }}>{t('card.visaInfinite')}</Text>
          </View>
          <View style={{ paddingHorizontal: 11, paddingVertical: 5, borderRadius: 9, backgroundColor: cardBlocked ? 'rgba(255,255,255,.18)' : 'rgba(217,190,122,.2)' }}>
            <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 11, color: cardBlocked ? '#fff' : '#E7CE92' }}>{cardBlocked ? t('card.blocked') : t('card.active')}</Text>
          </View>
        </View>
        <View>
          <LinearGradient colors={['#E7CE92', '#B98B33', '#F0DCA8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 44, height: 32, borderRadius: 6 }} />
          <Text style={{ marginTop: 12, fontFamily: fuentes.bodyMed, fontSize: 18, letterSpacing: 2.6, color: '#fff' }}>{user.cardNumber}</Text>
          <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={{ fontFamily: fuentes.body, fontSize: 9.5, color: 'rgba(255,255,255,.55)' }}>{t('card.holder')}</Text>
              <Text style={{ marginTop: 2, fontFamily: fuentes.bodyMed, fontSize: 12.5, letterSpacing: 0.5, color: '#fff' }}>{user.name.toUpperCase()}</Text>
            </View>
            <View>
              <Text style={{ fontFamily: fuentes.body, fontSize: 9.5, color: 'rgba(255,255,255,.55)' }}>{t('card.expires')}</Text>
              <Text style={{ marginTop: 2, fontFamily: fuentes.bodyMed, fontSize: 12.5, color: '#fff' }}>{user.cardExpiry}</Text>
            </View>
            <Text style={{ fontFamily: fuentes.heading, fontSize: 16, fontStyle: 'italic', color: '#E7CE92' }}>VISA</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={{ marginTop: 16, borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fuentes.headingBold, fontSize: 15, color: theme.ink }}>{cardBlocked ? t('card.blockedTitle') : t('card.blockTitle')}</Text>
          <Text style={{ marginTop: 4, fontFamily: fuentes.body, fontSize: 12, lineHeight: 17, color: theme.mid }}>
            {cardBlocked ? t('card.blockedDesc') : t('card.unblockedDesc')}
          </Text>
        </View>
        <Interruptor value={cardBlocked} onChange={(siguiente) => (siguiente ? setConfirmarAbierto(true) : requestCardBlock(false))} />
      </View>

      <View style={{ marginTop: 16, borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, paddingHorizontal: 14 }}>
        {CONTROLES.map((control, i) => (
          <Pressable
            key={control.key}
            onPress={() => (control.go ? nav.navigate(control.go) : abrirControl(control.key))}
            style={({ pressed }) => [
              { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 6, marginHorizontal: -6, borderRadius: 12, borderBottomWidth: i < CONTROLES.length - 1 ? 1 : 0, borderBottomColor: theme.line },
              pressed && { backgroundColor: theme.tint },
            ]}
          >
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
              <Icono name={control.icon} size={19} color={theme.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fuentes.bodyBold, fontSize: 13, color: theme.ink }}>{control.label}</Text>
              <Text style={{ marginTop: 2, fontFamily: fuentes.body, fontSize: 11, color: theme.soft }}>{control.desc}</Text>
            </View>
            <Icono name="chevron_right" size={18} color="#A6B1BD" />
          </Pressable>
        ))}
      </View>

      <HojaInferior visible={confirmarAbierto} onClose={() => setConfirmarAbierto(false)}>
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: theme.warnBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icono name="gpp_maybe" size={26} color="#C2352B" />
        </View>
        <Text style={{ marginTop: 16, fontFamily: fuentes.heading, fontSize: 21, letterSpacing: -0.6, color: theme.ink }}>{t('card.confirmBlockTitle')}</Text>
        <Text style={{ marginTop: 9, fontFamily: fuentes.body, fontSize: 13.5, lineHeight: 20, color: theme.mid }}>
          {t('card.confirmBlockBody')}
        </Text>
        <BotonPeligro
          label={t('card.yesBlock')}
          onPress={() => {
            requestCardBlock(true);
            setConfirmarAbierto(false);
          }}
          style={{ marginTop: 22 }}
        />
        <BotonFantasma label={t('card.cancel')} onPress={() => setConfirmarAbierto(false)} style={{ marginTop: 10 }} />
      </HojaInferior>

      <HojaInferior visible={pinAbierto} onClose={() => setPinAbierto(false)}>
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}>
          <Icono name="pin" size={24} color={theme.gold} />
        </View>
        <Text style={{ marginTop: 16, fontFamily: fuentes.heading, fontSize: 20, letterSpacing: -0.5, color: theme.ink }}>{t('card.changePinTitle')}</Text>
        <Text style={{ marginTop: 9, fontFamily: fuentes.body, fontSize: 13.5, lineHeight: 20, color: theme.mid }}>
          {t('card.changePinBody')}
        </Text>
        <BotonPrimario label={t('card.understood')} onPress={() => setPinAbierto(false)} style={{ marginTop: 20 }} />
      </HojaInferior>

      <HojaInferior
        visible={pasoCvv !== 'closed'}
        onShow={() => refEntradaCvv.current?.focus()}
        onClose={() => {
          setPasoCvv('closed');
          setCodigoCvv('');
        }}
      >
        {pasoCvv === 'otp' && (
          <View>
            <Text style={{ fontFamily: fuentes.heading, fontSize: 20, letterSpacing: -0.5, color: theme.ink }}>{t('card.verifyIdentity')}</Text>
            <Text style={{ marginTop: 8, fontFamily: fuentes.body, fontSize: 12.5, lineHeight: 18, color: theme.mid }}>
              {t('card.verifyIdentityBody')}
            </Text>
            <Pressable onPress={() => refEntradaCvv.current?.focus()} style={{ marginTop: 18 }}>
              <CasillasOtp value={codigoCvv} />
            </Pressable>
            <TextInput
              ref={refEntradaCvv}
              value={codigoCvv}
              keyboardType="number-pad"
              maxLength={6}
              onChangeText={(v) => {
                const digitos = v.replace(/\D/g, '').slice(0, 6);
                setCodigoCvv(digitos);
                setErrorCvv(null);
                if (digitos.length === 6) enviarCvv(digitos);
              }}
              style={{ position: 'absolute', opacity: 0, height: 0 }}
            />
            {errorCvv ? (
              <Text style={{ marginTop: 8, color: '#C2352B', fontFamily: fuentes.bodyBold, fontSize: 12 }}>{errorCvv}</Text>
            ) : enviandoCvv ? (
              <Text style={{ marginTop: 8, fontFamily: fuentes.body, fontSize: 12, color: theme.soft }}>{t('card.sendingCode')}</Text>
            ) : null}
            <BotonPrimario
              label={verificandoCvv ? t('card.verifying') : t('card.verify')}
              onPress={() => enviarCvv(codigoCvv)}
              disabled={codigoCvv.length !== 6 || verificandoCvv || enviandoCvv}
              style={{ marginTop: 18 }}
            />
          </View>
        )}
        {pasoCvv === 'shown' && (
          <View style={{ alignItems: 'center', paddingVertical: 6 }}>
            <Icono name="lock_open" size={30} color={theme.green} />
            <Text style={{ marginTop: 14, fontFamily: fuentes.body, fontSize: 12, color: theme.soft, letterSpacing: 1 }}>{t('card.cvvOf', { last4: user.cardNumber.slice(-4) })}</Text>
            <Text style={{ marginTop: 8, fontFamily: fuentes.heading, fontSize: 34, letterSpacing: 6, color: theme.ink }}>{valorCvv}</Text>
            <Text style={{ marginTop: 10, textAlign: 'center', fontFamily: fuentes.body, fontSize: 11.5, color: theme.soft }}>{t('card.cvvHides')}</Text>
            <BotonPrimario label={t('card.done')} onPress={() => setPasoCvv('closed')} style={{ marginTop: 18, width: '100%' }} />
          </View>
        )}
      </HojaInferior>
    </Pantalla>
  );
}
