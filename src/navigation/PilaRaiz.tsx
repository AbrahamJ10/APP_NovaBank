import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ListaParametrosRaiz } from './tipos';
import PestanasApp from './PestanasApp';
import QrScreen from '../screens/app/QrScreen';
import WithdrawScreen from '../screens/app/WithdrawScreen';
import CardScreen from '../screens/app/CardScreen';
import ServicesScreen from '../screens/app/ServicesScreen';
import ServiceCatalogScreen from '../screens/app/ServiceCatalogScreen';
import ServiceLookupScreen from '../screens/app/ServiceLookupScreen';
import PayCardScreen from '../screens/app/PayCardScreen';
import ConciergeScreen from '../screens/app/ConciergeScreen';
import SecurityScreen from '../screens/app/SecurityScreen';
import DevicesScreen from '../screens/app/DevicesScreen';
import LimitsScreen from '../screens/app/LimitsScreen';
import ReportsScreen from '../screens/app/ReportsScreen';
import SpendScreen from '../screens/app/SpendScreen';

const Stack = createNativeStackNavigator<ListaParametrosRaiz>();

export default function PilaRaiz() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={PestanasApp} />
      <Stack.Screen name="Qr" component={QrScreen} />
      <Stack.Screen name="Withdraw" component={WithdrawScreen} />
      <Stack.Screen name="Card" component={CardScreen} />
      <Stack.Screen name="Services" component={ServicesScreen} />
      <Stack.Screen name="ServiceCatalog" component={ServiceCatalogScreen} />
      <Stack.Screen name="ServiceLookup" component={ServiceLookupScreen} />
      <Stack.Screen name="PayCard" component={PayCardScreen} />
      <Stack.Screen name="Concierge" component={ConciergeScreen} />
      <Stack.Screen name="Security" component={SecurityScreen} />
      <Stack.Screen name="Devices" component={DevicesScreen} />
      <Stack.Screen name="Limits" component={LimitsScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="Spend" component={SpendScreen} />
    </Stack.Navigator>
  );
}
