import { registerRootComponent } from 'expo';

import Aplicacion from './Aplicacion';

// registerRootComponent calls AppRegistry.registerComponent('main', () => Aplicacion);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Aplicacion);
