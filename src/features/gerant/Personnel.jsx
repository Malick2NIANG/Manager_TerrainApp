import Layout from '../../components/Layout.jsx'
import StaffUserSection from '../../components/staff/StaffUserSection.jsx'

// Le Gerant gere l'Accueil et les Controleurs ; les comptes Gerant sont
// geres par l'Admin (voir features/manager/PersonnelManager.jsx).
const ROLES_GERES_PAR_GERANT = ['ACCUEIL', 'CONTROLEUR']

export default function Personnel() {
  return (
    <Layout>
      <section className="dashboard-intro">
        <div>
          <p className="manager-eyebrow">Gérance</p>
          <h1>Utilisateurs</h1>
          <p>Gérez les accès, les rôles et les mots de passe de l’Accueil et des Contrôleurs.</p>
        </div>
      </section>

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
