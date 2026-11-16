// Position GPS d'un terrain (itineraire de l'App Client) : saisie libre
// "14.7256, -17.4569" ou lien Google Maps copie depuis le telephone
// (".../@14.7256,-17.4569,17z", "?q=14.7256,-17.4569", "!3d14.7256!4d-17.4569").
const NOMBRE = '(-?\\d{1,3}(?:\\.\\d+)?)';

/** { latitude, longitude } ou null si rien de lisible / hors limites. */
export function lireGps(saisie) {
  const t = String(saisie || '').trim();
  if (!t) return null;
  const motifs = [
    new RegExp(`!3d${NOMBRE}!4d${NOMBRE}`),
    new RegExp(`@${NOMBRE},${NOMBRE}`),
    new RegExp(`[?&](?:q|query|destination|ll)=${NOMBRE},\\s*${NOMBRE}`),
    new RegExp(`^${NOMBRE}\\s*[,;\\s]\\s*${NOMBRE}$`),
  ];
  for (const m of motifs) {
    const r = t.match(m);
    if (r) {
      const latitude = Number(r[1]);
      const longitude = Number(r[2]);
      if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
        return { latitude: Math.round(latitude * 1e6) / 1e6, longitude: Math.round(longitude * 1e6) / 1e6 };
      }
    }
  }
  return null;
}

export const gpsEnTexte = (lat, lng) => (lat == null || lng == null ? '' : `${lat}, ${lng}`);
