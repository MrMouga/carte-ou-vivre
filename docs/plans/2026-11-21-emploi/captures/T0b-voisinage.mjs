// Tâche 0b d'emploi — calcul jetable des villes principales à 30 km ou moins de chaque commune (la fonction de la page
// n'existe qu'en tâche 1). Règles : R46, H136 ; plan, « Distances » : de mairie à mairie (points de reperes.json, dans
// l'ordre de communes.json), `distanceKm` de src/proches/distance.ts (passée en paramètre, pour servir la même en Node et
// dans Chromium), comparée au km comme la mer (`kmCompare` de src/domain/score.ts, recopiée : Math.max(1, Math.round(km)))
// ; la ville principale elle-même : « sur place », 0 km. Tri des villes principales par latitude, puis calcul exact dans
// la bande : la distance sur la sphère est au moins R × |écart de latitude| ; « ≤ 30 km » une fois arrondi veut dire
// < 30,5 km ; une ville hors de la bande de ± 30,5 km de latitude ne peut donc pas passer.
// Fonction autonome (aucune variable extérieure) : sa source est injectée telle quelle dans Chromium.

/**
 * points : Float64Array, lon et lat alternés, dans l'ordre de communes.json.
 * villes : tableau de [indexBassin, indexCommuneDeLaVille] (bassins sans ville principale exclus : Monaco, 9399).
 * Rend, à plat (comme une liste par commune) : debut (Int32Array, n + 1), bassin (Int32Array), km (Uint8Array, 0 = sur place).
 */
export function villesA30km(points, villes, distanceKm) {
  const RAYON_KM = 6371;
  const BANDE = (30.5 / RAYON_KM) * (180 / Math.PI);
  const kmCompare = (km) => Math.max(1, Math.round(km));
  const tri = [...villes].sort((a, b) => points[2 * a[1] + 1] - points[2 * b[1] + 1]);
  const lats = Float64Array.from(tri, (v) => points[2 * v[1] + 1]);
  const n = points.length / 2;
  const debut = new Int32Array(n + 1);
  let bassin = new Int32Array(n * 8);
  let km = new Uint8Array(n * 8);
  let t = 0;
  for (let i = 0; i < n; i++) {
    debut[i] = t;
    const lon = points[2 * i], lat = points[2 * i + 1];
    let bas = 0, haut = lats.length;
    while (bas < haut) {
      const m = (bas + haut) >> 1;
      if (lats[m] < lat - BANDE) bas = m + 1;
      else haut = m;
    }
    for (let j = bas; j < lats.length && lats[j] <= lat + BANDE; j++) {
      const [b, iv] = tri[j];
      let k;
      if (iv === i) k = 0;
      else {
        k = kmCompare(distanceKm([lon, lat], [points[2 * iv], points[2 * iv + 1]]));
        if (k > 30) continue;
      }
      if (t === bassin.length) {
        const nb = new Int32Array(t * 2); nb.set(bassin); bassin = nb;
        const nk = new Uint8Array(t * 2); nk.set(km); km = nk;
      }
      bassin[t] = b; km[t] = k; t++;
    }
  }
  debut[n] = t;
  return { debut, bassin: bassin.subarray(0, t), km: km.subarray(0, t) };
}

/** Nombre de communes qui passent un métier à un niveau (R46) : `dansNiveau` = Uint8Array par index de bassin (1 si le
 * bassin est dans le niveau coché, en comptant les niveaux plus étroits). */
export function compterPassent(proches, dansNiveau) {
  const { debut, bassin } = proches;
  let n = 0;
  for (let i = 0; i + 1 < debut.length; i++) {
    for (let t = debut[i]; t < debut[i + 1]; t++) if (dansNiveau[bassin[t]]) { n++; break; }
  }
  return n;
}
