import { useMemo, useState } from 'react'
import Pagination from '../components/crud/Pagination.jsx'

// Pagination cote navigateur d'une liste deja chargee. La barre n'apparait
// que si elle sert (plus d'elements que la plus petite taille de page).
// `cle` : changer de filtre ou de recherche ramene a la page 1.
export default function usePagination(elements, { options = [5, 10, 25], parPage = options[1] ?? options[0], cle = '' } = {}) {
  const [etat, setEtat] = useState({ cle, page: 1 })
  const [lignes, setLignes] = useState(parPage)
  const total = elements.length
  const pages = Math.max(1, Math.ceil(total / lignes))
  const page = Math.min(etat.cle === cle ? etat.page : 1, pages)
  const visibles = useMemo(() => elements.slice((page - 1) * lignes, page * lignes), [elements, page, lignes])
  const barre = total > options[0] ? (
    <Pagination page={page} pageCount={pages} rowsPerPage={lignes} totalItems={total}
      onPageChange={(p) => setEtat({ cle, page: p })}
      onRowsPerPageChange={(n) => { setLignes(n); setEtat({ cle, page: 1 }) }}
      rowsOptions={options} />
  ) : null
  return { visibles, barre, page }
}
