import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ListaParametrosPestanas } from './tipos';
import { usarTema } from '../theme/ContextoTema';
import { fuentes } from '../theme/estilos';
import Icono from '../components/Icono';
import PantallaInicio from '../screens/app/PantallaInicio';
import PantallaTransacciones from '../screens/app/PantallaTransacciones';
import PantallaTransferencia from '../screens/app/PantallaTransferencia';
import PantallaNotificaciones from '../screens/app/PantallaNotificaciones';
import PantallaPerfil from '../screens/app/PantallaPerfil';
import { usarIdioma } from '../i18n/ContextoIdioma';

const Tab = createBottomTabNavigator<ListaParametrosPestanas>();

const PESTANAS: { name: keyof ListaParametrosPestanas; labelKey: string; icon: string }[] = [
  { name: 'Home', labelKey: 'tabs.home', icon: 'home' },
  { name: 'Transactions', labelKey: 'tabs.transacciones', icon: 'receipt_long' },
  { name: 'Transfer', labelKey: 'tabs.transfer', icon: 'swap_horiz' },
  { name: 'Notifications', labelKey: 'tabs.notificaciones', icon: 'notificaciones' },
  { name: 'Profile', labelKey: 'tabs.profile', icon: 'person' },
];

export default function PestanasApp() {
  const { theme, dark } = usarTema();
  const { t } = usarIdioma();
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
        tabBarLabelStyle: { fontFamily: fuentes.bodyBold, fontSize: 10 },
      }}
    >
      {PESTANAS.map((pestana) => (
        <Tab.Screen
          key={pestana.name}
          name={pestana.name}
          component={
            pestana.name === 'Home'
              ? PantallaInicio
              : pestana.name === 'Transactions'
              ? PantallaTransacciones
              : pestana.name === 'Transfer'
              ? PantallaTransferencia
              : pestana.name === 'Notifications'
              ? PantallaNotificaciones
              : PantallaPerfil
          }
          options={{
            tabBarLabel: t(pestana.labelKey),
            tabBarIcon: ({ color }) => <Icono name={pestana.icon} size={23} color={color} />,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
