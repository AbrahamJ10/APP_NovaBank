// Real-world Peruvian DNI (RENIEC) back-of-card barcode is a PDF417 symbol.
// Its payload is "@"-delimited plain text. Layout has shifted across card
// revisions, so we parse defensively: try the commonly documented field
// order used by the current blue DNIe, and always fall back to pulling an
// 8-digit national ID out of the raw payload so scanning still succeeds
// against any real card even if a field shifts.
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
