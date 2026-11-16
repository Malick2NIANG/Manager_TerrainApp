import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Personnel from './Personnel.jsx'
import { apiGet } from '../../api/client.js'

// Le Gerant ne gere que l'Accueil et les Controleurs : ni l'Admin, ni les
// autres comptes Gerant (geres par l'Admin, voir PersonnelManager.test.jsx).

vi.mock('../../components/Layout.jsx', () => ({
  default: ({ children }) => <>{children}</>,
}))

vi.mock('../../auth/AuthContext.jsx', () => ({
  useAuth: () => ({ username: 'gerant' }),
}))

vi.mock('../../api/client.js', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}))

const TOUS_LES_COMPTES = [
  { id: '1', firstName: 'Moussa', lastName: 'Diop', username: 'accueil', role: 'ACCUEIL', active: true, phone: '', cni: '' },
  { id: '2', firstName: 'Ibra', lastName: 'Fall', username: 'controleur', role: 'CONTROLEUR', active: true, phone: '', cni: '' },
  { id: '3', firstName: 'Khadidiatou', lastName: 'Sow', username: 'accueil2', role: 'ACCUEIL', active: true, phone: '', cni: '' },
  { id: '4', firstName: 'Ousmane', lastName: 'Kane', username: 'gerant', role: 'GERANT', active: true, phone: '', cni: '' },
  { id: '5', firstName: 'Fatou', lastName: 'Sarr', username: 'admin', role: 'ADMIN', active: true, phone: '', cni: '' },
]

describe('Personnel page (Gérant)', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('n’affiche ni l’Admin ni les autres comptes Gérant, seulement Accueil/Contrôleur', async () => {
    apiGet.mockResolvedValue(TOUS_LES_COMPTES)
    render(<Personnel />)

    await waitFor(() => expect(screen.getByText('Moussa Diop')).toBeInTheDocument())
    expect(screen.getByText('Ibra Fall')).toBeInTheDocument()
    expect(screen.getByText('Khadidiatou Sow')).toBeInTheDocument()
    expect(screen.queryByText('Ousmane Kane')).not.toBeInTheDocument()
    expect(screen.queryByText('Fatou Sarr')).not.toBeInTheDocument()

    // Compteur « Tous » : seulement les 3 comptes geres par le Gerant.
    const tousOnglet = screen.getByRole('tab', { name: /Tous/ })
    expect(within(tousOnglet).getByText('3')).toBeInTheDocument()
  })

  it('ne propose que Accueil/Contrôleur comme rôle assignable à la création', async () => {
    apiGet.mockResolvedValue(TOUS_LES_COMPTES)
    render(<Personnel />)

    await waitFor(() => expect(screen.getByText('Moussa Diop')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Créer un compte/ }))

    const roleSelect = screen.getByLabelText('Rôle')
    const options = within(roleSelect).getAllByRole('option').map((option) => option.textContent)
    expect(options).toEqual(['Accueil', 'Contrôleur'])
  })
})
