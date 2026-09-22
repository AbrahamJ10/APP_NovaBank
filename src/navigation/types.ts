import type { Biller } from '../lib/api';

export type AuthStackParamList = {
  Welcome: undefined;
  Expired: undefined;
  Register: undefined;
  DniCapture: undefined;
  RegisterFace: undefined;
  Otp: undefined;
  RegisterDone: undefined;
  Login: undefined;
  Recover: undefined;
};

export type TabParamList = {
  Home: undefined;
  Transactions: undefined;
  Transfer: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  Qr: undefined;
  Withdraw: undefined;
  Card: undefined;
  Services: undefined;
  ServiceCatalog: undefined;
  ServiceLookup: { biller: Biller };
  PayCard: undefined;
  Concierge: undefined;
  Security: undefined;
  Devices: undefined;
  Limits: undefined;
  Reports: undefined;
  Spend: undefined;
};
