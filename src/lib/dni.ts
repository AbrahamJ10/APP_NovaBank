// El código de barras del reverso del DNI peruano real (RENIEC) es un
// símbolo PDF417. Su contenido es texto plano delimitado por "@". El
// formato ha cambiado entre revisiones de la tarjeta, así que se procesa a
// la defensiva: se intenta el orden de campos comúnmente documentado que
// usa el DNIe azul actual, y siempre se recurre como respaldo a extraer un
// documento nacional de 8 dígitos del contenido crudo, para que el escaneo
// siga funcionando contra cualquier tarjeta real aunque un campo cambie de
// lugar.
export type DatosDni = {
  raw: string;
  dni?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  nombres?: string;
  fullName?: string;
};

export function analizarCodigoBarrasDni(crudo: string): DatosDni {
  const limpio = crudo.trim();
  const partes = limpio.split('@');

  if (partes.length >= 6) {
    const [apellidoPaterno, apellidoMaterno, nombres, , , dni] = partes;
    const seVeValido = /^\d{8}$/.test((dni || '').trim());
    if (seVeValido) {
      const nombreCompleto = [nombres, apellidoPaterno, apellidoMaterno]
        .filter(Boolean)
        .map((s) => s?.trim())
        .join(' ');
      return {
        raw: limpio,
        dni: dni.trim(),
        apellidoPaterno: apellidoPaterno?.trim(),
        apellidoMaterno: apellidoMaterno?.trim(),
        nombres: nombres?.trim(),
        fullName: nombreCompleto,
      };
    }
  }

  const coincidenciaDigitos = limpio.match(/\b\d{8}\b/);
  return { raw: limpio, dni: coincidenciaDigitos ? coincidenciaDigitos[0] : undefined };
}
