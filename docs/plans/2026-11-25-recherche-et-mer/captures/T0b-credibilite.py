"""Tableau de crédibilité des minutes de la mer (tâche 0b de recherche-et-mer) → credibilite-mer.md.

Sans réseau : lit public/data/communes.json (noms, km servis, minutes servies), data-raw/mer-min.csv (mer_minutes.py
--calculer : mairie, point de côte, accroches) et data-raw/mer-calcul/ors-mer.jsonl (dates du calcul). N'envoie rien à
aucun service : il écrit des liens d'itinéraire openstreetmap.org que Vincent ouvre.

Usage : python3 -I docs/plans/2026-11-25-recherche-et-mer/captures/T0b-credibilite.py <racine du projet>
"""
import csv
import json
import os
import sys

RACINE = sys.argv[1]
SORTIE = os.path.join(RACINE, 'docs', 'plans', '2026-11-25-recherche-et-mer', 'credibilite-mer.md')
VILLES = ['33063', '14118', '32013', '31555', '69123', '75056', '44109', '35238', '34172', '59350']  # plan, tâche 0b
BLAYE = '33058'  # les bacs restent (tâche 0a) : Blaye, en face du bac Blaye – Lamarque
EN_PLUS = {'33203': "décidé par Claude : la commune dont le temps s'écarte le plus de ceux de ses voisines (point de côte"
                    " accroché à 1,4 km, même point que celui des communes de Blaye ; 16 à 21 min vers les points voisins"
                    " du même calcul)"}
PASTILLES = (15, 30, 60, 90)  # « Mer à moins de », R60
FENETRE = (1, 50)  # bouts du rapport minutes / km : communes de 1 km (affiché) à moins de 50 km (plan : « à moins de 50 km »)
# Explications proposées (lues dans la réponse d'openrouteservice : la ligne de la mairie dans sa matrice), à juger.
EXPLICATIONS = {
    '06006': "le point de côte, à Nice, est accroché (à 11 m) à une voie que le calcul ne rejoint qu'au prix d'un"
             " immense détour : dans la même requête, les 59 communes mettent toutes de 20 h 44 à 22 h 47 pour ce point,"
             " alors qu'Aspremont met de 25 à 49 min pour les 24 autres points de côte de la requête. 21 h 09 est faux à"
             " coup sûr ; le vrai temps est sans doute proche de 25 min. Cause exacte non trouvée (la réponse ne donne"
             " pas l'itinéraire). *Proposé : faux, retrait (D8).*",
    '33203': "le point de côte est accroché à 1,4 km de lui (à la plus grande distance permise, 2 km), sur une voie"
             " qu'on ne rejoint que par un détour : dans la même requête, la mairie d'Hourtin est à 16 min de certains"
             " autres points de côte, et ce point est à 58 min ou plus de chacune des 89 communes de la requête."
             " *Proposé : probablement faux ; à vérifier avec le lien.*",
    '33058': "en face du bac Blaye – Lamarque (les bacs restent, décision de la tâche 0a). Le point de côte est sur la"
             " côte atlantique du Médoc (à cet endroit, l'estuaire n'est pas la mer), accroché à 388 m. Dans la même"
             " requête, Blaye est à 95 à 135 min des 36 autres points de côte. Hypothèse non vérifiée : le calcul ne prend"
             " pas le bac, ou le compte lent. À comparer avec le lien (qui peut, lui, prendre le bac).",
}


def duree(m):
    """H191 : « moins d'1 min », « 56 min », « 1 h », « 1 h 05 »."""
    if m == 0:
        return "moins d'1 min"
    if m < 60:
        return f'{m} min'
    return f'{m // 60} h' + (f' {m % 60:02d}' if m % 60 else '')


def km_affiche(km):
    return "moins d'1 km" if km < 1 else f'{int(km + 0.5)} km'


def meme_cote(m):
    """Temps de l'itinéraire en ligne (arrondi à la minute) qui garde la commune du même côté des 4 pastilles."""
    c = max(m, 1)
    bas = max([p for p in PASTILLES if p < c], default=None)
    haut = min([p for p in PASTILLES if p >= c], default=None)
    if haut is None:
        return f'plus de {duree(bas)}'
    if bas is None:
        return f'{duree(haut)} ou moins'
    return f'{duree(bas + 1)} à {duree(haut)}'


def lien(r):
    return ('https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route='
            f"{r['mairie_lat']}%2C{r['mairie_lon']}%3B{r['point_lat']}%2C{r['point_lon']}")


