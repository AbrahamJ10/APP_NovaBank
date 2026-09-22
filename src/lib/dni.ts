// El código de barras del reverso del DNI peruano real (RENIEC) es un
// símbolo PDF417. Su contenido es texto plano delimitado por "@". El
// formato ha cambiado entre revisiones de la tarjeta, así que se procesa a
// la defensiva: se intenta el orden de campos comúnmente documentado que
// usa el DNIe azul actual, y siempre se recurre como respaldo a extraer un
// documento nacional de 8 dígitos del contenido crudo, para que el escaneo
// siga funcionando contra cualquier tarjeta real aunque un campo cambie de
// lugar.
export type DniData = {
  raw: string;
  dni?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  nombres?: string;
  fullName?: string;
};

export function parseDniBarcode(raw: string): DniData {
  const clean = raw.trim();
  const parts = clean.split('@');

  if (parts.length >= 6) {
    const [apellidoPaterno, apellidoMaterno, nombres, , , dni] = parts;
    const looksValid = /^\d{8}$/.test((dni || '').trim());
    if (looksValid) {
      const fullName = [nombres, apellidoPaterno, apellidoMaterno]
        .filter(Boolean)
        .map((s) => s?.trim())
        .join(' ');
      return {
        raw: clean,
        dni: dni.trim(),
        apellidoPaterno: apellidoPaterno?.trim(),
        apellidoMaterno: apellidoMaterno?.trim(),
        nombres: nombres?.trim(),
        fullName,
      };
    }
  }

  const digitMatch = clean.match(/\b\d{8}\b/);
  return { raw: clean, dni: digitMatch ? digitMatch[0] : undefined };
}
