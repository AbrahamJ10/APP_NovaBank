import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Screen from '../../components/Screen';
import { BackButton, ScreenTitle } from '../../components/Primitives';
import { GhostButton, PrimaryButton } from '../../components/Buttons';
import Icon from '../../components/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { useAppState } from '../../state/AppStateContext';
import { ApiError, statementsApi } from '../../lib/api';
import { useLanguage } from '../../i18n/LanguageContext';

function last6Months(locale: string) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    return { month: d.getMonth() + 1, year: d.getFullYear(), label: label.charAt(0).toUpperCase() + label.slice(1) };
  });
}

export default function ReportsScreen() {
  const nav = useNavigation();
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const { user } = useAppState();

  const months = useMemo(() => last6Months(language === 'es' ? 'es-PE' : 'en-US'), [language]);
  const [selected, setSelected] = useState(months[0]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      await statementsApi.send(selected.month, selected.year);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo enviar el estado de cuenta. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Screen bg={theme.bg}>
        <BackButton onPress={() => nav.goBack()} />
        <View style={{ alignItems: 'center', paddingTop: 60 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.okBg, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="mark_email_read" size={44} color={theme.green} />
          </View>
          <Text style={{ marginTop: 20, fontFamily: fonts.heading, fontSize: 22, letterSpacing: -0.7, color: theme.ink }}>{t('reports.sentTitle')}</Text>
          <Text style={{ marginTop: 9, textAlign: 'center', fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: theme.mid, maxWidth: 280 }}>
            {t('reports.sentBody', { email: user.email })}
          </Text>
          <GhostButton label={t('reports.requestAnother')} onPress={() => setSent(false)} style={{ marginTop: 22, width: 200 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen bg={theme.bg}>
      <BackButton onPress={() => nav.goBack()} />
      <ScreenTitle title={t('reports.title')} note={t('reports.note')} />

      <View style={{ marginTop: 20, borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 22 }}>
        <Text style={{ fontFamily: fonts.headingBold, fontSize: 13.5, color: theme.ink }}>{t('reports.chooseMonth')}</Text>
        <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
          {months.map((m) => {
            const active = selected.month === m.month && selected.year === m.year;
            return (
              <Pressable
                key={`${m.year}-${m.month}`}
                onPress={() => setSelected(m)}
                style={{ width: '47%', height: 48, borderRadius: 13, borderWidth: 1.5, borderColor: active ? theme.gold : theme.line, backgroundColor: active ? theme.selBg : theme.bg, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: theme.ink }}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View
          style={{ marginTop: 18, padding: 14, borderRadius: 14, backgroundColor: theme.bg, flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          <Icon name="mail" size={19} color={theme.gold} />
          <Text style={{ flex: 1, fontFamily: fonts.body, fontSize: 12, color: theme.ink }}>{user.email}</Text>
        </View>
      </View>

      {error ? (
        <Text style={{ marginTop: 12, color: '#C2352B', fontFamily: fonts.bodyBold, fontSize: 12 }}>{error}</Text>
      ) : null}

      <PrimaryButton
        label={sending ? t('reports.sending') : t('reports.sendToEmail')}
        icon="send"
        onPress={submit}
        disabled={sending}
        style={{ marginTop: 18 }}
      />
    </Screen>
  );
}
