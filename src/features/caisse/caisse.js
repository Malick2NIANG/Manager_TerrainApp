// Calculs de caisse (especes au comptoir) et texte du recu.
import { marque } from '../../config/marque'

/** Monnaie a rendre ; null si rien de saisi, negatif si la somme ne suffit pas. */
export function monnaie(recu, montant) {
  if (recu === '' || recu === null || recu === undefined) return null
  return Number(recu) - Number(montant)
}

/** Montants proposes : le compte juste, puis les arrondis courants au-dessus. */
export function sommesProposees(montant) {
  const m = Number(montant) || 0
  const pas = [1000, 5000, 10000]
  const s = new Set([m])
  for (const p of pas) s.add(Math.ceil(m / p) * p)
  for (const billet of [10000, 20000, 50000]) if (billet > m) s.add(billet)
  return [...s].filter((x) => x >= m).sort((a, b) => a - b).slice(0, 5)
}

const fcfa = (n) => `${Number(n || 0).toLocaleString('fr-FR').replace(/ | /g, ' ')} F CFA`
const echapper = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

/** Lignes du recu (testables) : [libelle, valeur]. */
export function lignesRecu(r, { moyens = {}, caissier } = {}) {
  const d = new Date(r.debut)
  const f = new Date(r.fin)
  const dateFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Dakar', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const heure = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Dakar', hour: '2-digit', minute: '2-digit' })
  const lignes = [
    ['Référence', r.reference],
    ['Client', r.clientNom],
    ['Terrain', `${r.terrain}${r.sport ? ` (${r.sport})` : ''}`],
    ['Date', dateFmt.format(d)],
    ['Créneau', `${heure.format(d)} – ${heure.format(f)}`],
    ['Paiement', moyens[r.moyenPaiement] || r.moyenPaiement],
    ['Montant payé', fcfa(r.montant)],
  ]
  if (r.especesRecues != null) {
    lignes.push(['Espèces reçues', fcfa(r.especesRecues)])
    lignes.push(['Monnaie rendue', fcfa(r.monnaieRendue)])
  }
  if (caissier) lignes.push(['Caissier', caissier])
  return lignes
}

/** Recu de caisse au format ticket (80 mm), pret a imprimer. */
export function htmlRecu(r, { etablissement, moyens, caissier, qr, emisLe = new Date(), pied = marque.piedDeRecu,
  logo = marque.personnalise ? marque.logo : '', marge = marque.margeEntreeMinutes } = {}) {
  const emis = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Dakar', dateStyle: 'short', timeStyle: 'short' }).format(emisLe)
  const lignes = lignesRecu(r, { moyens, caissier })
    .map(([l, v]) => `<tr><td>${echapper(l)}</td><td>${echapper(v)}</td></tr>`).join('')
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Reçu ${echapper(r.reference)}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body { width: 72mm; margin: 0 auto; font: 12px/1.35 'Courier New', monospace; color: #000; }
  h1 { margin: 0; font-size: 16px; text-align: center; letter-spacing: .04em; }
  .sous { margin: 2px 0 8px; text-align: center; font-size: 11px; }
  .titre { margin: 8px 0 4px; padding: 4px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; text-align: center; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 2px 0; vertical-align: top; }
  td:last-child { text-align: right; font-weight: 700; }
  .qr { margin: 10px auto 2px; text-align: center; }
  .qr img { width: 38mm; height: 38mm; }
  .code { text-align: center; font-size: 13px; font-weight: 700; letter-spacing: .08em; }
  .logo { display: block; width: 18mm; height: 18mm; margin: 0 auto 4px; object-fit: contain; }
  .pied { margin-top: 8px; padding-top: 6px; border-top: 1px dashed #000; text-align: center; font-size: 11px; }
</style></head><body>
  ${logo && /^\/marque\/[\w/.-]+$/.test(logo) ? `<img class="logo" src="${echapper(logo)}" alt="">` : ''}
  <h1>${echapper(etablissement)}</h1>
  <p class="sous">Reçu émis le ${echapper(emis)}</p>
  <p class="titre">REÇU DE PAIEMENT</p>
  <table>${lignes}</table>
  ${qr ? `<div class="qr"><img src="${qr}" alt=""></div>` : ''}
  <p class="code">${echapper(r.reference)}</p>
  <p class="pied">${qr ? `Présentez ce reçu (QR code) à l’entrée, au plus tôt ${Number(marge)} min avant.` : 'Donnez cette référence à l’entrée.'}<br>${echapper(pied)}</p>
</body></html>`
}

/** Imprime le recu (QR du ticket quand le code est connu) via un cadre invisible ; se resout une fois la fenetre d'impression fermee. */
export async function imprimerRecu(r, options) {
  let qr = null
  if (r.codeTicket) {
    try {
      const QRCode = (await import('qrcode')).default
      qr = await QRCode.toDataURL(r.codeTicket, { margin: 1, width: 300 })
    } catch {
      qr = null // le recu reste utile avec la reference seule
    }
  }
  const cadre = document.createElement('iframe')
  cadre.setAttribute('aria-hidden', 'true')
  Object.assign(cadre.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' })
  document.body.appendChild(cadre)
  const doc = cadre.contentWindow.document
  doc.open()
  doc.write(htmlRecu(r, { ...options, qr }))
  doc.close()
  await new Promise((ok) => {
    const img = doc.querySelector('img')
    if (!img || img.complete) ok()
    else { img.onload = ok; img.onerror = ok }
  })
  // Fin de l'impression (imprime ou annule) : on rend la main a l'app.
  const fini = new Promise((ok) => {
    cadre.contentWindow.addEventListener('afterprint', ok, { once: true })
    setTimeout(ok, 120_000)
  })
  cadre.contentWindow.focus()
  cadre.contentWindow.print()
  await fini
  cadre.remove()
}

/** Reimpression depuis le planning : le serveur rend le code du ticket (QR) et journalise. */
export async function reimprimerRecu(id, options, charger) {
  const r = await charger(`/reservations/${id}/recu`)
  await imprimerRecu(r, options)
  return r
}
