const PAGE_DETAILS = {
  planning: { title: 'Planning' },
  scan: { title: 'Scanner un ticket' },
  blocages: { title: 'Blocages' },
  terrains: { title: 'Terrains et tarifs' },
  horaires: { title: 'Horaires' },
  personnel: { title: 'Utilisateurs' },
  equipe: { title: 'Personnel' },
  'journal-audit': { title: 'Journal d’audit' },
}

function SkeletonBlock({ className = '' }) {
  return <span className={`page-skeleton-block ${className}`} />
}

// Valeur d'une carte KPI en attente de donnees : un bloc a la place du tiret.
export function KpiValueSkeleton() {
  return <SkeletonBlock className="is-kpi-value" />
}

// Liste "Prochains tickets / Prochaines livraisons" des tableaux de bord.
export function ActivityListSkeleton({ count = 3 }) {
  return (
    <ul className="dashboard-activity-list" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="page-skeleton-activity-row">
          <SkeletonBlock className="is-activity-icon" />
          <span className="page-skeleton-activity-text">
            <SkeletonBlock className="is-activity-title" />
            <SkeletonBlock className="is-activity-detail" />
          </span>
          <SkeletonBlock className="is-activity-meta" />
        </li>
      ))}
    </ul>
  )
}

// Tableau des comptes du personnel.
export function TableRowsSkeleton({ columns = 6, rows = 5 }) {
  return (
    <div className="staff-users-table-wrap" aria-hidden="true">
      <table className="staff-users-table">
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }, (_, c) => (
                <td key={c}><SkeletonBlock className={c === 0 ? 'is-cell-wide' : 'is-cell'} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="page-skeleton-dashboard" aria-hidden="true">
      <section className="page-skeleton-dashboard-intro">
        <div>
          <SkeletonBlock className="is-eyebrow" />
          <SkeletonBlock className="is-dashboard-title" />
          <SkeletonBlock className="is-dashboard-description" />
        </div>
        <SkeletonBlock className="is-role-badge" />
      </section>

      <section className="page-skeleton-stat-grid">
        {Array.from({ length: 3 }, (_, index) => (
          <article className="page-skeleton-stat-card" key={index}>
            <div className="page-skeleton-stat-heading">
              <SkeletonBlock className="is-stat-label" />
              <SkeletonBlock className="is-stat-tag" />
            </div>
            <div className="page-skeleton-stat-value">
              <SkeletonBlock className="is-stat-number" />
              <SkeletonBlock className="is-stat-detail" />
            </div>
          </article>
        ))}
      </section>

      <section className="page-skeleton-lower-grid">
        <article className="page-skeleton-panel">
          <SkeletonBlock className="is-eyebrow" />
          <SkeletonBlock className="is-panel-title" />
          <SkeletonBlock className="is-panel-copy" />
          <SkeletonBlock className="is-panel-action" />
        </article>
        <article className="page-skeleton-panel is-muted">
          <SkeletonBlock className="is-eyebrow" />
          <SkeletonBlock className="is-panel-title is-title-short" />
          <SkeletonBlock className="is-panel-copy" />
        </article>
      </section>
    </div>
  )
}

export default function PageSkeleton({ page }) {
  return (
    <section className={`page-skeleton page-skeleton-${page}`} role="status" aria-busy="true">
      <span className="page-skeleton-announcement">Chargement de la page…</span>
      {page === 'dashboard' ? (
        <DashboardSkeleton />
      ) : (
        <div className="dashboard-panel page-skeleton-placeholder" aria-hidden="true">
          <SkeletonBlock className="is-eyebrow" />
          <SkeletonBlock className="is-placeholder-title" />
          <SkeletonBlock className="is-placeholder-copy" />
          <span className="page-skeleton-placeholder-label">{PAGE_DETAILS[page]?.title}</span>
        </div>
      )}
    </section>
  )
}
