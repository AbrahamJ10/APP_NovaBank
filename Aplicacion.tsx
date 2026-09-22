import React, { useCallback, useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useFonts as useManrope, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { useFonts as useDmSans, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { useFonts as useCormorant, CormorantGaramond_600SemiBold, CormorantGaramond_700Bold } from '@expo-google-fonts/cormorant-garamond';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProveedorTema } from './src/theme/ContextoTema';
import { ProveedorIdioma } from './src/i18n/ContextoIdioma';
import { ProveedorEstadoApp } from './src/state/ContextoEstadoApp';
import NavegadorRaiz from './src/navigation/NavegadorRaiz';
import RastreadorActividad from './src/components/RastreadorActividad';

SplashScreen.preventAutoHideAsync().catch(() => {});

// One-time cleanup: an earlier build scheduled fake "you received dinero"
// local notificaciones every couple minutes as a demo. Now that balances and
// transacciones are real, those are gone from the code, but any still
// pending on the device (Android's AlarmManager keeps them independently of
// the JS bundle) need to be cancelled explicitly or they'd keep firing.
Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});

export default function Aplicacion() {
  const [manropeLoaded] = useManrope({ Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold });
  const [dmSansLoaded] = useDmSans({ DMSans_400Regular, DMSans_500Medium, DMSans_700Bold });
  const [cormorantLoaded] = useCormorant({ CormorantGaramond_600SemiBold, CormorantGaramond_700Bold });
  const [ready, setReady] = useState(false);

  const fontsReady = manropeLoaded && dmSansLoaded && cormorantLoaded;

  useEffect(() => {
    if (fontsReady) {
      setReady(true);
    }
  }, [fontsReady]);

  const onLayout = useCallback(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayout}>
      <SafeAreaProvider>
        <ProveedorTema>
          <ProveedorIdioma>
            <ProveedorEstadoApp>
              <RastreadorActividad>
                <NavegadorRaiz />
              </RastreadorActividad>
            </ProveedorEstadoApp>
          </ProveedorIdioma>
        </ProveedorTema>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
