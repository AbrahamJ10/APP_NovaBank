import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from './types';
import { useAppState } from '../state/AppStateContext';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import RegisterDoneScreen from '../screens/auth/RegisterDoneScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RecoverScreen from '../screens/auth/RecoverScreen';
import ExpiredScreen from '../screens/auth/ExpiredScreen';
import DniCaptureScreen from '../screens/auth/DniCaptureScreen';
import RegisterFaceScreen from '../screens/auth/RegisterFaceScreen';

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  const { expired } = useAppState();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={expired ? 'Expired' : 'Welcome'}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Expired" component={ExpiredScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="DniCapture" component={DniCaptureScreen} />
      <Stack.Screen name="RegisterFace" component={RegisterFaceScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="RegisterDone" component={RegisterDoneScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Recover" component={RecoverScreen} />
    </Stack.Navigator>
  );
}
