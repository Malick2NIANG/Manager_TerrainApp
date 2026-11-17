import { useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import EnTetePage from '../../components/EnTetePage.jsx'
import { AIDES } from '../../components/aidesPages.js'
import StaffUserSection from '../../components/staff/StaffUserSection.jsx'
import StatFilterCards from '../../components/crud/StatFilterCards.jsx'
import { apiGet } from '../../api/client.js'

// Page Personnel de l'Admin : les comptes Gerant (CRUD complet) et, en
// lecture seule, le reste de l'equipe (gere au quotidien par le Gerant).
const ROLES_GERANTS = ['GERANT']
const ROLES_AUTRES_EMPLOYES = ['ACCUEIL', 'CONTROLEUR']

const GROUPES = [
  { key: 'GERANTS', label: 'Gérants', icon: 'fa-user-tie', accent: '#17365d', accentBg: '#e5edf5' },
  { key: 'AUTRES', label: 'Autres', icon: 'fa-users', accent: '#1f6f57', accentBg: '#e2f2ec' },
]

export default function PersonnelManager() {
  const [groupe, setGroupe] = useState('GERANTS')
  const [allUsers, setAllUsers] = useState([])

  useEffect(() => {
    let actif = true
    apiGet('/staff-users')
      .then((data) => { if (actif) setAllUsers(data) })
      .catch(() => {})
    return () => { actif = false }
  }, [])

  const counts = useMemo(() => ({
    GERANTS: allUsers.filter((user) => ROLES_GERANTS.includes(user.role)).length,
    AUTRES: allUsers.filter((user) => ROLES_AUTRES_EMPLOYES.includes(user.role)).length,
  }), [allUsers])

  return (
    <Layout>
      <EnTetePage titre="Personnel" resume="Comptes Gérant et reste de l’équipe" aide={AIDES.personnel} />

      <StatFilterCards
        items={GROUPES.map((item) => ({ ...item, value: counts[item.key] }))}
        selected={groupe}
        onSelect={setGroupe}
        ariaLabel="Filtrer le personnel par groupe"
      />

      {groupe === 'GERANTS' ? (
        <StaffUserSection
          key="gerants"
          roles={ROLES_GERANTS}
          assignableRoles={ROLES_GERANTS}
          title="Gérants"
          headingId="personnel-gerants-titre"
          description="Créez, modifiez ou désactivez les comptes Gérant. Cliquez le badge de statut pour activer ou désactiver un compte."
          searchPlaceholder="Rechercher un gérant…"
          emptyLabel="Aucun compte Gérant pour le moment."
          createLabel="Créer un compte Gérant"
          hideStatusFilter
          compactStatusActions
        />
      ) : (
        <StaffUserSection
          key="autres"
          roles={ROLES_AUTRES_EMPLOYES}
          readOnly
          title="Équipe (lecture seule)"
          headingId="personnel-equipe-titre"
          description="L’Accueil et les Contrôleurs sont gérés par le Gérant — vue de consultation uniquement."
          searchPlaceholder="Rechercher un employé…"
          emptyLabel="Aucun employé pour le moment."
          hideStatusFilter
        />
      )}
    </Layout>
  )
}
