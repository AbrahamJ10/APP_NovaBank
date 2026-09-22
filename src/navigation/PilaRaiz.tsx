import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ListaParametrosRaiz } from './tipos';
import PestanasApp from './PestanasApp';
import PantallaQr from '../screens/app/PantallaQr';
import PantallaRetiro from '../screens/app/PantallaRetiro';
import PantallaTarjeta from '../screens/app/PantallaTarjeta';
import PantallaServicios from '../screens/app/PantallaServicios';
import PantallaCatalogoServicios from '../screens/app/PantallaCatalogoServicios';
import PantallaConsultaServicio from '../screens/app/PantallaConsultaServicio';
import PantallaPagarTarjeta from '../screens/app/PantallaPagarTarjeta';
import PantallaAsistente from '../screens/app/PantallaAsistente';
import PantallaSeguridad from '../screens/app/PantallaSeguridad';
import PantallaDispositivos from '../screens/app/PantallaDispositivos';
import PantallaLimites from '../screens/app/PantallaLimites';
import PantallaReportes from '../screens/app/PantallaReportes';
import PantallaGastos from '../screens/app/PantallaGastos';

const Stack = createNativeStackNavigator<ListaParametrosRaiz>();

export default function PilaRaiz() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={PestanasApp} />
      <Stack.Screen name="Qr" component={PantallaQr} />
      <Stack.Screen name="Withdraw" component={PantallaRetiro} />
      <Stack.Screen name="Card" component={PantallaTarjeta} />
      <Stack.Screen name="Services" component={PantallaServicios} />
      <Stack.Screen name="ServiceCatalog" component={PantallaCatalogoServicios} />
      <Stack.Screen name="ServiceLookup" component={PantallaConsultaServicio} />
      <Stack.Screen name="PayCard" component={PantallaPagarTarjeta} />
      <Stack.Screen name="Concierge" component={PantallaAsistente} />
      <Stack.Screen name="Security" component={PantallaSeguridad} />
      <Stack.Screen name="Devices" component={PantallaDispositivos} />
      <Stack.Screen name="Limits" component={PantallaLimites} />
      <Stack.Screen name="Reports" component={PantallaReportes} />
      <Stack.Screen name="Spend" component={PantallaGastos} />
    </Stack.Navigator>
  );
}
