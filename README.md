# Manager_TerrainApp

Back-office de **TerrainApp** (réservation de terrains de sport en marque blanche),
pour le personnel du complexe. Conçu pour ordinateur, utilisable sur tablette et téléphone.
Même base que le back-office SenYummies.

| Rôle | Écrans |
|---|---|
| Gérant | tableau de bord, planning, scan, blocages, terrains et tarifs, horaires, utilisateurs (Accueil, Contrôleurs) |
| Accueil | planning (réservation au comptoir, annulation), scan, blocages |
| Contrôleur | scan des tickets à l'entrée, planning en lecture |
| Admin | comptes Gérant, journal d'audit |

## Lancer en local

Il faut aussi le backend démarré. Pour lancer les trois applications ensemble et faire le vrai parcours, suivre le guide [`LANCER-EN-LOCAL.md`](https://github.com/Malick2NIANG/Backend_TerrainApp/blob/main/LANCER-EN-LOCAL.md) du dépôt Backend.

```bash
cp .env.example .env     # VITE_API_BASE_URL=/api/v1
npm ci
npm run dev              # http://localhost:5181
```

Le backend (`Backend_TerrainApp`, `docker compose up`, port 8090) doit tourner :
le serveur Vite lui relaie `/api/v1`. Comptes : `gerant`, `accueil`, `controleur`,
`admin` (mots de passe dans le `.env` du backend).

## Contrôles

```bash
npm run lint && npm test && npm run build
```

Marque blanche : `VITE_MARQUE_*` en développement, `MARQUE_*` en Docker (voir `.env.example`).
