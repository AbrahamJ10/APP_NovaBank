import type { Biller } from '../libreria/api';

export type ListaParametrosAuth = {
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

export type ListaParametrosPestanas = {
  Home: undefined;
  Transactions: undefined;
  Transfer: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type ListaParametrosRaiz = {
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
