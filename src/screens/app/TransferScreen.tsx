import React, { useRef, useState } from 'react';
import { Pressable, Share, Text, TextInput, View } from 'react-native';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Screen from '../../components/Screen';
import { BackButton, OtpBoxes, Row, ScreenTitle } from '../../components/Primitives';
import TextField from '../../components/TextField';
import { GhostButton, PrimaryButton } from '../../components/Buttons';
import Icon from '../../components/Icon';
import { LogoMark } from '../../components/Logo';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { money, mmss } from '../../lib/format';
import { useAppState, TransferReceipt } from '../../state/AppStateContext';
import { RootStackParamList, TabParamList } from '../../navigation/types';
import { useLanguage } from '../../i18n/LanguageContext';

type Navegacion = CompositeNavigationProp<NativeStackNavigationProp<RootStackParamList>, BottomTabNavigationProp<TabParamList>>;
type Paso = 'form' | 'otp' | 'done' | 'error';

export default function TransferScreen() {
  const nav = useNavigation<Navegacion>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { payees, available, requestTransferOtp, executeTransfer, addPayee, otpLeft } = useAppState();

  const [paso, setPaso] = useState<Paso>('form');
  const [agregandoDestinatario, setAgregandoDestinatario] = useState(false);
  const [guardandoDestinatario, setGuardandoDestinatario] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCci, setNuevoCci] = useState('');

  const [idDestinatario, setIdDestinatario] = useState<string | null>(null);
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [codigo, setCodigo] = useState('');
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);
  const [enviandoOtp, setEnviandoOtp] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [comprobante, setComprobante] = useState<TransferReceipt | null>(null);
  const refEntrada = useRef<TextInput>(null);

  const destinatarioSeleccionado = payees.find((p) => p.id === idDestinatario);
  const montoNum = Number(monto.replace(',', '.')) || 0;
  const insuficiente = montoNum > available;
  const puedeContinuar = !!idDestinatario && montoNum > 0 && !insuficiente && concepto.trim().length > 0;

  const reiniciar = () => {
    setPaso('form');
    setIdDestinatario(null);
    setMonto('');
    setConcepto('');
    setCodigo('');
    setErrorCodigo(null);
    setComprobante(null);
  };

  const compartirComprobante = (r: TransferReceipt) => {
    Share.share({
      message: [
        `NovaBank · ${t('transfer.completedBadge')}`,
        money(r.amount),
        `${t('transfer.recipientLabel')}: ${r.payee.name}`,
        `${t('transfer.bankLabel')}: ${r.payee.bank} ${r.payee.account}`,
        `${t('transfer.dateLabel')}: ${r.date}`,
        `${t('transfer.referenceLabel')}: ${r.reference}`,
      ].join('\n'),
    }).catch(() => {});
  };

  const enviarCodigo = async (valor: string) => {
    if (valor.length !== 6 || !idDestinatario || enviandoCodigo) return;
    setEnviandoCodigo(true);
    setErrorCodigo(null);
    try {
      const resultado = await executeTransfer(idDestinatario, montoNum, concepto, valor);
      if (!resultado.ok) {
        setErrorCodigo(resultado.message);
        setCodigo('');
        return;
      }
      setComprobante(resultado.receipt);
      setPaso(resultado.receipt.rejected ? 'error' : 'done');
    } finally {
      setEnviandoCodigo(false);
    }
  };

  return (
    <Screen bg={theme.bg}>
      {paso === 'form' && (
        <View>
          <ScreenTitle title={t('transfer.title')} note={t('transfer.note')} />

          <Text style={{ marginTop: 14, fontFamily: fonts.headingBold, fontSize: 13.5, color: theme.ink }}>{t('transfer.recipient')}</Text>
          <View style={{ marginTop: 10, gap: 9 }}>
            {payees.map((p) => {
              const activo = idDestinatario === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setIdDestinatario(p.id)}
                  style={{
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: activo ? theme.gold : theme.line,
                    backgroundColor: activo ? theme.selBg : theme.surf,
                    padding: 13,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: fonts.headingBold, fontSize: 13, color: theme.ink }}>{p.initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: theme.ink }}>{p.name}</Text>
                    <Text style={{ marginTop: 2, fontFamily: fonts.body, fontSize: 11.5, color: theme.soft }}>
                      {p.bank} · {p.account}
                    </Text>
                  </View>
                  <Icon name={activo ? 'check_circle' : 'radio_button_unchecked'} size={20} color={activo ? theme.gold : theme.soft} />
                </Pressable>
              );
            })}

            {agregandoDestinatario ? (
              <View style={{ borderRadius: 16, borderWidth: 1.5, borderColor: theme.line, backgroundColor: theme.surf, padding: 13, gap: 10 }}>
                <TextField placeholder={t('transfer.addAccountName')} value={nuevoNombre} onChangeText={setNuevoNombre} />
                <TextField placeholder={t('transfer.addAccountNumber')} value={nuevoCci} onChangeText={setNuevoCci} keyboardType="number-pad" />
                <PrimaryButton
                  label={guardandoDestinatario ? t('transfer.savingAccount') : t('transfer.addAccount')}
                  disabled={nuevoNombre.trim().length < 2 || nuevoCci.trim().length < 4 || guardandoDestinatario}
                  onPress={async () => {
                    setGuardandoDestinatario(true);
                    try {
                      const creado = await addPayee({
                        name: nuevoNombre.trim(),
                        bank: t('transfer.addedAccount'),
                        accountNumber: '···' + nuevoCci.trim().slice(-4),
                      });
                      if (creado) {
                        setIdDestinatario(creado.id);
                        setAgregandoDestinatario(false);
                        setNuevoNombre('');
                        setNuevoCci('');
                      }
                    } finally {
                      setGuardandoDestinatario(false);
                    }
                  }}
                  style={{ height: 46 }}
                />
              </View>
            ) : (
              <Pressable
                onPress={() => setAgregandoDestinatario(true)}
                style={{ borderRadius: 16, borderWidth: 1.5, borderColor: theme.line, borderStyle: 'dashed', backgroundColor: theme.surf, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="add" size={20} color={theme.ink} />
                </View>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: theme.ink }}>{t('transfer.addOtherBank')}</Text>
              </Pressable>
            )}
          </View>

          <Text style={{ marginTop: 22, fontFamily: fonts.headingBold, fontSize: 13.5, color: theme.ink }}>{t('transfer.amount')}</Text>
          <View
            style={{
              marginTop: 10,
              height: 72,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: insuficiente ? '#C2352B' : theme.gold,
              backgroundColor: theme.surf,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              gap: 9,
            }}
          >
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 17, color: theme.soft }}>S/</Text>
            <TextInput
              value={monto}
              onChangeText={(v) => setMonto(v.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              placeholderTextColor={theme.soft}
              keyboardType="decimal-pad"
              style={{ flex: 1, fontSize: 30, fontWeight: '800', color: theme.ink, letterSpacing: -1, padding: 0 }}
            />
          </View>
          <Text style={{ marginTop: 7, fontFamily: fonts.bodyMed, fontSize: 11.5, color: insuficiente ? '#C2352B' : theme.soft }}>
            {insuficiente ? t('transfer.insufficient', { available: money(available) }) : t('transfer.availableAmount', { available: money(available) })}
          </Text>

          <Text style={{ marginTop: 18, fontFamily: fonts.headingBold, fontSize: 13.5, color: theme.ink }}>{t('transfer.concept')}</Text>
          <View style={{ marginTop: 10 }}>
            <TextField placeholder={t('transfer.conceptPlaceholder')} value={concepto} onChangeText={setConcepto} />
          </View>

          {errorEnvio ? (
            <Text style={{ marginTop: 10, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{errorEnvio}</Text>
          ) : null}
          <PrimaryButton
            label={enviandoOtp ? t('transfer.sendingCode') : t('transfer.continue')}
            iconRight="arrow_forward"
            disabled={!puedeContinuar || enviandoOtp}
            onPress={async () => {
              setEnviandoOtp(true);
              setErrorEnvio(null);
              try {
                const resultado = await requestTransferOtp();
                if (!resultado.ok) {
                  setErrorEnvio(resultado.message);
                  return;
                }
                setPaso('otp');
              } finally {
                setEnviandoOtp(false);
              }
            }}
            style={{ marginTop: 22 }}
          />
        </View>
      )}

      {paso === 'otp' && destinatarioSeleccionado && (
        <View>
          <BackButton onPress={() => setPaso('form')} />
          <Text style={{ fontFamily: fonts.heading, fontSize: 24, letterSpacing: -0.8, color: theme.ink }}>{t('transfer.confirmToken')}</Text>
          <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: theme.mid }}>
            {t('transfer.tokenSubtitleEmail', { amount: money(montoNum) })}
          </Text>
          <Pressable onPress={() => refEntrada.current?.focus()} style={{ marginTop: 24 }}>
            <OtpBoxes value={codigo} />
          </Pressable>
          <TextInput
            ref={refEntrada}
            value={codigo}
            autoFocus
            editable={!enviandoCodigo}
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={(v) => {
              const digitos = v.replace(/\D/g, '').slice(0, 6);
              setCodigo(digitos);
              setErrorCodigo(null);
              if (digitos.length === 6) enviarCodigo(digitos);
            }}
            style={{ position: 'absolute', opacity: 0, height: 0 }}
          />
          {enviandoCodigo ? (
            <Text style={{ marginTop: 8, fontFamily: fonts.bodyMed, fontSize: 12, color: theme.mid }}>{t('transfer.verifying')}</Text>
          ) : errorCodigo ? (
            <Text style={{ marginTop: 8, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{errorCodigo}</Text>
          ) : null}
          <Text style={{ marginTop: 16, fontFamily: fonts.body, fontSize: 12.5, color: theme.mid }}>
            {otpLeft > 0 ? (
              <>
                {t('transfer.resendIn')}<Text style={{ fontFamily: fonts.bodyBold, color: theme.gold }}>{mmss(otpLeft)}</Text>
              </>
            ) : (
              <Text onPress={() => requestTransferOtp()} style={{ fontFamily: fonts.bodyBold, color: theme.gold }}>
                {t('transfer.resendCode')}
              </Text>
            )}
          </Text>

          <View style={{ marginTop: 22, borderRadius: 18, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 18, gap: 4 }}>
            <Row label={t('transfer.destination')} value={`${destinatarioSeleccionado.name} · ${destinatarioSeleccionado.bank}`} />
            <Row label={t('transfer.fee')} value="S/ 0.00" />
            <View style={{ height: 1, backgroundColor: theme.line, marginVertical: 6 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={{ fontFamily: fonts.headingBold, fontSize: 13.5, color: theme.ink }}>{t('transfer.total')}</Text>
              <Text style={{ fontFamily: fonts.heading, fontSize: 19, color: theme.ink }}>{money(montoNum)}</Text>
            </View>
          </View>
        </View>
      )}

      {paso === 'done' && comprobante && (
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <View style={{ width: 74, height: 74, borderRadius: 37, backgroundColor: '#EAF9F1', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={40} color="#21A26B" />
          </View>
          <Text style={{ marginTop: 18, fontFamily: fonts.heading, fontSize: 24, letterSpacing: -0.8, color: theme.ink }}>{t('transfer.sent')}</Text>
          <Text style={{ marginTop: 7, fontFamily: fonts.body, fontSize: 13.5, color: theme.mid }}>{t('transfer.sentSubtitle')}</Text>

          <View style={{ marginTop: 20, width: '100%', borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, borderStyle: 'dashed', padding: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <LogoMark size={22} />
                <Text style={{ fontFamily: fonts.displaySemi, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: '#123A63' }}>NovaBank</Text>
              </View>
              <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: '#EAF9F1' }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, color: '#21A26B' }}>{t('transfer.completedBadge')}</Text>
              </View>
            </View>
            <Text style={{ marginTop: 14, fontFamily: fonts.heading, fontSize: 30, letterSpacing: -1.1, color: theme.ink }}>{money(comprobante.amount)}</Text>
            <View style={{ marginTop: 16, gap: 10 }}>
              <Row label={t('transfer.recipientLabel')} value={comprobante.payee.name} />
              <Row label={t('transfer.bankLabel')} value={`${comprobante.payee.bank} ${comprobante.payee.account}`} />
              <Row label={t('transfer.dateLabel')} value={comprobante.date} />
              <Row label={t('transfer.referenceLabel')} value={comprobante.reference} />
            </View>
          </View>

          <GhostButton label={t('transfer.share')} icon="share" onPress={() => compartirComprobante(comprobante)} style={{ marginTop: 18, width: '100%', height: 50 }} />
          <PrimaryButton label={t('transfer.newTransfer')} onPress={reiniciar} style={{ marginTop: 10, width: '100%', height: 50 }} />
        </View>
      )}

      {paso === 'error' && comprobante && (
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <View style={{ width: 74, height: 74, borderRadius: 37, backgroundColor: '#FFF4F3', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="error_outline" size={40} color="#C2352B" />
          </View>
          <Text style={{ marginTop: 18, fontFamily: fonts.heading, fontSize: 24, letterSpacing: -0.8, color: theme.ink, textAlign: 'center' }}>{t('transfer.failedTitle')}</Text>
          <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: theme.mid, textAlign: 'center' }}>
            {t('transfer.failedSubtitle')}
          </Text>

          <View style={{ marginTop: 20, width: '100%', borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={{ fontFamily: fonts.headingBold, fontSize: 13, color: theme.ink }}>{t('transfer.rejectionDetail')}</Text>
              <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: '#FFF4F3' }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, color: '#C2352B' }}>{t('transfer.rejectedBadge')}</Text>
              </View>
            </View>
            <View style={{ marginTop: 14, gap: 10 }}>
              <Row label={t('transfer.reasonLabel')} value={comprobante.reasonLabel ?? ''} />
              <Row label={t('transfer.codeLabel')} value={comprobante.reasonCode ?? ''} />
              <Row label={t('transfer.amountLabel')} value={money(comprobante.amount)} />
              <Row label={t('transfer.balanceLabel')} k={<Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: '#21A26B' }}>{t('transfer.balanceIntact', { amount: money(available) })}</Text>} />
            </View>
          </View>

          <PrimaryButton label={t('transfer.fixAndRetry')} onPress={() => setPaso('form')} style={{ marginTop: 18, width: '100%', height: 52 }} />
          <GhostButton label={t('transfer.contactSupport')} icon="support_agent" onPress={() => nav.navigate('Concierge')} style={{ marginTop: 10, width: '100%', height: 52 }} />
        </View>
      )}
    </Screen>
  );
}
