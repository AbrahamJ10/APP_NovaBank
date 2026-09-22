import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ListaParametrosAuth } from './tipos';
import { usarEstadoApp } from '../state/ContextoEstadoApp';
import PantallaBienvenida from '../screens/auth/PantallaBienvenida';
import PantallaRegistro from '../screens/auth/PantallaRegistro';
import PantallaOtp from '../screens/auth/PantallaOtp';
import PantallaRegistroCompleto from '../screens/auth/PantallaRegistroCompleto';
import PantallaIniciarSesion from '../screens/auth/PantallaIniciarSesion';
import PantallaRecuperar from '../screens/auth/PantallaRecuperar';
import PantallaExpirada from '../screens/auth/PantallaExpirada';
import PantallaCapturaDni from '../screens/auth/PantallaCapturaDni';
import PantallaRegistroRostro from '../screens/auth/PantallaRegistroRostro';

const Stack = createStackNavigator<ListaParametrosAuth>();

export default function PilaAutenticacion() {
  const { expired } = usarEstadoApp();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={expired ? 'Expired' : 'Welcome'}>
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
