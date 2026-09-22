export function dinero(n: number) {
  return 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function mmss(segundosTotales: number) {
  const minutos = Math.floor(segundosTotales / 60);
  const segundos = segundosTotales % 60;
  return `${minutos}:${String(segundos).padStart(2, '0')}`;
}

export function enmascararCorreo(correo: string) {
  const [nombre, dominio] = correo.split('@');
  if (!dominio) return correo;
  return `${nombre.slice(0, 4)}···@${dominio}`;
}

export function enmascararTelefono(telefono: string) {
  return `+51 ··· ${telefono.slice(-3)}`;
}
