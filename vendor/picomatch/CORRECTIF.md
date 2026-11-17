# picomatch 4.0.7 + correctif de sécurité (embarqué)

Copie de picomatch **4.0.7** avec le correctif proposé en amont pour
**GHSA-fc5q-39xc-vjpf / CVE-2026-112366** (ReDoS via les extglobs répétés à
une seule branche, ex. `+(*a)`), pour lequel aucune version corrigée n'est
publiée sur npm (toutes les versions <= 4.0.7 sont touchées).

- Source : https://github.com/micromatch/picomatch/pull/235
  (commit `0150ed18b7971894bfd1824c8f96d6b63c70ad1f`, basé sur le tag 4.0.7).
- Vérifié : les 1 986 tests de picomatch passent ; `isMatch('a'.repeat(28) + '!', '+(*a)')`
  répond en ~1 ms (plus de 60 s avec la 4.0.7 publiée).
- Utilisé via `overrides.picomatch` dans package.json (outils de dev : Vite,
  Vitest, Tailwind…). `npm audit` ne signale plus rien.

**À retirer** dès qu'une version corrigée de picomatch est publiée sur npm :
supprimer `vendor/picomatch` et l'entrée `overrides.picomatch`, puis `npm install`.
