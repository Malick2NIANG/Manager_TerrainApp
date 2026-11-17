import Layout from '../../components/Layout.jsx'
import EnTetePage from '../../components/EnTetePage.jsx'
import { AIDES } from '../../components/aidesPages.js'
import StaffUserSection from '../../components/staff/StaffUserSection.jsx'

// Le Gerant gere l'Accueil et les Controleurs ; les comptes Gerant sont
// geres par l'Admin (voir features/manager/PersonnelManager.jsx).
const ROLES_GERES_PAR_GERANT = ['ACCUEIL', 'CONTROLEUR']

export default function Personnel() {
  return (
    <Layout>
      <EnTetePage titre="Équipe" resume="Accueil et contrôleurs du complexe" aide={AIDES.equipe} />

      <StaffUserSection
        roles={ROLES_GERES_PAR_GERANT}
        assignableRoles={ROLES_GERES_PAR_GERANT}
        eyebrow="Gestion du personnel"
        searchPlaceholder="Rechercher un nom, identifiant ou rôle…"
        emptyLabel="Aucun membre du personnel correspondant."
      />
    </Layout>
  )
}