def main():
    com = json.load(open(os.path.join(RACINE, 'public', 'data', 'communes.json'), encoding='utf-8'))
    ch = com['champs']
    info = {r[0]: dict(zip(ch, r)) for r in com['communes']}
    lignes = {r['code']: r for r in csv.DictReader(open(os.path.join(RACINE, 'data-raw', 'mer-min.csv'), encoding='utf-8'))}
    for code, r in lignes.items():
        r.update(nom=info[code]['nom'], dep=info[code]['dep'], km=info[code]['mer_km'],
                 m=None if r['mer_min'] == '' else int(r['mer_min']))
        assert r['m'] == info[code].get('mer_min', r['m']), f'{code} : mer-min.csv et communes.json diffèrent'
    envois = [json.loads(t) for t in open(os.path.join(RACINE, 'data-raw', 'mer-calcul', 'ors-mer.jsonl'), encoding='utf-8') if t.strip()]
    moteur = envois[0]['reponse']['metadata']['engine']
    dates = sorted(e['envoye_le'] for e in envois)

    fenetre = [r for r in lignes.values() if r['m'] is not None and FENETRE[0] <= r['km'] < FENETRE[1]]
    for r in fenetre:
        r['ratio'] = r['m'] / r['km']

    def un_par_point(rangees):
        vus, garde = set(), []
        for r in rangees:
            p = (r['point_lon'], r['point_lat'])
            if p not in vus:
                vus.add(p)
                garde.append(r)
        return garde[:5]

    grands = un_par_point(sorted(fenetre, key=lambda r: (-r['ratio'], r['code'])))
    petits = un_par_point(sorted(fenetre, key=lambda r: (r['ratio'], r['code'])))
    rangs = ([('ville', lignes[c]) for c in VILLES] + [('bac', lignes[BLAYE])] + [('écart', lignes[c]) for c in EN_PLUS]
             + [('grand', r) for r in grands] + [('petit', r) for r in petits])

    print('plus grands rapports minutes / km (1 à 50 km, un par point) :')
    for r in grands:
        print(f"  {r['code']} {r['nom']} : {r['km']} km, {r['m']} min, {r['ratio']:.2f} min/km, point accroché à {r['accroche_point_m']} m")
    print('plus petits :')
    for r in petits:
        print(f"  {r['code']} {r['nom']} : {r['km']} km, {r['m']} min, {r['ratio']:.2f} min/km, point accroché à {r['accroche_point_m']} m")

    t = []
    t.append('# Les minutes de la mer sont-elles crédibles ? Communes à confronter à un itinéraire en ligne\n')
    t.append(f"2026-11-26 · tâche 0b de /build recherche-et-mer · **à juger par Vincent, avant la démo s'il le veut** (plan :"
             f" « jugées à la démo », D8) · Spec : [« Le risque »](../../specs/2026-11-25-recherche-et-mer/spec.md), D4, D7,"
             f" D8, R61 · Mesure : [mesure-tache-0.md](mesure-tache-0.md)\n")
    t.append('## En bref')
    t.append(f'- **{len(rangs)} communes** : les 10 villes du plan, Blaye (les bacs restent), Hourtin (décidé par Claude),'
             ' et les 5 communes de chaque bout du rapport minutes / km.')
    t.append("- **Un temps est faux à coup sûr** : Aspremont, **21 h 09** pour 10 km de la mer. **Un autre l'est"
             " probablement** : Hourtin, **58 min** pour 9 km, quand les points de côte voisins sont à 16 à 21 min. Les deux"
             " viennent d'un point de côte accroché à une voie mal reliée, pas des routes de la commune.")
    t.append('- Je n\'ai ouvert aucun itinéraire : la colonne « Itinéraire en ligne » est à remplir par toi, lien à la main.')
    t.append('')
    t.append('## Comment juger (D8)')
    t.append('- Ouvre le lien de la ligne : un itinéraire en voiture sur openstreetmap.org, de la mairie au point de côte qui'
             ' donne les km (D4). Note son temps.')
    t.append('- **Faux** (règle proposée, décidée par Claude, comme pour les services) : le temps de l\'itinéraire tombe hors'
             ' de la colonne « Même côté si », donc de l\'autre côté d\'une des pastilles 15 min, 30 min, 1 h, 1 h 30. La'
             ' commune passerait alors un choix « Mer à moins de » qu\'elle ne devrait pas passer, ou l\'inverse. Un écart'
             ' de quelques minutes du même côté de toutes les pastilles n\'est pas faux.')
    t.append('- Un temps faux est **retiré** par une ligne de `scripts/data/mer-retraits.csv` (code, preuve), sans changer'
             ' le code. La commune devient « sans temps » et le site la compte d\'après ses km (D7) : « ≈ 10 min »'
             ' pour Aspremont, par exemple, à la place de 21 h 09.')
    t.append('')
    t.append('## Tes cases')
    for _, r in rangs:
        t.append(f"- [ ] {r['nom']} ({r['code']}) : juste · [ ] faux → retrait")
    t.append('')
    t.append('## Le tableau')
    t.append('| Pourquoi | Commune | Km (affiché) | Temps du site | Même côté si | Itinéraire en ligne | Lien (mairie → point de côte) |')
    t.append('|---|---|---:|---:|---|---|---|')
    pourquoi = {'ville': 'ville du plan', 'bac': 'bac (Blaye – Lamarque)', 'écart': 'écart à ses voisines',
                'grand': 'rapport le plus grand', 'petit': 'rapport le plus petit'}
    for genre, r in rangs:
        temps = 'sans temps' if r['m'] is None else duree(r['m'])
        cote = '—' if r['m'] is None else meme_cote(r['m'])
        ratio = '' if 'ratio' not in r else f" ({r['ratio']:.2f} min/km)".replace('.', ',')
        t.append(f"| {pourquoi[genre]}{ratio} | {r['nom']} ({r['code']}, {r['dep']}) | {km_affiche(r['km'])} | {temps} |"
                 f" {cote} | ___ | [itinéraire]({lien(r)}) |")
    t.append('')
    t.append('## Ce que j\'ai vu dans les réponses (explications proposées, à juger)')
    for code, texte in EXPLICATIONS.items():
        r = lignes[code]
        t.append(f"- **{r['nom']}** ({code}, {duree(r['m'])}, {km_affiche(r['km'])}) : {texte}")
    t.append(f"- **Rapport le plus grand** : on y attend des détours d'estuaire (Seine : Sandouville, Oudalle) et des routes"
             f" de montagne au-dessus de la mer (La Turbie, Barrettali). **Rapport le plus petit** : aucun temps n'est plus"
             f" court que la route ne le permet (aucune commune au-dessous de 0,5 min par km à vol d'oiseau, à partir"
             f" d'1 km) ; les plus petits rapports sont ceux de communes près d'une voie rapide.")
    t.append('')
    t.append('## Comment le tableau est fait')
    t.append(f"- **Temps du site** : `mer_min` de `public/data/communes.json`, minutes entières arrondies une seule fois,"
             f" moitié vers le haut (H191), d'après la matrice d'openrouteservice (profil voiture, sans embouteillages,"
             f" H194). Calcul envoyé par Vincent le {dates[0][:10]}, de {dates[0][11:16]} à {dates[-1][11:16]} ;"
             f" openrouteservice {moteur['version']}, routes OpenStreetMap du {moteur['osm_date'][:10]}, graphe du"
             f" {moteur['graph_date'][:10]}.")
    t.append('- **Km** : `mer_km` servi, à vol d\'oiseau de la mairie au point de côte (D8 de loyer-mer), affiché au km.')
    t.append('- **Même côté si** : les temps de l\'itinéraire en ligne (arrondi à la minute) qui laissent la commune du même'
             ' côté des quatre pastilles que le temps du site (« moins d\'1 min » compte 1 min, R61).')
    t.append(f"- **Bouts du rapport minutes / km** : temps du site divisé par les km servis, parmi les communes de"
             f" {FENETRE[0]} km à moins de {FENETRE[1]} km (sous 1 km, le rapport n'a pas de sens : 0,1 km et 3 min font 30),"
             f" une seule commune par point de côte (sinon les 5 plus petits seraient 5 voisines sur la même voie rapide ;"
             f" décidé par Claude).")
    t.append('- **Lien** : openstreetmap.org, itinéraire en voiture (moteur OSRM de la FOSSGIS), de la mairie (point de'
             ' `reperes.json`, D18 de loyer-mer) au point de côte (`mer.points_cote`, D4). C\'est un autre calcul,'
             ' sur les routes d\'OpenStreetMap du jour, qui peut prendre ou non un bac et s\'accrocher autrement au point :'
             ' un écart peut venir de là.')
    t.append(f'- **Ce que le tableau ne dit pas** : {len(rangs)} communes sur 34 746 ; les deux calculs comptent la voiture'
             ' sans embouteillages ; personne n\'a encore ouvert les liens.')
    t.append('')
    t.append('## Fichiers')
    t.append('- Ce document : `captures/T0b-credibilite.py` (sans réseau). Temps de chaque commune, avec sa mairie, son'
             ' point de côte et ses accroches : `data-raw/mer-min.csv` (non versionné, `mer_minutes.py --calculer`).')
    with open(SORTIE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(t) + '\n')
    print(f'écrit : {SORTIE} ({len(rangs)} communes)')


main()
