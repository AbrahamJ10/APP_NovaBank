import React, { useMemo, useState } from 'react';
import { Share, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import { Chip, Row } from '../../components/Primitives';
import TransactionRow from '../../components/TransactionRow';
import BottomSheet from '../../components/BottomSheet';
import { GhostButton, PrimaryButton } from '../../components/Buttons';
import Icon from '../../components/Icon';
import LanguageSwitch from '../../components/LanguageSwitch';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { money } from '../../lib/format';
import { useAppState } from '../../state/AppStateContext';
import { Tx } from '../../state/types';
import { useLanguage } from '../../i18n/LanguageContext';

const FILTER_KEYS = ['7d', '30d', '90d', 'all'] as const;
const LIMITS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, all: 100000 };

function groupLabel(daysAgo: number, t: (key: string) => string) {
  if (daysAgo === 0) return t('transactions.groupToday');
  if (daysAgo === 1) return t('transactions.groupYesterday');
  if (daysAgo <= 6) return t('transactions.groupThisWeek');
  if (daysAgo <= 29) return t('transactions.groupThisMonth');
  return t('transactions.groupEarlier');
}

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { transactions, refreshAccount } = useAppState();
  const [filter, setFilter] = useState<(typeof FILTER_KEYS)[number]>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Tx | null>(null);

  const filterLabel: Record<(typeof FILTER_KEYS)[number], string> = {
    '7d': t('transactions.filter7'),
    '30d': t('transactions.filter30'),
    '90d': t('transactions.filter90'),
    all: t('transactions.filterAll'),
  };

  const filtered = useMemo(() => transactions.filter((tx) => tx.daysAgo <= LIMITS[filter]), [transactions, filter]);

  const groups = useMemo(() => {
    const map = new Map<string, Tx[]>();
    filtered.forEach((tx) => {
      const g = groupLabel(tx.daysAgo, t);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(tx);
    });
    return Array.from(map.entries());
  }, [filtered, t]);

  const shareTx = (tx: Tx) => {
    const when = tx.daysAgo === 0 ? t('transactions.groupToday') : tx.daysAgo === 1 ? t('transactions.groupYesterday') : t('transactions.daysAgo', { n: tx.daysAgo });
    Share.share({
      message: [
        `NovaBank`,
        `${tx.name} — ${tx.meta}`,
        `${tx.kind === 'credit' ? '+' : '-'}${money(tx.amount)}`,
        `${when} · ${tx.time}`,
        `${t('transactions.referenceLabel')}: ${('NV-' + tx.id).toUpperCase()}`,
      ].join('\n'),
    }).catch(() => {});
  };

  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refreshAccount();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Screen padded={false} bg={theme.bg}>
      <View style={{ paddingHorizontal: 22, paddingTop: 10, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.heading, fontSize: 25, letterSpacing: -0.8, color: theme.ink }}>{t('transactions.title')}</Text>
          <Text style={{ marginTop: 5, fontFamily: fonts.body, fontSize: 12.5, color: theme.mid }}>{t('transactions.countInPeriod', { count: filtered.length })}</Text>
        </View>
        <LanguageSwitch />
      </View>

      <View style={{ marginTop: 16, paddingHorizontal: 22, flexDirection: 'row', gap: 8 }}>
        {FILTER_KEYS.map((f) => (
          <Chip key={f} label={filterLabel[f]} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>

      <View style={{ marginTop: 16, paddingHorizontal: 22 }}>
        {refreshing ? (
          <View style={{ borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, padding: 4 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: theme.line }}>
                <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: theme.tint }} />
                <View style={{ flex: 1, gap: 8 }}>
                  <View style={{ width: '55%', height: 12, borderRadius: 6, backgroundColor: theme.tint }} />
                  <View style={{ width: '35%', height: 10, borderRadius: 5, backgroundColor: theme.tint }} />
                </View>
                <View style={{ width: 60, height: 14, borderRadius: 7, backgroundColor: theme.tint }} />
              </View>
            ))}
          </View>
        ) : (
          groups.map(([label, items]) => (
            <View key={label} style={{ marginBottom: 18 }}>
              <Text style={{ fontFamily: fonts.headingBold, fontSize: 11.5, color: theme.soft, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 9 }}>{label}</Text>
              <View style={{ borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, overflow: 'hidden' }}>
                {items.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} showDate onPress={() => setSelected(tx)} />
                ))}
              </View>
            </View>
          ))
        )}

        <GhostButton label={t('transactions.refresh')} icon="sync" onPress={refresh} style={{ marginTop: 4 }} />
        <Text style={{ marginTop: 10, textAlign: 'center', fontFamily: fonts.body, fontSize: 11.5, color: theme.soft }}>
          {t('transactions.showingCount', { shown: filtered.length, total: transactions.length })}
        </Text>
      </View>

      <BottomSheet visible={!!selected} onClose={() => setSelected(null)}>
        {selected ? (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
              <View style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: selected.iconBg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={selected.icon} size={24} color={selected.iconFg} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.headingBold, fontSize: 15.5, color: theme.ink }}>{selected.name}</Text>
                <Text style={{ marginTop: 3, fontFamily: fonts.body, fontSize: 11.5, color: theme.soft }}>{selected.meta}</Text>
              </View>
            </View>
            <Text style={{ marginTop: 18, fontFamily: fonts.heading, fontSize: 32, letterSpacing: -1.2, color: selected.kind === 'credit' ? theme.green : theme.red }}>
              {selected.kind === 'credit' ? '+' : '−'}
              {money(selected.amount)}
            </Text>
            <View style={{ marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20, backgroundColor: theme.tint }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: theme.gold }}>{t('transactions.completed')}</Text>
            </View>
            <View style={{ marginTop: 18 }}>
              <Row
                label={t('transactions.dateLabel')}
                value={`${selected.daysAgo === 0 ? t('transactions.groupToday') : selected.daysAgo === 1 ? t('transactions.groupYesterday') : t('transactions.daysAgo', { n: selected.daysAgo })} · ${selected.time}`}
              />
              <Row label={t('transactions.categoryLabel')} value={selected.category} />
              <Row label={t('transactions.referenceLabel')} value={('NV-' + selected.id).toUpperCase()} />
            </View>
            <View style={{ marginTop: 20, flexDirection: 'row', gap: 10 }}>
              <GhostButton label={t('transactions.share')} icon="share" onPress={() => shareTx(selected)} style={{ flex: 1 }} />
              <PrimaryButton label={t('transactions.done')} onPress={() => setSelected(null)} style={{ width: 96 }} />
            </View>
          </View>
        ) : null}
      </BottomSheet>
    </Screen>
  );
}
