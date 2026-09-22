import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ListaParametrosAuth } from './tipos';
import { usarEstadoApp } from '../estado/ContextoEstadoApp';
import PantallaBienvenida from '../pantallas/auth/PantallaBienvenida';
import PantallaRegistro from '../pantallas/auth/PantallaRegistro';
import PantallaOtp from '../pantallas/auth/PantallaOtp';
import PantallaRegistroCompleto from '../pantallas/auth/PantallaRegistroCompleto';
import PantallaIniciarSesion from '../pantallas/auth/PantallaIniciarSesion';
import PantallaRecuperar from '../pantallas/auth/PantallaRecuperar';
import PantallaExpirada from '../pantallas/auth/PantallaExpirada';
import PantallaCapturaDni from '../pantallas/auth/PantallaCapturaDni';
import PantallaRegistroRostro from '../pantallas/auth/PantallaRegistroRostro';

const Stack = createStackNavigator<ListaParametrosAuth>();

export default function PilaAutenticacion() {
  const { expirado } = usarEstadoApp();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={expirado ? 'Expired' : 'Welcome'}>
      <Stack.Screen name="Welcome" component={PantallaBienvenida} />
      <Stack.Screen name="Expired" component={PantallaExpirada} />
      <Stack.Screen name="Register" component={PantallaRegistro} />
      <Stack.Screen name="DniCapture" component={PantallaCapturaDni} />
      <Stack.Screen name="RegisterFace" component={PantallaRegistroRostro} />
      <Stack.Screen name="Otp" component={PantallaOtp} />
      <Stack.Screen name="RegisterDone" component={PantallaRegistroCompleto} />
      <Stack.Screen name="Login" component={PantallaIniciarSesion} />
      <Stack.Screen name="Recover" component={PantallaRecuperar} />
    </Stack.Navigator>
  );
}
