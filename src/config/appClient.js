import { configuration } from './runtime.js'

// Adresse de l'App Client, pour ouvrir un terrain publie tel que le joueur le
// voit. Configuree (URL_APP_CLIENT / VITE_URL_APP_CLIENT) ou, en
// developpement, deduite : meme machine, port 5180. null si inconnue.
export function urlAppClient(lieu = window.location) {
  const configuree = configuration('URL_APP_CLIENT', import.meta.env.VITE_URL_APP_CLIENT, '')
  if (configuree) return configuree.replace(/\/+$/, '')
  if (lieu.port === '5181') return `${lieu.protocol}//${lieu.hostname}:5180`
  return null
}

export function urlTerrainClient(id, lieu) {
  const base = urlAppClient(lieu)
  return base ? `${base}/terrains/${id}` : null
}
