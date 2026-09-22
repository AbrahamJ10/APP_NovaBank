import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from './types';
import { useTheme } from '../theme/ThemeContext';
import { fonts } from '../theme/tokens';
import Icon from '../components/Icon';
import HomeScreen from '../screens/app/HomeScreen';
import TransactionsScreen from '../screens/app/TransactionsScreen';
import TransferScreen from '../screens/app/TransferScreen';
import NotificationsScreen from '../screens/app/NotificationsScreen';
import ProfileScreen from '../screens/app/ProfileScreen';
import { useLanguage } from '../i18n/LanguageContext';

const Tab = createBottomTabNavigator<TabParamList>();

const PESTANAS: { name: keyof TabParamList; labelKey: string; icon: string }[] = [
  { name: 'Home', labelKey: 'tabs.home', icon: 'home' },
  { name: 'Transactions', labelKey: 'tabs.transactions', icon: 'receipt_long' },
  { name: 'Transfer', labelKey: 'tabs.transfer', icon: 'swap_horiz' },
  { name: 'Notifications', labelKey: 'tabs.notifications', icon: 'notifications' },
  { name: 'Profile', labelKey: 'tabs.profile', icon: 'person' },
];

export default function AppTabs() {
  const { theme, dark } = useTheme();
  const { t } = useLanguage();
  const colorActivo = dark ? '#E7CE92' : '#133A63';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colorActivo,
        tabBarInactiveTintColor: theme.soft,
        tabBarStyle: {
          backgroundColor: theme.surf,
          borderTopColor: theme.line,
          borderTopWidth: 1,
          height: 86,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontFamily: fonts.bodyBold, fontSize: 10 },
      }}
    >
      {PESTANAS.map((pestana) => (
        <Tab.Screen
          key={pestana.name}
          name={pestana.name}
          component={
            pestana.name === 'Home'
              ? HomeScreen
              : pestana.name === 'Transactions'
              ? TransactionsScreen
              : pestana.name === 'Transfer'
              ? TransferScreen
              : pestana.name === 'Notifications'
              ? NotificationsScreen
              : ProfileScreen
          }
          options={{
            tabBarLabel: t(pestana.labelKey),
            tabBarIcon: ({ color }) => <Icon name={pestana.icon} size={23} color={color} />,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
