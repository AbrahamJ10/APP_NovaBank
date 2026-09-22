import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/tokens';
import { money } from '../lib/format';
import { Tx } from '../state/types';
import Icon from './Icon';

export default function TransactionRow({ tx, onPress, showDate }: { tx: Tx; onPress?: () => void; showDate?: boolean }) {
  const { theme } = useTheme();
  const colorMonto = tx.kind === 'credit' ? theme.green : theme.ink;
  const signo = tx.kind === 'credit' ? '+' : '−';
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.line,
      }}
    >
      <View style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: tx.iconBg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={tx.icon} size={21} color={tx.iconFg} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: theme.ink }}>
          {tx.name}
        </Text>
        <Text numberOfLines={1} style={{ marginTop: 3, fontFamily: fonts.body, fontSize: 11.5, color: theme.soft }}>
          {tx.meta}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontFamily: fonts.headingBold, fontSize: 14.5, color: colorMonto }}>
          {signo}
          {money(tx.amount)}
        </Text>
        {showDate ? <Text style={{ marginTop: 3, fontFamily: fonts.body, fontSize: 11, color: theme.soft }}>{tx.time}</Text> : null}
      </View>
    </Pressable>
  );
}
