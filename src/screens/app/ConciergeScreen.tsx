import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BackButton } from '../../components/Primitives';
import { LogoMark } from '../../components/Logo';
import Icon from '../../components/Icon';
import { fonts } from '../../theme/tokens';
import { money } from '../../lib/format';
import { useAppState } from '../../state/AppStateContext';
import { RootStackParamList } from '../../navigation/types';
import { ServiceBill } from '../../state/types';
import { useLanguage } from '../../i18n/LanguageContext';

type Action = { id: string; label: string; run: () => void | Promise<void> };
type Msg = { id: string; from: 'agent' | 'user'; text: string; actions?: Action[] };

let seq = 0;
function nextId(prefix: string) {
  seq += 1;
  return `${prefix}${seq}`;
}

export default function ConciergeScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useLanguage();
  const {
    user,
    cardBlocked,
    requestCardBlock,
    services,
    available,
    creditLine,
    cardDebt,
    minPayment,
    transactions,
    sessions,
    limitOnline,
    limitAtm,
    loadSecurity,
    payBill,
    suspendBill,
    resumeBill,
  } = useAppState();

  const [messages, setMessages] = useState<Msg[]>([
    { id: nextId('a'), from: 'agent', text: t('concierge.greeting', { name: user.name.split(' ')[0] }), actions: mainMenu() },
  ]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  function pushAgent(text: string, actions?: Action[]) {
    setMessages((m) => [...m, { id: nextId('a'), from: 'agent', text, actions }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }

  function pushUser(text: string) {
    setMessages((m) => [...m, { id: nextId('u'), from: 'user', text }]);
  }

  function mainMenu(): Action[] {
    return [
      { id: 'card', label: t('concierge.menuCard'), run: showCardMenu },
      { id: 'services', label: t('concierge.menuServices'), run: showServicesMenu },
      { id: 'balance', label: t('concierge.menuBalance'), run: showBalance },
      { id: 'security', label: t('concierge.menuSecurity'), run: showSecurityInfo },
    ];
  }

  function backAction(): Action {
    return { id: 'back', label: t('concierge.back'), run: () => pushAgent(t('concierge.menuTitle'), mainMenu()) };
  }

  // --- Bloqueo de tarjeta ---
  function showCardMenu() {
    pushAgent(cardBlocked ? t('concierge.cardStatusBlocked') : t('concierge.cardStatusActive'), [
      cardBlocked
        ? { id: 'unblock', label: t('concierge.actionUnblockCard'), run: () => toggleCard(false) }
        : { id: 'block', label: t('concierge.actionBlockCard'), run: () => toggleCard(true) },
      backAction(),
    ]);
  }

  async function toggleCard(block: boolean) {
    pushUser(block ? t('concierge.actionBlockCard') : t('concierge.actionUnblockCard'));
    setBusy(true);
    const result = await requestCardBlock(block);
    setBusy(false);
    if (!result.ok) {
      pushAgent(t('concierge.actionFailed', { message: result.message }), [backAction()]);
      return;
    }
    pushAgent(block ? t('concierge.cardBlockedDone') : t('concierge.cardUnblockedDone'), [backAction()]);
  }

  // --- Servicios y deudas ---
  function showServicesMenu() {
    if (services.length === 0) {
      pushAgent(t('concierge.servicesEmpty'), [backAction()]);
      return;
    }
    pushAgent(
      t('concierge.servicesIntro'),
      services.map((s) => ({ id: s.id, label: `${s.name} · ${s.paid ? t('concierge.upToDateShort') : money(s.amount)}`, run: () => showServiceDetail(s) }))
        .concat([backAction()])
    );
  }

  function showServiceDetail(s: ServiceBill) {
    pushUser(s.name);
    if (s.suspended) {
      pushAgent(t('concierge.serviceStatusSuspended', { name: s.name }), [
        { id: 'resume', label: t('concierge.actionResume'), run: () => doResume(s) },
        backAction(),
      ]);
      return;
    }
    if (s.paid) {
      pushAgent(t('concierge.serviceStatusPaid', { name: s.name }), [
        { id: 'suspend', label: t('concierge.actionSuspend'), run: () => doSuspend(s) },
        backAction(),
      ]);
      return;
    }
    pushAgent(t('concierge.serviceStatusDue', { name: s.name, amount: money(s.amount), date: s.expiry }), [
      { id: 'pay', label: t('concierge.actionPayNow'), run: () => confirmPay(s) },
      { id: 'suspend', label: t('concierge.actionSuspend'), run: () => doSuspend(s) },
      backAction(),
    ]);
  }

  function confirmPay(s: ServiceBill) {
    pushUser(t('concierge.actionPayNow'));
    if (s.amount > available) {
      pushAgent(t('concierge.cannotAffordService', { name: s.name }), [backAction()]);
      return;
    }
    pushAgent(t('concierge.payConfirm', { amount: money(s.amount), name: s.name }), [
      { id: 'yes', label: t('concierge.yes'), run: () => doPay(s) },
      { id: 'no', label: t('concierge.no'), run: () => pushAgent(t('concierge.menuTitle'), mainMenu()) },
    ]);
  }

  async function doPay(s: ServiceBill) {
    pushUser(t('concierge.yes'));
    setBusy(true);
    const result = await payBill(s.id);
    setBusy(false);
    if (!result.ok) {
      pushAgent(t('concierge.actionFailed', { message: result.message }), [backAction()]);
      return;
    }
    pushAgent(t('concierge.paidDone', { amount: money(s.amount), name: s.name }), [backAction()]);
  }

  async function doSuspend(s: ServiceBill) {
    pushUser(t('concierge.actionSuspend'));
    setBusy(true);
    const result = await suspendBill(s.id);
    setBusy(false);
    if (!result.ok) {
      pushAgent(t('concierge.actionFailed', { message: result.message }), [backAction()]);
      return;
    }
    pushAgent(t('concierge.suspendedDone', { name: s.name }), [backAction()]);
  }

  async function doResume(s: ServiceBill) {
    pushUser(t('concierge.actionResume'));
    setBusy(true);
    const result = await resumeBill(s.id);
    setBusy(false);
    if (!result.ok) {
      pushAgent(t('concierge.actionFailed', { message: result.message }), [backAction()]);
      return;
    }
    pushAgent(t('concierge.resumedDone', { name: s.name }), [backAction()]);
  }

  // --- Saldo y movimientos ---
  function showBalance() {
    pushAgent(t('concierge.balanceInfo', { available: money(available), debt: money(cardDebt), min: money(minPayment), line: money(creditLine) }), [
      { id: 'movements', label: t('concierge.actionShowMovements'), run: showMovements },
      backAction(),
    ]);
  }

  function showMovements() {
    pushUser(t('concierge.actionShowMovements'));
    if (transactions.length === 0) {
      pushAgent(t('concierge.noMovements'), [backAction()]);
      return;
    }
    const lines = transactions.slice(0, 3).map((tx) => `${tx.kind === 'credit' ? '+' : '−'}${money(tx.amount)} · ${tx.name}`).join('\n');
    pushAgent(`${t('concierge.recentMovements')}\n${lines}`, [backAction()]);
  }

  // --- Seguridad ---
  async function showSecurityInfo() {
    pushAgent(t('concierge.securityLoading'));
    await loadSecurity();
    pushAgent(t('concierge.securityInfo', { count: String(sessions.length), online: money(limitOnline), atm: money(limitAtm) }), [
      { id: 'goSecurity', label: t('concierge.actionGoSecurity'), run: () => nav.navigate('Security') },
      backAction(),
    ]);
  }

  // --- Free text ---
  function handleFreeText(text: string) {
    const q = text.toLowerCase();
    if (/blo(que|c)|tarjeta|card/.test(q)) return showCardMenu();
    if (/servici|deuda|factura|pagar|suspend|pausar|bill/.test(q)) return showServicesMenu();
    if (/saldo|dinero|movimiento|balance/.test(q)) return showBalance();
    if (/segur|dispositivo|sesion|limite|security|device/.test(q)) return showSecurityInfo();
    pushAgent(t('concierge.notUnderstood'), mainMenu());
  }

  const send = () => {
    const text = draft.trim();
    if (!text || busy) return;
    pushUser(text);
    setDraft('');
    setTimeout(() => handleFreeText(text), 350);
  };

  const runAction = (a: Action) => {
    if (busy) return;
    a.run();
  };

  return (
    <LinearGradient colors={['#0E2C4E', '#061626', '#08131F']} locations={[0, 0.42, 1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ paddingHorizontal: 22 }}>
            <BackButton dark onPress={() => nav.goBack()} />
          </View>
          <View style={{ paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', gap: 13 }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.94)', alignItems: 'center', justifyContent: 'center' }}>
              <LogoMark size={34} />
              <View style={{ position: 'absolute', right: -2, bottom: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#21A26B', borderWidth: 2.5, borderColor: '#0E2C4E' }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.displaySemi, fontSize: 16, letterSpacing: 2.2, textTransform: 'uppercase', color: '#E7CE92' }}>{t('concierge.label')}</Text>
              <Text style={{ marginTop: 2, fontFamily: fonts.body, fontSize: 11.5, color: 'rgba(255,255,255,.55)' }}>{t('concierge.online')}</Text>
            </View>
          </View>

          <ScrollView ref={scrollRef} style={{ flex: 1, marginTop: 20 }} contentContainerStyle={{ paddingHorizontal: 22, gap: 10, paddingBottom: 10 }}>
            {messages.map((m) => (
              <View key={m.id} style={{ alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start', maxWidth: '86%' }}>
                <View
                  style={{
                    backgroundColor: m.from === 'user' ? '#C9A227' : 'rgba(255,255,255,.09)',
                    borderWidth: m.from === 'user' ? 0 : 1,
                    borderColor: 'rgba(217,190,122,.16)',
                    borderRadius: 20,
                    borderBottomRightRadius: m.from === 'user' ? 6 : 20,
                    borderBottomLeftRadius: m.from === 'agent' ? 6 : 20,
                    padding: 15,
                  }}
                >
                  <Text style={{ fontFamily: fonts.bodyMed, fontSize: 13.5, lineHeight: 20, color: m.from === 'user' ? '#071B31' : 'rgba(255,255,255,.88)' }}>{m.text}</Text>
                </View>
                {m.actions && m.actions.length > 0 ? (
                  <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {m.actions.map((a) => (
                      <Pressable
                        key={a.id}
                        onPress={() => runAction(a)}
                        style={({ pressed }) => [
                          { paddingHorizontal: 14, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(217,190,122,.35)', alignItems: 'center', justifyContent: 'center' },
                          pressed && { backgroundColor: 'rgba(217,190,122,.16)' },
                        ]}
                      >
                        <Text style={{ fontFamily: fonts.bodyMed, fontSize: 12, color: '#E7CE92' }}>{a.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>

          <View style={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 16 }}>
            <View style={{ height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.1)', flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 16, paddingRight: 8 }}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={t('concierge.inputPlaceholder')}
                placeholderTextColor="rgba(255,255,255,.45)"
                style={{ flex: 1, fontSize: 13.5, color: '#fff' }}
                onSubmitEditing={send}
                editable={!busy}
              />
              <Pressable onPress={send} disabled={busy} style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#C9A227', alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.6 : 1 }}>
                <Icon name="send" size={19} color="#071B31" />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
