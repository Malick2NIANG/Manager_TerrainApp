import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Connexion from './auth/Connexion.jsx'
import { AuthProvider, useAuth } from './auth/AuthContext.jsx'
import AlertesApi from './components/AlertesApi.jsx'
import FiletErreur from './components/FiletErreur.jsx'
import { FluxPlanningProvider } from './hooks/useFluxPlanning.js'
import { NotificationsProvider } from './notifications/NotificationsContext.jsx'
import { ROLE_HOME, ROUTE_ROLES } from './auth/roles.js'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import NetworkStatus from './components/NetworkStatus.jsx'
import Layout from './components/Layout.jsx'
import PageSkeleton from './components/PageSkeleton.jsx'

// Back-office du complexe : connexion obligatoire (Gerant, Accueil,
// Controleur, Admin), chaque role arrive sur son espace.
const PAGES = {
  '/dashboard': lazy(() => import('./features/dashboard/Dashboard.jsx')),
  '/planning': lazy(() => import('./features/planning/Planning.jsx')),
  '/scan': lazy(() => import('./features/scan/Scan.jsx')),
  '/abonnements': lazy(() => import('./features/abonnements/Abonnements.jsx')),
  '/blocages': lazy(() => import('./features/terrains/Blocages.jsx')),
  '/terrains': lazy(() => import('./features/terrains/Terrains.jsx')),
  '/annonces': lazy(() => import('./features/annonces/Annonces.jsx')),
  '/avis': lazy(() => import('./features/avis/Avis.jsx')),
  '/personnel': lazy(() => import('./features/gerant/Personnel.jsx')),
  '/equipe': lazy(() => import('./features/manager/PersonnelManager.jsx')),
  '/journal-audit/:roleSlug': lazy(() => import('./features/manager/JournalAudit.jsx')),
}

function RoleHome() {
  const { role } = useAuth()
  return <Navigate to={role ? ROLE_HOME[role] : '/login'} replace />
}

// Services de la session : un seul flux temps reel du planning (partage par
// le planning, le tableau de bord et la cloche) et les notifications.
function ServicesSession({ children }) {
  const { role } = useAuth()
  return (
    <FluxPlanningProvider actif={Boolean(role) && role !== 'ADMIN'}>
      <NotificationsProvider>{children}</NotificationsProvider>
    </FluxPlanningProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ServicesSession>
        <BrowserRouter>
          <NetworkStatus />
          <AlertesApi />
          <FiletErreur>
            <Routes>
              <Route path="/login" element={<Connexion />} />
              {/* Lien nu du Journal d'audit : redirige sur la sous-page Gerant
                  (protege, pour que le "from" capture reste /journal-audit). */}
              <Route
                path="/journal-audit"
                element={
                  <ProtectedRoute roles={ROUTE_ROLES['/journal-audit']}>
                    <Navigate to="/journal-audit/gerant" replace />
                  </ProtectedRoute>
                }
              />
              {Object.entries(PAGES).map(([path, Page]) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <ProtectedRoute roles={ROUTE_ROLES[path]}>
                      <Suspense fallback={<Layout><PageSkeleton page={path.slice(1)} /></Layout>}>
                        <Page />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />
              ))}
              <Route path="*" element={<RoleHome />} />
            </Routes>
          </FiletErreur>
        </BrowserRouter>
      </ServicesSession>
    </AuthProvider>
  )
}
