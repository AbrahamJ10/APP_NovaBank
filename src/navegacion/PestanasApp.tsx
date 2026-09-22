import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ListaParametrosPestanas } from './tipos';
import { usarTema } from '../tema/ContextoTema';
import { fuentes } from '../tema/estilos';
import Icono from '../componentes/Icono';
import PantallaInicio from '../pantallas/app/PantallaInicio';
import PantallaTransacciones from '../pantallas/app/PantallaTransacciones';
import PantallaTransferencia from '../pantallas/app/PantallaTransferencia';
import PantallaNotificaciones from '../pantallas/app/PantallaNotificaciones';
import PantallaPerfil from '../pantallas/app/PantallaPerfil';
import { usarIdioma } from '../i18n/ContextoIdioma';

const Tab = createBottomTabNavigator<ListaParametrosPestanas>();

const PESTANAS: { name: keyof ListaParametrosPestanas; labelKey: string; icon: string }[] = [
  { name: 'Home', labelKey: 'tabs.home', icon: 'home' },
  { name: 'Transactions', labelKey: 'tabs.transactions', icon: 'receipt_long' },
  { name: 'Transfer', labelKey: 'tabs.transfer', icon: 'swap_horiz' },
  { name: 'Notifications', labelKey: 'tabs.notifications', icon: 'notifications' },
  { name: 'Profile', labelKey: 'tabs.profile', icon: 'person' },
];

export default function PestanasApp() {
  const { tema, oscuro } = usarTema();
  const { t } = usarIdioma();
  const colorActivo = oscuro ? '#E7CE92' : '#133A63';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colorActivo,
        tabBarInactiveTintColor: tema.suave,
        tabBarStyle: {
          backgroundColor: tema.superficie,
          borderTopColor: tema.linea,
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
