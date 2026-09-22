import FaceDetection, { Face } from '@react-native-ml-kit/face-detection';

export type FaceFailReason = 'no-face' | 'multiple-faces' | 'eyes-closed' | 'error';

export type FaceCheckResult = { ok: true; face: Face } | { ok: false; reason: FaceFailReason };

// Ejecuta detección facial real en el propio dispositivo (Google ML Kit)
// contra un fotograma capturado y aplica verificaciones simples y honestas
// cercanas a prueba de vida: debe haber exactamente un rostro presente y
// ambos ojos deben leerse como abiertos.
export async function runFaceCheck(uri: string): Promise<FaceCheckResult> {
  try {
    const faces = await FaceDetection.detect(uri, {
      performanceMode: 'accurate',
      classificationMode: 'all',
      landmarkMode: 'none',
      contourMode: 'none',
    });

    if (!faces || faces.length === 0) return { ok: false, reason: 'no-face' };
    if (faces.length > 1) return { ok: false, reason: 'multiple-faces' };

    const face = faces[0];
    const left = face.leftEyeOpenProbability ?? 1;
    const right = face.rightEyeOpenProbability ?? 1;
    if (left < 0.35 || right < 0.35) return { ok: false, reason: 'eyes-closed' };

    return { ok: true, face };
  } catch (e) {
    return { ok: false, reason: 'error' };
  }
}

export function faceFailMessage(reason: FaceFailReason, t: (key: string) => string) {
  switch (reason) {
    case 'no-face':
      return t('faceDetect.noFace');
    case 'multiple-faces':
      return t('faceDetect.multipleFaces');
    case 'eyes-closed':
      return t('faceDetect.eyesClosed');
    default:
      return t('faceDetect.error');
  }
}
