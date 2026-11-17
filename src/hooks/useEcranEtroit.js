import { useEffect, useState } from 'react'

const REQUETE = '(max-width: 760px)'

/** Vrai sur telephone (meme seuil que les styles). */
export default function useEcranEtroit() {
  const [etroit, setEtroit] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(REQUETE).matches)
  useEffect(() => {
    const mq = window.matchMedia?.(REQUETE)
    if (!mq) return undefined
    const maj = () => setEtroit(mq.matches)
    mq.addEventListener('change', maj)
    return () => mq.removeEventListener('change', maj)
  }, [])
  return Boolean(etroit)
}
