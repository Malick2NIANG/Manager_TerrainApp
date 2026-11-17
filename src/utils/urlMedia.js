// Adresse d'un media affiche dans un src (img, video) : seulement un fichier
// choisi dans ce navigateur (blob:), une photo ou video du serveur
// (/api/v1/...), une image fournie avec l'app (/images/...) ou une adresse
// https. Tout le reste (javascript:, data:, autre) est remplace par "".
const SURE = /^(blob:|https:\/\/|\/api\/v1\/(photos|videos)\/|\/images\/)/

export function urlMediaSure(url) {
  const texte = String(url ?? '')
  return SURE.test(texte) ? texte : ''
}
