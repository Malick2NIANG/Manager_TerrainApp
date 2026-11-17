import { useEffect, useRef } from 'react'
import { API_BASE_URL } from '../api/client.js'

// Flux public du serveur (SSE, sans compte) : « terrains », « annonces »,
// « disponibilites ». Sert a garder a jour un ecran du Manager ouvert sur
// plusieurs postes (un gerant publie un terrain, l'autre poste le voit).
// EventSource se reconnecte seul apres une coupure.
export default function useChangementsPublics(sujets, rappel) {
  const ref = useRef(rappel)
  ref.current = rappel
  const cle = sujets.join('|')

  useEffect(() => {
    if (typeof EventSource === 'undefined') return undefined
    const source = new EventSource(`${API_BASE_URL}/temps-reel/public`)
    source.addEventListener('changement', (e) => {
      try {
        const { sujet } = JSON.parse(e.data)
        if (cle.split('|').includes(sujet)) ref.current(sujet)
      } catch { /* message illisible : ignore */ }
    })
    return () => source.close()
  }, [cle])
}
