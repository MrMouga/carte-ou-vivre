"""Tâche 0c de services (script jetable) : écrit le tableau du risque depuis la mesure.

Usage : python3 -I T0c-3-tableau.py <T0c-mesure.json> <T0c-explications.csv> <cache-ign.jsonl> <sortie.md>
Sans fichier d'explications complet, s'arrête en listant les lignes « autre côté » qui n'en ont pas.
"""
import csv
import json
import math
import sys

ORDINAIRES = ['32013', '76351', '85194', '48095', '74056', '05157']
EXTREMES = ['06163', '04155', '29238', '85001']
AC13 = {  # valeurs d'AC-13 (acceptance.json), par code et service
    '32013': {'medecin', 'commerce', 'creche', 'ecole', 'college', 'lycee', 'superieur', 'gare', 'gare_regionale',
              'gare_grandes_lignes'},
    '48095': {'superieur', 'gare', 'gare_regionale', 'gare_grandes_lignes'},
    '85194': {'gare_grandes_lignes'},
}
LIBELLE = {
    'medecin': 'Médecin', 'commerce': 'Commerce alimentaire', 'creche': 'Crèche', 'ecole': 'École',
    'college': 'Collège', 'lycee': 'Lycée', 'superieur': 'Supérieur', 'gare': 'Gare', 'gare_regionale': 'Gare régionale',
    'gare_grandes_lignes': 'Gare grandes lignes',
}
CRANS = {s: [5, 10, 15] if s in ('medecin', 'commerce') else [10, 20, 30] if s.startswith('gare') else [5, 10, 20]
         for s in LIBELLE}
TYPE = {
    'D265': 'médecin', 'B104': 'hypermarché', 'B105': 'supermarché', 'B201': 'supérette', 'B202': 'épicerie',
    'D502': 'crèche', 'C107': 'école maternelle', 'C108': 'école primaire', 'C109': 'école élémentaire',
    'C201': 'collège', 'C301': 'lycée général ou technologique', 'C302': 'lycée professionnel', 'C501': 'UFR',
    'C502': 'institut universitaire', 'C503': "école d'ingénieurs", 'C504': 'enseignement supérieur privé',
    'C505': 'école supérieure agricole', 'C509': 'autre enseignement supérieur', 'E107': 'gare nationale',
    'E108': 'gare régionale', 'E109': 'gare locale',
}


def arrondi(m):
    return max(1, math.floor(m + 0.5))


def fr(x, d=1):
    return f'{x:.{d}f}'.replace('.', ',')


def site_txt(v):
    return 'pas de chiffre' if v is None else 'plus d\'une heure' if v == 61 else f'{v} min'


def crans_franchis(site, ign, crans):
    """Crans de part et d'autre desquels tombent les deux temps (site arrondi, IGN arrondi comme H156)."""
    if site is None or ign is None:
        return []
    i = arrondi(ign)
    return [c for c in crans if (site <= c) != (i <= c)]


def vers_txt(e):
    if e is None:
        return '—'
    if e['type'] == '61 gares':
        return f"{e['commune']} (gare « {e['nom']} », une des 61 gares ajoutées)"
    return f"{e['commune']} ({TYPE[e['type']]})"


