// Journal d'audit : libelles des domaines (memes codes que le serveur) et
// jeu de donnees FICTIF utilise par les tests de l'ecran Journal d'audit.
export const DOMAINES_AUDIT = {
  RESERVATION: { label: 'Réservations', icon: 'fa-calendar-check' },
  TERRAIN: { label: 'Terrains', icon: 'fa-futbol' },
  SPORT: { label: 'Sports', icon: 'fa-medal' },
  BLOCAGE: { label: 'Blocages', icon: 'fa-ban' },
  OFFRE: { label: 'Offres', icon: 'fa-tags' },
  PERSONNEL: { label: 'Personnel', icon: 'fa-user-gear' },
  PAIEMENT: { label: 'Paiements', icon: 'fa-credit-card' },
  REGLAGE: { label: 'Réglages', icon: 'fa-sliders' },
}

const ACTEURS = {
  awa: { nom: 'Awa Ndiaye', role: 'GERANT' },
  ousmane: { nom: 'Ousmane Kane', role: 'GERANT' },
  moussa: { nom: 'Moussa Diop', role: 'ACCUEIL' },
  aminata: { nom: 'Aminata Ba', role: 'ACCUEIL' },
  ibrahima: { nom: 'Ibrahima Fall', role: 'CONTROLEUR' },
  pape: { nom: 'Pape Gueye', role: 'CONTROLEUR' },
}

// Aujourd'hui : [minutes ecoulees, acteur, domaine, action]
const ENTREES_DU_JOUR = [
  [3, 'moussa', 'RESERVATION', 'a enregistré la réservation RABC234 de Terrain A au comptoir (15 000 F CFA, especes)'],
  [7, 'ibrahima', 'RESERVATION', 'a validé l’entrée de la réservation RKP9X2M'],
  [12, 'awa', 'TERRAIN', 'a modifié le terrain « Terrain A »'],
  [18, 'moussa', 'RESERVATION', 'a annulé la réservation RZT4Q8N'],
  [26, 'awa', 'BLOCAGE', 'a bloqué Terrain B'],
  [41, 'awa', 'PERSONNEL', 'a créé le compte contrôleur de Cheikh Ba'],
  [58, 'ousmane', 'TERRAIN', 'a créé le terrain « Padel 2 » (10 000 F CFA / h)'],
  [125, 'pape', 'RESERVATION', 'a validé l’entrée de la réservation RM3H7WA'],
]

// Jours precedents : [jours avant aujourd'hui, heure, acteur, domaine, action]
const ENTREES_ANTERIEURES = [
  [1, '22:41', 'pape', 'RESERVATION', 'a validé l’entrée de la réservation R8DQ2KC'],
  [1, '19:20', 'aminata', 'RESERVATION', 'a annulé la réservation R5NV9TB'],
  [1, '16:05', 'ousmane', 'BLOCAGE', 'a levé un blocage'],
  [1, '11:10', 'awa', 'TERRAIN', 'a modifié le terrain « Grand terrain »'],
  [2, '15:26', 'ousmane', 'PERSONNEL', 'a généré un mot de passe temporaire pour Pape Gueye'],
  [2, '13:12', 'aminata', 'RESERVATION', 'a enregistré la réservation RQ6W4ZE de Padel 1 au comptoir (10 000 F CFA, wave)'],
  [3, '21:47', 'ibrahima', 'RESERVATION', 'a validé l’entrée de la réservation RT2B8VX'],
  [3, '17:02', 'awa', 'BLOCAGE', 'a bloqué tout le complexe'],
  [4, '12:30', 'ousmane', 'TERRAIN', 'a modifié le terrain « Terrain B »'],
  [5, '15:42', 'awa', 'PERSONNEL', 'a créé le compte accueil d’Aminata Ba'],
  [2, '18:30', 'moussa', 'RESERVATION', 'a enregistré la réservation RW2K7PD de Terrain B au comptoir (12 000 F CFA, especes)'],
  [3, '10:15', 'aminata', 'RESERVATION', 'a annulé la réservation RH8M3QS'],
  [4, '20:05', 'moussa', 'RESERVATION', 'a enregistré la réservation RC5T9LA de Grand terrain au comptoir (25 000 F CFA, orange-money)'],
  [5, '09:50', 'aminata', 'RESERVATION', 'a enregistré la réservation RL3F8NC de Padel 1 au comptoir (12 000 F CFA, especes)'],
  [6, '10:20', 'moussa', 'RESERVATION', 'a annulé la réservation RS6B2HY'],
  [6, '19:40', 'moussa', 'RESERVATION', 'a enregistré la réservation RJ4N6EB de Terrain A au comptoir (20 000 F CFA, wave)'],
  [7, '17:25', 'aminata', 'RESERVATION', 'a enregistré la réservation RP9V2XF de Padel 2 au comptoir (10 000 F CFA, especes)'],
  [8, '12:10', 'moussa', 'RESERVATION', 'a annulé la réservation RD7Q4WK'],
]

const chargeLe = new Date()

function dateAnterieure(jours, heure) {
  const [h, m] = heure.split(':').map(Number)
  const date = new Date(chargeLe)
  date.setDate(date.getDate() - jours)
  date.setHours(h, m, 0, 0)
  return date
}

// Du plus recent au plus ancien.
export const journalAudit = [
  ...ENTREES_DU_JOUR.map(([minutes, acteurId, domaine, action]) => (
    { acteurId, domaine, action, date: new Date(chargeLe.getTime() - minutes * 60000) }
  )),
  ...ENTREES_ANTERIEURES.map(([jours, heure, acteurId, domaine, action]) => (
    { acteurId, domaine, action, date: dateAnterieure(jours, heure) }
  )),
]
  .sort((a, b) => b.date - a.date)
  .map(({ acteurId, domaine, action, date }, i) => ({
    id: `audit-${i + 1}`,
    acteur: ACTEURS[acteurId],
    domaine,
    action,
    createdAt: date.toISOString(),
  }))
