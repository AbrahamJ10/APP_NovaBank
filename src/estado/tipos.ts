export type Tx = {
  id: string;
  name: string;
  meta: string;
  amount: number;
  kind: 'debit' | 'credit';
  icon: string;
  iconBg: string;
  iconFg: string;
  category: 'compras' | 'transferencias' | 'qr' | 'ingresos' | 'retiros' | 'servicios' | 'pago_tarjeta';
  daysAgo: number;
  time: string;
};

export type Payee = {
  id: string;
  name: string;
  bank: string;
  account: string;
  iniciales: string;
  inactive?: boolean;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  group: 'Hoy' | 'Ayer' | 'Esta semana';
  icon: string;
  iconBg: string;
  iconFg: string;
  unread: boolean;
};

export type ServiceBill = {
  id: string;
  billerKey: string;
  supplyNumber: string;
  name: string;
  meta: string;
  icon: string;
  amount: number;
  due: string;
  dueColor: 'ok' | 'warn';
  period: string;
  expiry: string;
  consumption: string;
  paid: boolean;
  suspended: boolean;
};

export type Session = 'checking' | 'out' | 'in';
