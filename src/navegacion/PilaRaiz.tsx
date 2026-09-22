import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ListaParametrosRaiz } from './tipos';
import PestanasApp from './PestanasApp';
import PantallaQr from '../pantallas/app/PantallaQr';
import PantallaRetiro from '../pantallas/app/PantallaRetiro';
import PantallaTarjeta from '../pantallas/app/PantallaTarjeta';
import PantallaServicios from '../pantallas/app/PantallaServicios';
import PantallaCatalogoServicios from '../pantallas/app/PantallaCatalogoServicios';
import PantallaConsultaServicio from '../pantallas/app/PantallaConsultaServicio';
import PantallaPagarTarjeta from '../pantallas/app/PantallaPagarTarjeta';
import PantallaAsistente from '../pantallas/app/PantallaAsistente';
import PantallaSeguridad from '../pantallas/app/PantallaSeguridad';
import PantallaDispositivos from '../pantallas/app/PantallaDispositivos';
import PantallaLimites from '../pantallas/app/PantallaLimites';
import PantallaReportes from '../pantallas/app/PantallaReportes';
import PantallaGastos from '../pantallas/app/PantallaGastos';

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
