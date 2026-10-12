# Mesure du risque — tâche 1b
2026-10-12 · /build loyer-mer · page de mesure jetable `probe/` (non versionnée), servie compressée (gzip) comme le fera l'hébergeur.

**Question** (*Le risque* de la spec) : la carte des 34 746 communes réagit-elle à un réglage en ≤ 100 ms, et se charge-t-elle dans un temps raisonnable ?

**Décision** : contours Etalab **1 000 m** (`public/data/formes-1000m.json`, GeoJSON), recoloration par **un état par commune, en ne mettant à jour que les communes dont la couleur change**. Choix de Vincent le 2026-10-12, sur recommandation de Claude ; les **tuiles vectorielles** sont reportées à une tâche dédiée avant `/ship` ou `/launch` (elles régleraient le défaut côtier au zoom). Le fichier 100 m n'est pas versionné.

## (a) Réaction complète à un réglage
Réglage → 34 746 scores → tri des 10 premières → recoloration → image affichée (événement `idle` de MapLibre). Médiane de 10 essais.

| Contours | Méthode | Chromium, CPU ×1 | Chromium, CPU ×4 | Dont calcul + tri (×4) | Dont appels à la carte (×4) |
|---|---|---|---|---|---|
| 1 000 m | un état par commune, toutes | 87 ms | 108 ms | 6 ms | 13 ms |
| 1 000 m | un état par commune, **seulement celles qui changent** (≈ 1 550) | 80 ms | **86 ms** | 5 ms | 7 ms |
| 1 000 m | une seule expression de couleur | — | 260 ms | 5 ms | — |
| 100 m | état, toutes | 103 ms | 107 ms | 5 ms | 14 ms |
| 100 m | état, celles qui changent | 99 ms | 110 ms | 6 ms | 7 ms |
| 100 m | une seule expression | — | 325 ms | 5 ms | — |

Lecture : notre code (calcul, tri, appels) prend 7 à 20 ms même ralenti ×4. Le reste est le dessin de l'image, fait **sans carte graphique** dans le navigateur de test (rendu logiciel SwiftShader), qui ne dépend presque pas du ralentissement du processeur : la mesure de bureau est pessimiste sur ce point. L'expression unique est écartée (2,5 à 3 fois plus lente : MapLibre recalcule toutes les formes).

**Téléphone de Vincent** (Wi-Fi local, `probe/server.mjs` sur le Mac) : *en attente des chiffres*.

## (b) Première carte colorée, réseau ralenti
Du début de la navigation à la première image avec les communes colorées, fond Plan IGN en direct compris. Préréglages de Chrome DevTools.

| Contours | « Fast 4G » (9 Mb/s, 170 ms) | « Slow 4G » (1,6 Mb/s, 563 ms) |
|---|---|---|
| 1 000 m | **4,9 s** | 21,4 s |
| 100 m | 11,7 s | 57 s |

Seuil d'arrêt du plan : 10 s en « 4G » (marge sous les 15 s de H9). Tenu en 1 000 m sur « Fast 4G ». Sur « Slow 4G », le fond IGN seul (style, polices, tuiles) prend une vingtaine de secondes : ce n'est pas nos fichiers. À surveiller au lancement avec l'hypothèse « fond IGN en direct » de STATE.md.

## (c) Taille des fichiers
| Fichier | Brut | Compressé (gzip) |
|---|---|---|
| `communes.json` | 1,88 Mo | 0,59 Mo |
| `formes-1000m.json` | 7,24 Mo | 1,09 Mo |
| `formes-100m.json` (non versionné) | **28,61 Mo** | 7,36 Mo |
| JavaScript du site (MapLibre compris) + worker | 1,24 Mo + 0,51 Mo | 0,35 Mo + ≈ 0,14 Mo |

Le fichier 100 m dépasse la limite de 25 Mo par fichier de Cloudflare Pages : il demanderait un découpage.

## Captures
- France entière, 1 000 m : `captures/1b-1000m-france.png` · 100 m : `captures/1b-100m-france.png` — identiques à cette échelle.
- Zoom 12 sur Douarnenez, 1 000 m : `captures/1b-1000m-douarnenez.png` — la côte est taillée en lignes droites : la couleur déborde sur la mer à la pointe de Leydé et laisse la plage découverte. 100 m : `captures/1b-100m-douarnenez.png` — la côte suit le trait. **Défaut connu, gardé pour cette tranche.**

## Conditions d'arrêt du plan
- Aucune méthode ≤ 100 ms sur le téléphone : *à lire après la mesure de Vincent*.
- Un fichier brut > 25 Mo sans découpage simple : le fichier retenu fait 7,2 Mo. Non atteinte.
- Première carte au-delà de 10 s en « 4G » : 4,9 s (« Fast 4G »). Non atteinte.