def main(mesure_path, expl_path, cache_path, out_path):
    m = json.load(open(mesure_path, encoding='utf-8'))
    expl = {}
    with open(expl_path, encoding='utf-8', newline='') as f:
        for r in csv.DictReader(f):
            expl[(r['code'], r['service'])] = r['explication']
    heures = sorted(json.loads(l)['heure'] for l in open(cache_path, encoding='utf-8'))
    comptes = {}
    for l in open(cache_path, encoding='utf-8'):
        v = json.loads(l).get('version')
        if v:
            comptes[v] = comptes.get(v, 0) + 1
    versions = [f'{v} ({n} réponses)' for v, n in sorted(comptes.items())]
    erreurs = sum(1 for l in open(cache_path, encoding='utf-8') if 'erreur' in json.loads(l))

    lignes = m['resultats']
    for r in lignes:
        r['franchis'] = crans_franchis(r['site'], r['ign_min'], CRANS[r['service']])
        r['franchis_3'] = crans_franchis(r['site'], r['ign_min_3'], CRANS[r['service']])
    manquantes = [(r['code'], r['service']) for r in lignes if r['franchis'] and (r['code'], r['service']) not in expl]
    if manquantes:
        for c, s in manquantes:
            r = next(x for x in lignes if x['code'] == c and x['service'] == s)
            print('SANS EXPLICATION', c, r['commune'], s, 'site', r['site'], 'ign', r['ign_min'], '(3 :', r['ign_min_3'], ')',
                  'crans', r['franchis'], 'carreau mairie', r['insee_carreau_mairie'], 'parts', r['part_habitants_sous_cran'],
                  'vers', vers_txt(r['retenu']), 'route', r['retenu']['ign']['distance'] if r['retenu'] else None,
                  'vol', r['retenu']['vol_km'] if r['retenu'] else None)
        sys.exit(1)

    par_commune = {}
    for r in lignes:
        par_commune.setdefault(r['code'], []).append(r)
    nb = {c: sum(1 for r in par_commune[c] if r['franchis']) for c in par_commune}
    vides = [r for r in lignes if r['ign_min'] is None]
    elargies = [r for r in lignes if r['franchis'] != r['franchis_3']]
    total = sum(nb.values())

    o = []
    w = o.append
    w('# Les temps des services sont-ils crédibles ? 10 communes confrontées à l\'itinéraire de l\'IGN')
    w('')
    w(f"2026-11-24 · tâche 0c de /build services · **à juger par Vincent à la démo** (pas avant, choix du 2026-11-24) · "
      f"Spec : [« Le risque »](../../specs/2026-11-23-services/spec.md), D12, R52 · Mesure faite le {m['date']}")
    w('')
    w('## En bref')
    w(f"- **{len(lignes)} lignes** (10 communes × 10 services) ; {len(vides)} ligne sans temps de l'IGN "
      f"({erreurs} demande en erreur sur {len(heures)}).")
    w(f"- **{total} lignes « autre côté »** : le temps du site et celui de l'IGN tombent de part et d'autre d'une pastille.")
    w('  - Communes ordinaires : ' + ' · '.join(f"{par_commune[c][0]['commune']} **{nb[c]}**" for c in ORDINAIRES) + '.')
    w('  - Extrêmes : ' + ' · '.join(f"{par_commune[c][0]['commune']} **{nb[c]}**" for c in EXTREMES) + '.')
    touche = [r for r in lignes if r['franchis'] and r['service'] in AC13.get(r['code'], set())]
    w(f"- Lignes « autre côté » qui touchent une valeur d'AC-13 : **{len(touche)}**"
      + (' (' + ', '.join(f"{r['commune']} {LIBELLE[r['service']]}" for r in touche) + ').' if touche else '.'))
    w("- Un drapeau n'est pas un verdict : il dit où regarder. Chaque drapeau a une explication **proposée** ; "
      "c'est toi qui tranches.")
    w('')
    w('## Comment juger (règle de « Le risque », spec)')
    w("- **Faux** = du mauvais côté d'une pastille : avec le temps du site, la commune passe un filtre (par exemple "
      "« Médecin 10 min ») alors qu'en vrai elle ne le passerait pas, ou l'inverse. Un écart de quelques minutes du même "
      "côté de toutes les pastilles n'est pas faux.")
    w("- **2 communes ordinaires fausses** (Auch, Le Havre, Les Sables-d'Olonne, Mende, Chamonix-Mont-Blanc, Saint-Véran) "
      "→ retour à toi sur toute la tranche.")
    w("- **Un extrême faux** (Tende, Prads-Haute-Bléone, Roscanvel, L'Aiguillon-la-Presqu'île) → D12 : ce temps devient "
      "« pas de chiffre », avec la preuve écrite.")
    w("- **Retraits** (« Ce que /build fera seul », plan) : « Un temps jugé faux devient « pas de chiffre » par une ligne "
      "de `services-retraits.csv` (D12), sans changer le code ; mais un retrait qui touche une valeur d'AC-13 (Auch, "
      "Bordeaux, Mende, Les Sables-d'Olonne, L'Île-d'Yeu) est une décision de Vincent, avec le changement d'AC-13 qui "
      "va avec. »")
    w('')
    w('## Tes cases, à la démo')
    w('Coche une case par ligne « autre côté » (dans chaque commune, plus bas), puis ici :')
    w('')
    for c in ORDINAIRES + EXTREMES:
        nature = 'ordinaire' if c in ORDINAIRES else 'extrême'
        w(f"- [ ] {par_commune[c][0]['commune']} ({nature}, {nb[c]} « autre côté ») : juste · [ ] fausse")
    w('- Communes ordinaires fausses : ___ (2 ou plus → la tranche revient à toi)')
    w('- Temps à retirer (« pas de chiffre », D12) : ___ (commune, service, preuve)')
    w('')
    w('## Comment le tableau est fait')
    w("- **Temps du site** : lu dans `public/data/services.json` (tâche 0b), décodé comme le fait la page "
      "(`lireServices` ; même décodage refait en Python dans le script). « Plus d'une heure » = 61 min ou plus.")
    w(f"- **Autre source** : le temps en voiture que calcule l'itinéraire de la Géoplateforme IGN (le service de "
      f"calcul de trajets de l'IGN, sur sa base des routes BD TOPO ; versions annoncées dans les réponses, selon le "
      f"serveur qui a répondu : {', '.join(versions)} ; moteur "
      f"`bdtopo-valhalla`, profil voiture, trajet le plus rapide), en partant de la **mairie** (point de "
      f"`reperes.json`). Demandes GET sans clé, une toutes les 300 ms au plus, du {heures[0]} au {heures[-1]}.")
    w("- **Vers quoi** : les équipements du service (types de H158) pris dans la **BPE 2025 géolocalisée** de l'Insee "
      "(Base permanente des équipements : la liste des équipements avec leur position ; Licence Ouverte) : "
      "`BPE25.zip`, page « Équipements géolocalisés … en 2025 » (insee.fr/fr/statistiques/8217525), parue le "
      "02/11/2026, version de novembre 2026 (fichier `BPE25.csv` daté du 02/11/2026 10:47), 136 936 610 octets, "
      "sha256 `afb4d8bd07a66b5f63b68ea9eef16da63413d3ec53d9e77fa4b9ac3c9f02e0c4`, téléchargé le 2026-11-24 à 13:07 "
      "dans `data-raw/bpe-2025/`. Métropole seule ; 622 équipements sans position écartés (sur 182 577). "
      "« Gare grandes lignes » : les gares nationales (type E107 de la BPE : 110 communes, exactement celles de "
      "`services-nationales.csv`) et les 61 gares de `public/data/gares-grandes-lignes.csv`.")
    w("- **Quels équipements** : comme prévu par le plan, les 3 positions les plus proches de la mairie à vol d'oiseau ; "
      "**en plus** (décidé en cours de mesure), la position la plus proche dans chacune des 5 communes les plus proches. "
      "Raison : au bord de la mer, les 3 plus proches à vol d'oiseau peuvent être toutes de l'autre côté de l'eau "
      "(Roscanvel : 3 crèches de Brest, 85 min de route, alors que celle de Crozon est à 17 min). Le temps retenu est "
      "le plus rapide de tous ces trajets (5 à 7 par ligne). "
      + (f"L'élargissement change le drapeau de {len(elargies)} lignes : "
         + ', '.join(f"{r['commune']} {LIBELLE[r['service']]}" for r in elargies) + '.' if elargies else
         "L'élargissement ne change aucun drapeau."))
    w("- **Autre côté** : le temps de l'IGN, arrondi à la minute comme celui du site (moitié vers le haut, au moins 1), "
      "et le temps du site tombent de part et d'autre d'au moins un cran de la ligne : 5, 10, 15 min (médecin, "
      "commerce) ; 5, 10, 20 min (crèche, école, collège, lycée, supérieur) ; 10, 20, 30 min (les trois gares) (R51). "
      "Un temps « pas de chiffre » n'est pas comparé.")
    w("- **Colonne « Insee, carré de la mairie »** : le temps que l'Insee lui-même donne pour le carré de 200 m où se "
      "trouve la mairie (« Gare grandes lignes » : vers une gare nationale seulement, sans les 61 gares). Le site, lui, "
      "prend le temps de la moitié des habitants (D3). Si ce temps est proche de celui de l'IGN, l'écart vient du point "
      "de départ (habitants contre mairie), pas des routes.")
    w("- **Ce que le tableau ne dit pas** : les deux sources comptent la voiture sans embouteillages ; l'Insee utilise "
      "les routes d'OpenStreetMap de 2022, l'IGN celles de 2026 ; l'IGN part de la mairie, le site de la moitié des "
      "habitants ; un équipement plus rapide par la route mais loin à vol d'oiseau peut encore manquer. 10 communes "
      "seulement, choisies par la spec.")
    w('')
    w('## Par commune')
    for c in ORDINAIRES + EXTREMES:
        rs = par_commune[c]
        nature = 'commune ordinaire' if c in ORDINAIRES else 'extrême'
        w('')
        w(f"### {rs[0]['commune']} ({c}) — {nature} — « autre côté » : {nb[c]}")
        w('')
        drapeaux = [r for r in rs if r['franchis']]
        if drapeaux:
            for r in drapeaux:
                crans = ', '.join(f'{x} min' for x in r['franchis'])
                w(f"- **{LIBELLE[r['service']]}** : site {site_txt(r['site'])}, IGN {fr(r['ign_min'])} min → autre côté "
                  f"de la pastille {crans}. *Explication proposée* : {expl[(c, r['service'])]}")
                w('  - [ ] juste (on garde) · [ ] faux (« pas de chiffre », D12'
                  + (', **valeur d\'AC-13 : ta décision**' if r['service'] in AC13.get(c, set()) else '') + ')')
        else:
            w('Aucune ligne « autre côté ».')
        w('')
        w("| Service | Site | IGN depuis la mairie | Vers (commune de l'équipement) | Insee, carré de la mairie | Côté |")
        w('|---|---:|---:|---|---:|---|')
        for r in rs:
            ign = '—' if r['ign_min'] is None else f"{fr(r['ign_min'])} min"
            if r['ign_min_3'] is not None and r['ign_min'] is not None and r['ign_min_3'] != r['ign_min']:
                ign += f" (3 plus proches : {fr(r['ign_min_3'])})"
            insee = '—' if r['insee_carreau_mairie'] is None else f"{fr(r['insee_carreau_mairie'])} min"
            cote = '**autre côté** (' + ', '.join(f'{x} min' for x in r['franchis']) + ')' if r['franchis'] else 'même côté'
            if r['site'] is None:
                cote = 'non comparé'
            w(f"| {LIBELLE[r['service']]} | {site_txt(r['site'])} | {ign} | {vers_txt(r['retenu'])} | {insee} | {cote} |")
    w('')
    w('## Fichiers')
    w('- Scripts (jetables) : `captures/T0c-1-extraire-bpe.py` (extrait de la BPE), `captures/T0c-2-mesurer.py` '
      '(trajets de l\'IGN), `captures/T0c-3-tableau.py` (ce document), explications : `captures/T0c-explications.csv`.')
    w('- Mesure complète (chaque trajet, avec sa requête) : `captures/T0c-mesure.json` ; sortie : `captures/T0c-sortie-mesure.txt`.')
    w('- Réponses de l\'IGN gardées (non versionnées) : `data-raw/bpe-2025/cache-ign.jsonl`.')
    w('- Deux lignes redemandées à l\'IGN après la mesure (Roscanvel crèche, Tende collège), mêmes temps et mêmes '
      'distances, y compris sur un serveur d\'une autre version : `captures/T0c-reverification.txt` ; la requête '
      'd\'une ligne s\'affiche avec `captures/T0c-4-urls.py`.')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(o) + '\n')
    print('lignes', len(lignes), 'autre côté', total, {par_commune[c][0]['commune']: nb[c] for c in par_commune},
          'élargies', [(r['commune'], r['service']) for r in elargies], 'vides', len(vides))


if __name__ == '__main__':
    main(*sys.argv[1:5])
