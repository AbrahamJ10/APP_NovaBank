import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Screen from '../../components/Screen';
import { Row } from '../../components/Primitives';
import BottomSheet from '../../components/BottomSheet';
import { GhostButton, PrimaryButton } from '../../components/Buttons';
import Icon from '../../components/Icon';
import LanguageSwitch from '../../components/LanguageSwitch';
import { useTheme } from '../../theme/ThemeContext';
import { fonts } from '../../theme/tokens';
import { useAppState } from '../../state/AppStateContext';
import { NotificationItem } from '../../state/types';
import { useLanguage } from '../../i18n/LanguageContext';

export default function NotificationsScreen() {
  const nav = useNavigation<any>();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { notifications, markAllNotifRead, markNotifRead, clearNotifications } = useAppState();
  const unreadCount = notifications.filter((n) => n.unread).length;
  const [selected, setSelected] = useState<NotificationItem | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, typeof notifications>();
    notifications.forEach((n) => {
      if (!map.has(n.group)) map.set(n.group, []);
      map.get(n.group)!.push(n);
    });
    return Array.from(map.entries());
  }, [notifications]);

  const openDetail = (n: NotificationItem) => {
    setSelected(n);
    if (n.unread) markNotifRead(n.id);
  };

  const relatedAction = (n: NotificationItem | null) => {
    if (!n) return null;
    if (n.icon === 'gpp_maybe') return { label: t('notifications.actionDevices'), go: () => nav.navigate('Devices') };
    if (n.icon === 'bolt') return { label: t('notifications.actionPayService'), go: () => nav.navigate('Services') };
    if (n.icon === 'swap_horiz' || n.icon === 'shopping_cart' || n.icon === 'arrow_downward') return { label: t('notifications.actionTransactions'), go: () => nav.navigate('Transactions') };
    return null;
  };
  const action = relatedAction(selected);

  return (
    <Screen bg={theme.bg}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <View>
          <Text style={{ fontFamily: fonts.heading, fontSize: 25, letterSpacing: -0.8, color: theme.ink }}>{t('notifications.title')}</Text>
          <Text style={{ marginTop: 5, fontFamily: fonts.body, fontSize: 12.5, color: theme.mid }}>
            {unreadCount > 0 ? t('notifications.unread', { count: unreadCount }) : t('notifications.allRead')}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          <LanguageSwitch />
          {notifications.length > 0 && (
            <Pressable onPress={markAllNotifRead} style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 11, backgroundColor: theme.surf, borderWidth: 1.5, borderColor: theme.line }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: theme.mid }}>{t('notifications.markRead')}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={{ marginTop: 100, alignItems: 'center' }}>
          <View style={{ width: 110, height: 110, borderRadius: 34, backgroundColor: theme.tint, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="notifications_off" size={56} color="#D9BE7A" />
          </View>
          <Text style={{ marginTop: 22, fontFamily: fonts.heading, fontSize: 20, letterSpacing: -0.5, color: theme.ink }}>{t('notifications.emptyTitle')}</Text>
          <Text style={{ marginTop: 8, textAlign: 'center', fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19, color: theme.mid, maxWidth: 260 }}>
            {t('notifications.emptyBody')}
          </Text>
        </View>
      ) : (
        <View style={{ marginTop: 18, gap: 20 }}>
          {groups.map(([label, items]) => (
            <View key={label}>
              <Text style={{ fontFamily: fonts.headingBold, fontSize: 11, color: theme.soft, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Text>
              <View style={{ marginTop: 10, borderRadius: 20, backgroundColor: theme.surf, borderWidth: 1, borderColor: theme.line, overflow: 'hidden' }}>
                {items.map((n, i) => (
                  <Pressable
                    key={n.id}
                    onPress={() => openDetail(n)}
                    style={({ pressed }) => [
                      { flexDirection: 'row', gap: 13, padding: 16, borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: theme.line },
                      pressed && { backgroundColor: theme.tint },
                    ]}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: n.iconBg, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={n.icon} size={20} color={n.iconFg} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontFamily: fonts.headingBold, fontSize: 13, color: theme.ink }}>{n.title}</Text>
                        {n.unread ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: theme.gold }} /> : null}
                      </View>
                      <Text style={{ marginTop: 4, fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: theme.mid }}>{n.body}</Text>
                    </View>
                    <Icon name="chevron_right" size={18} color={theme.soft} />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
          <Pressable onPress={clearNotifications} style={{ alignSelf: 'center', marginTop: 4 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: theme.soft }}>{t('notifications.clearAll')}</Text>
          </Pressable>
        </View>
      )}

      <BottomSheet visible={!!selected} onClose={() => setSelected(null)}>
        {selected ? (
          <View>
            <View style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: selected.iconBg, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={selected.icon} size={24} color={selected.iconFg} />
            </View>
            <Text style={{ marginTop: 16, fontFamily: fonts.heading, fontSize: 19, letterSpacing: -0.5, color: theme.ink }}>{selected.title}</Text>
            <Text style={{ marginTop: 8, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: theme.mid }}>{selected.body}</Text>
            <View style={{ marginTop: 18 }}>
              <Row label={t('notifications.when')} value={`${selected.group} · ${selected.time}`} />
            </View>
            {action ? (
              <PrimaryButton
                label={action.label}
                onPress={() => {
                  setSelected(null);
                  action.go();
                }}
                style={{ marginTop: 18 }}
              />
            ) : null}
            <GhostButton label={t('notifications.close')} onPress={() => setSelected(null)} style={{ marginTop: 10 }} />
          </View>
        ) : null}
      </BottomSheet>
    </Screen>
  );
}
