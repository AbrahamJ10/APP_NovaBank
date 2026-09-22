import React from 'react';
import { View } from 'react-native';
import { useAppState } from '../state/AppStateContext';

// Any touch anywhere in the app counts as activity and resets the
// inactivity timer — without this, the idle countdown only ever reset at
// login, so an actively-used session would still get logged out on a
// fixed schedule regardless of how much the person was interacting.
export default function ActivityTracker({ children }: { children: React.ReactNode }) {
  const { touch } = useAppState();
  return (
    <View style={{ flex: 1 }} onTouchStart={touch} onTouchMove={touch}>
      {children}
    </View>
  );
}
