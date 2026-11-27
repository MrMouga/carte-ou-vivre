"""Temps d'accès aux services de chaque commune de la carte (tranche services, R52, H156 à H158, H161, H162, H171) :
public/data/services.json et public/data/gares-grandes-lignes.csv.

Sources (tâche 0a, empreintes ci-dessous et dans docs/plans/2026-11-24-services/mesure-tache-0.md ; extrait refait avec
D106 le 2026-11-26, docs/plans/2026-11-26-services-revision/mesure-tache-0.md) :
- data-raw/services-carreaux.csv.gz : extrait du fichier Insee « accès de la population aux équipements » (Licence Ouverte),
  une ligne par commune (`depcom`, codes tels que publiés : arrondissements de Paris, Lyon, Marseille), IRIS et carreau
  (`idSrc`), sa population (`pop`) et une colonne par type d'équipement de H158 (durée en minutes non arrondie, vide sans
  temps). Un carreau à cheval sur plusieurs IRIS de sa commune a une ligne par IRIS : ce sont des parts, chaque ligne
  compte pour sa population (décision de la tâche 0a) ; la colonne `iris` n'est pas lue ;
- data-raw/services-gares.csv : les 61 gares grandes lignes ajoutées (horaires SNCF, ODbL ; scripts/data/gares.py, H170) ;
- data-raw/services-calcul/ors-grandes-lignes.jsonl : temps de la mairie vers les 3 gares ajoutées les plus proches,
  openrouteservice, calculés une fois (H171, ne pas relancer) ;
- public/data/communes.json : codes, noms, départements, populations ;
- scripts/data/services-retraits.csv : temps retirés (D12), colonnes `code`, `service`, `preuve`.

Règles (une fonction chacune, appelée sur le vrai extrait et sur ceux des tests) :
- H158 (`plus_petit`) : temps d'un carreau pour un service = le plus petit parmi les types du service ;
- R52, H157 (`mediane`) : parmi les lignes qui ont un temps pour ce service et une population non nulle, le premier temps,
  dans l'ordre croissant, où la population cumulée atteint la moitié du total (égalité exacte retenue) ;
- H156 (`arrondi`) : une seule fois, à la minute la plus proche, moitié vers le haut, au moins 1 ;
- R52 (`code_carte`) : Paris, Lyon, Marseille par leurs arrondissements ;
- R52, D18, H171 (`temps_grandes_lignes`) : le plus petit, avant arrondi, de la médiane vers une gare nationale (E107) et du
  plus rapide des 3 trajets depuis la mairie ; si l'un manque, l'autre ; pas de chiffre pour une commune de population 0,
  une île sans pont (H161) ou une commune de Corse ;
- R52 (`temps_commune`) : les 11 temps d'une commune (R54, révision D19, D20 : urgences ajoutées, supermarché à la
  place du commerce alimentaire) ; population 0 : aucun temps ;
- D12 (`retirer`) : les temps de services-retraits.csv deviennent « pas de chiffre ».
Les durées et les populations sont lues en entiers (centièmes de minute, 10⁻¹⁶ habitant) : aucune erreur de virgule
flottante dans la médiane ni dans l'arrondi.

Sortie (plan, « Le fichier des temps ») : services.json = {"codes": [34 746 codes, ordre de communes.json], "<service>":
une chaîne d'un caractère par commune, ..., "iles_sans_pont": [16 codes]} ; ALPHABET[n] = n minutes, de 1 à 60 ; « z »
(rang 61) = 61 min ou plus ; « - » = pas de chiffre. Lu par src/domain/services.ts (`lireServices`).

Usage : python3 -I scripts/data/services.py  (s'arrête sur le premier contrôle qui échoue)
        python3 -I scripts/data/services.py --extrait <fichier.csv>  (lignes au format de services-carreaux.csv, `iris`
        facultatif : écrit sur la sortie standard {"<commune>": {"<service>": minutes arrondies | null}})
        python3 -I scripts/data/services.py --grandes-lignes <fichier.json>  (liste {commune, population, nationale,
        depuis_la_mairie} : écrit {"<commune>": minutes arrondies | null})
"""
import csv
import gzip
import hashlib
import io
import json
import os
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
RAW = os.path.join(ROOT, 'data-raw')
OUT = os.path.join(ROOT, 'public', 'data')
RETRAITS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'services-retraits.csv')

# Fichiers produits par la tâche 0a (2026-11-24 ; extrait refait avec D106 le 2026-11-26, tâche 0 de la révision D19,
# D20, H208 ; l'extrait d'avant est gardé en data-raw/services-carreaux-2026-11-24.csv.gz, sha256 1b3d4fc5…7dc8) : un
# fichier changé arrête le script.
FICHIERS = {
    'services-carreaux.csv.gz': '5a901bf31caf19035cc0817fd7c244a75f36aab2bef461032a9c9cc4a3605923',
    'services-gares.csv': '9bb7b0987d33ebda858ad4bcd440d330d6bea06b1d9ba39d696e6a084174a3c1',
    'services-calcul/ors-grandes-lignes.jsonl': '90725176eaf96d668411435f2030911584143e0826ab3e8e288918cdb123ae04',
}
# H158 (révisée par D19, D20) : types d'équipement de chaque service lu dans les carreaux ; « nationale » (E107) sert à
# « Gare grandes lignes ». `commerce` (D1 d'avant D20 : B104, B105, B201, B202) n'est plus écrit (tâche 2 de la
# révision, plan 2026-11-26-services-revision).
TYPES = {
    'medecin': ['D265'],
    'urgences': ['D106'],
    'supermarche': ['B104', 'B105'],
    'creche': ['D502'],
    'ecole': ['C107', 'C108', 'C109'],
    'college': ['C201'],
    'lycee': ['C301', 'C302'],
    'superieur': ['C501', 'C502', 'C503', 'C504', 'C505', 'C509'],
    'gare': ['E107', 'E108', 'E109'],
    'gare_regionale': ['E107', 'E108'],
    'nationale': ['E107'],
}
# Ordre de la fiche (R54 révisée).
SERVICES = ['medecin', 'urgences', 'supermarche', 'creche', 'ecole', 'college', 'lycee', 'superieur', 'gare',
            'gare_regionale', 'gare_grandes_lignes']
DES_CARREAUX = [s for s in SERVICES if s != 'gare_grandes_lignes']  # services dont le temps est la médiane des carreaux
ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
PLUS_D_UNE_HEURE = 61  # « z » : 61 min ou plus
PAS_DE_CHIFFRE = '-'
DEC_DUREE = 2   # durées de l'Insee et d'openrouteservice : au plus 2 décimales (centièmes de minute)
DEC_POP = 16    # populations des carreaux : au plus 16 décimales (écriture des flottants, « 3.3333333333333335 » ; tâche 0b)
PLM = {'75056': ('75101', '75120'), '69123': ('69381', '69389'), '13055': ('13201', '13216')}
ILES = {  # H161, noms de communes.json
    '17004': "Île-d'Aix", '22016': 'Île-de-Bréhat', '29082': 'Île-de-Batz', '29083': 'Île-de-Sein', '29084': 'Île-Molène',
    '29155': 'Ouessant', '56009': 'Bangor', '56069': 'Groix', '56085': 'Hœdic', '56086': "Île-d'Houat",
    '56087': 'Île-aux-Moines', '56088': "Île-d'Arz", '56114': 'Locmaria', '56152': 'Le Palais', '56241': 'Sauzon',
    '85113': "L'Île-d'Yeu"}
# Îles reliées par un pont, hors de la liste (H161) : codes relus dans communes.json le 2026-11-24.
ILES_A_PONT = {
    'Noirmoutier': {'85163': "Noirmoutier-en-l'Île", '85011': 'Barbâtre', '85083': "L'Épine", '85106': 'La Guérinière'},
    'Ré': {'17019': 'Ars-en-Ré', '17051': 'Le Bois-Plage-en-Ré', '17121': 'La Couarde-sur-Mer', '17161': 'La Flotte',
           '17207': 'Loix', '17286': 'Les Portes-en-Ré', '17297': 'Rivedoux-Plage', '17360': 'Sainte-Marie-de-Ré',
           '17318': 'Saint-Clément-des-Baleines', '17369': 'Saint-Martin-de-Ré'},
    'Oléron': {'17093': "Le Château-d'Oléron", '17140': "Dolus-d'Oléron", '17485': 'Le Grand-Village-Plage',
               '17323': "Saint-Denis-d'Oléron", '17337': "Saint-Georges-d'Oléron", '17385': "Saint-Pierre-d'Oléron",
               '17411': 'Saint-Trojan-les-Bains', '17486': 'La Brée-les-Bains'},
}
POP_0 = ['55039', '55050', '55139', '55189', '55239', '55307']
SANS_CARREAU = POP_0 + ['29084', '29083', '09304', '26375']  # mesures de /spec : + Île-Molène, Île-de-Sein, Suzan, Villefranche-le-Château
GL_DEPUIS_LA_MAIRIE = ['09304', '26375']  # sans carreau, gardent « Gare grandes lignes » depuis la mairie
ATTENDU = {'communes': 34746, 'avec un carreau habité': 34736, 'avec un temps': 34738, 'gares': 61}
LIMITE_GZIP = 350_000  # H162 : 350 Ko en gzip -9
# AC-13 révisé par D19, D20 (valeurs lues dans le fichier servi ; 61 = « 61 ou plus », None = pas de chiffre), dans
# l'ordre de R54.
AC13 = {
    '32013': dict(zip(SERVICES, [2, 6, 2, 3, 2, 3, 3, 4, 4, 4, PLUS_D_UNE_HEURE])),
    '33063': dict(zip(SERVICES, [1, 5, 1, 1, 1, 2, 2, 3, 5, 7, 7])),
    '48095': {'urgences': 4, 'superieur': 2, 'gare': 3, 'gare_regionale': PLUS_D_UNE_HEURE,
              'gare_grandes_lignes': PLUS_D_UNE_HEURE},
    '05157': {'urgences': 55, 'supermarche': 35},
    '74056': {'urgences': None, 'supermarche': 3},  # urgences retirées (D12, H210)
    '85194': {'urgences': 7, 'gare_grandes_lignes': 4},
    '85113': {'medecin': None, 'urgences': None, 'lycee': None, 'superieur': None, 'gare': None,
              'gare_regionale': None, 'gare_grandes_lignes': None, 'supermarche': 4},
    **{c: dict.fromkeys(SERVICES) for c in POP_0},
}
# Comptes des mesures (docs/specs/2026-11-23-services/mesures.md), communes à temps inférieur ou égal au seuil : de /spec
# (2026-11-23) ; `urgences` : essai de /spec, sans les parts par IRIS (information, écart possible) ; `supermarche` :
# calculés le 2026-11-26 sur l'extrait figé par cette même règle, contrôlés (SUPERMARCHE, arrêt s'ils diffèrent) ;
# depuis H210 (2026-11-27), Tende passe de « au-delà de 60 » à « sans chiffre » (mesures.md : '>60' 12, 'sans' 15).
SUPERMARCHE = {5: 9022, 10: 22329, 15: 30409, 20: 33195, 30: 34415, 45: 34690, 60: 34719, '>60': 11, 'sans': 16}
ANCIENS = {
    'medecin': {5: 14232, 10: 27960, 15: 33135, 30: 34643, '>60': 1, 'sans': 13},
    'urgences': {5: 851, 10: 4025, 15: 9558, 20: 16243, 30: 27415, 45: 33676, 60: 34562, '>60': 174},
    'supermarche': SUPERMARCHE,
    'ecole': {5: 26483, 10: 33483, 15: 34543, 30: 34724, '>60': 0, 'sans': 10},
    'college': {5: 6682, 10: 20098, 15: 29848, 30: 34442, '>60': 3, 'sans': 16},
    'creche': {5: 8128, 10: 20147, 15: 28806, 30: 34462, '>60': 1, 'sans': 17},
    'lycee': {5: 2616, 10: 8927, 15: 17231, 20: 24523, 30: 32094, '>60': 90, 'sans': 18},
    'superieur': {5: 618, 10: 2409, 15: 5491, 20: 9402, 30: 18120, 45: 28674, 60: 33211, '>60': 1517, 'sans': 18},
    'gare': {5: 4471, 10: 11897, 15: 19024, 30: 30668, '>60': 139, 'sans': 18},
    'gare_regionale': {5: 1752, 10: 6120, 15: 11795, 20: 17144, 30: 25162, '>60': 903, 'sans': 378},
    'gare_grandes_lignes': {5: 171, 10: 1018, 15: 2918, 20: 5688, 30: 12637, 45: 22736, 60: 29319, '>60': 5045,
                            'sans': 382},
}
SEUILS = [5, 10, 15, 20, 30, 45, 60, '>60', 'sans']
MODE_TEST = '--extrait' in sys.argv or '--grandes-lignes' in sys.argv  # la sortie standard reste du JSON


def check(cond, msg, muet=False):
    """Contrôle : affiché, arrêt s'il échoue ; `muet` : affiché seulement s'il échoue."""
    if cond and muet:
        return
    print(('  ok   ' if cond else '  ÉCHEC ') + msg, file=sys.stderr if MODE_TEST else sys.stdout)
    if not cond:
        raise SystemExit(1)


def fixe(texte, decimales):
    """Nombre décimal écrit (« 4.49 », « 82 », « 3.0 ») → entier en 10^-decimales ; plus de décimales : arrêt."""
    entier, _, frac = texte.strip().partition('.')
    check(entier.isdigit() and (frac == '' or frac.isdigit()) and len(frac) <= decimales,
          f'« {texte} » : nombre positif à {decimales} décimales au plus', muet=True)
    return int(entier + frac.ljust(decimales, '0'))


def code_carte(depcom):
    """R52 : code de la commune de la carte (arrondissements de Paris, Lyon, Marseille → la ville)."""
    for ville, (premier, dernier) in PLM.items():
        if premier <= depcom <= dernier:
            return ville
    return depcom


def plus_petit(temps):
    """H158 : plus petit temps d'un carreau parmi les types d'un service ; None si aucun."""
    temps = [t for t in temps if t is not None]
    return min(temps) if temps else None


def mediane(lignes):
    """R52, H157 : `lignes` = [(temps, population)] d'une commune pour un service ; None si aucune ne compte."""
    lignes = sorted((t, p) for t, p in lignes if t is not None and p > 0)
    total = sum(p for _, p in lignes)
    cumul = 0
    for t, p in lignes:
        cumul += p
        if 2 * cumul >= total:
            return t
    return None


def arrondi(centiemes):
    """H156 : minute la plus proche, moitié vers le haut, au moins 1 ; None reste None."""
    return None if centiemes is None else max(1, (centiemes + 50) // 100)


def temps_grandes_lignes(nationale, depuis_la_mairie, population, ile=False, corse=False):
    """R52, D18, H171 : `nationale` = médiane vers une gare nationale (centièmes, None si aucune) ; `depuis_la_mairie` =
    les trajets vers les 3 gares ajoutées (centièmes ou None). Renvoie les minutes arrondies, ou None."""
    if population == 0 or ile or corse:
        return None
    candidats = [t for t in [nationale, *depuis_la_mairie] if t is not None]
    return arrondi(min(candidats)) if candidats else None


def nouvelle_commune():
    return {'lignes': {s: [] for s in TYPES}, 'pop': 0}


def ajouter(commune, pop, durees):
    """Une ligne de l'extrait (une part de carreau) : son plus petit temps pour chaque service (H158) et sa population."""
    commune['pop'] += pop
    for service, types in TYPES.items():
        commune['lignes'][service].append((plus_petit([durees[t] for t in types]), pop))


def resumer(commune):
    """Les médianes non arrondies d'une commune (centièmes ou None), par service lu dans les carreaux, et sa population."""
    return {'medianes': {s: mediane(lignes) for s, lignes in commune['lignes'].items()}, 'pop': commune['pop']}


SANS_CARREAUX = resumer(nouvelle_commune())


def temps_commune(commune, population=None, ile=False, corse=False, depuis_la_mairie=()):
    """R52 : les temps arrondis d'une commune ({service: minutes | None}) depuis `resumer` ; population 0 : aucun."""
    if population == 0:
        return dict.fromkeys(SERVICES)
    temps = {s: arrondi(commune['medianes'][s]) for s in DES_CARREAUX}
    temps['gare_grandes_lignes'] = temps_grandes_lignes(commune['medianes']['nationale'], depuis_la_mairie,
                                                        population, ile, corse)
    return temps


def lire_carreaux(chemin):
    """Lit un extrait au format de services-carreaux.csv (gzip si .gz) ; renvoie {code de la carte: `resumer`}, dans
    l'ordre du fichier. Chaque ligne est une part de population (la colonne `iris`, facultative, n'est pas lue). Les
    lignes d'une commune se suivent (sauf les arrondissements, réunis à la fin) : chaque commune est résumée dès qu'elle
    est lue, sans garder ses lignes ; une commune qui reparaît plus loin arrête le script."""
    ouvrir = gzip.open if chemin.endswith('.gz') else open
    communes, en_cours, precedent = {}, {}, None
    memo_duree, memo_pop = {}, {}
    with ouvrir(chemin, 'rt', encoding='utf-8', newline='') as f:
        lecteur = csv.reader(f)
        tete = next(lecteur)
        types = sorted({t for ts in TYPES.values() for t in ts})
        check(all(c in tete for c in ['depcom', 'idSrc', 'pop', *types]), f'colonnes de l\'extrait : {tete}', muet=True)
        i_dep, i_pop = tete.index('depcom'), tete.index('pop')
        i_types = [(t, tete.index(t)) for t in types]
        for row in lecteur:
            code = code_carte(row[i_dep])
            texte_pop = row[i_pop]
            pop = memo_pop.get(texte_pop)
            if pop is None:
                pop = memo_pop[texte_pop] = fixe(texte_pop, DEC_POP)
            durees = {}
            for t, i in i_types:
                v = row[i]
                if v == '':
                    durees[t] = None
                    continue
                d = memo_duree.get(v)
                if d is None:
                    d = memo_duree[v] = fixe(v, DEC_DUREE)
                durees[t] = d
            if code != precedent and precedent in en_cours and precedent not in PLM:
                communes[precedent] = resumer(en_cours.pop(precedent))
            precedent = code
            if code not in en_cours:
                check(code not in communes, f'les lignes de la commune {code} se suivent dans l\'extrait', muet=True)
                en_cours[code] = nouvelle_commune()
                communes[code] = None  # place dans l'ordre du fichier
            ajouter(en_cours[code], pop, durees)
    for code, commune in en_cours.items():
        communes[code] = resumer(commune)
    return communes


def mode_extrait(chemin):
    """AC-5 : le calcul de R52 sur un extrait, par le même chemin que le vrai fichier."""
    communes = lire_carreaux(chemin)
    json.dump({code: temps_commune(c) for code, c in communes.items()}, sys.stdout, ensure_ascii=False)
    print()


def mode_grandes_lignes(chemin):
    """AC-16 : « Gare grandes lignes » sur une liste {commune, population, nationale, depuis_la_mairie} (minutes)."""
    lignes = json.load(open(chemin, encoding='utf-8'), parse_float=str, parse_int=str)
    en_centiemes = lambda m: None if m is None else fixe(m, DEC_DUREE)  # noqa: E731
    sortie = {l['commune']: temps_grandes_lignes(en_centiemes(l['nationale']),
                                                 [en_centiemes(m) for m in l['depuis_la_mairie']],
                                                 int(l['population'])) for l in lignes}
    json.dump(sortie, sys.stdout, ensure_ascii=False)
    print()


def retirer(temps, retraits):
    """D12 : chaque (code, service) de services-retraits.csv devient « pas de chiffre »."""
    for code, service in retraits:
        temps[code][service] = None


def lire_retraits(codes):
    with open(RETRAITS, encoding='utf-8', newline='') as f:
        lecteur = csv.DictReader(f)
        check(lecteur.fieldnames == ['code', 'service', 'preuve'], f'services-retraits.csv : colonnes {lecteur.fieldnames}')
        retraits = []
        for r in lecteur:
            check(r['code'] in codes and r['service'] in SERVICES and r['preuve'].strip() != '',
                  f"services-retraits.csv : retrait {r} (commune de la carte, service connu, preuve écrite)", muet=True)
            retraits.append((r['code'], r['service']))
    return retraits


def sha256(path):
    sha = hashlib.sha256()
    with open(path, 'rb') as f:
        while chunk := f.read(1 << 20):
            sha.update(chunk)
    return sha.hexdigest()


def lire_ors(pop):
    """H171 : {code: [trajets en centièmes]} ; les communes de population 0 ne sont pas lues (R52)."""
    trajets = {}
    with open(os.path.join(RAW, 'services-calcul', 'ors-grandes-lignes.jsonl'), encoding='utf-8') as f:
        for ligne in f:
            r = json.loads(ligne, parse_float=str, parse_int=str)
            for code, m in zip(r['codes'], r['minutes']):
                check(code in pop, f'trajet openrouteservice vers une commune de la carte ({code})', muet=True)
                if pop[code] == 0:
                    continue
                trajets.setdefault(code, []).append(None if m is None else fixe(m, DEC_DUREE))
    return trajets


def caractere(m):
    if m is None:
        return PAS_DE_CHIFFRE
    check(isinstance(m, int) and m >= 1, f'temps arrondi {m} au moins 1', muet=True)
    return ALPHABET[min(m, PLUS_D_UNE_HEURE)]


def lire_caractere(c):
    return None if c == PAS_DE_CHIFFRE else ALPHABET.index(c)


def comptes(servi, codes):
    """Communes à temps inférieur ou égal à chaque seuil, au-delà de 60, sans chiffre : sur les valeurs servies."""
    sortie = {}
    for s in SERVICES:
        vals = [servi[c][s] for c in codes]
        sortie[s] = {seuil: (sum(1 for v in vals if v is not None and v > 60) if seuil == '>60'
                             else sum(1 for v in vals if v is None) if seuil == 'sans'
                             else sum(1 for v in vals if v is not None and v <= seuil)) for seuil in SEUILS}
    return sortie


def main():
    if '--extrait' in sys.argv:
        mode_extrait(sys.argv[sys.argv.index('--extrait') + 1])
        return
    if '--grandes-lignes' in sys.argv:
        mode_grandes_lignes(sys.argv[sys.argv.index('--grandes-lignes') + 1])
        return

    print('Fichiers de la tâche 0a')
    for nom, attendu in FICHIERS.items():
        s = sha256(os.path.join(RAW, nom))
        check(s == attendu, f'{nom} : sha256 {s}')

    carte = json.load(open(os.path.join(OUT, 'communes.json'), encoding='utf-8'))
    ch = carte['champs']
    codes = [r[0] for r in carte['communes']]
    nom = {r[0]: r[ch.index('nom')] for r in carte['communes']}
    dep = {r[0]: r[ch.index('dep')] for r in carte['communes']}
    pop = {r[0]: r[ch.index('population')] for r in carte['communes']}
    print('Communes de la carte')
    check(len(codes) == len(set(codes)) == ATTENDU['communes'], f"{len(codes)} communes, codes distincts (attendu {ATTENDU['communes']})")
    check(sorted(c for c in codes if pop[c] == 0) == POP_0, f'population 0 : {[c for c in codes if pop[c] == 0]}')
    check(all(nom.get(c) == n for c, n in ILES.items()),
          f'H161 : les 16 îles sans pont présentes avec leurs noms ({", ".join(f"{c} {nom.get(c)}" for c in ILES)})')
    for ile, communes in ILES_A_PONT.items():
        check(all(nom.get(c) == n for c, n in communes.items()) and not set(communes) & set(ILES),
              f'{ile} : {len(communes)} communes, toutes sur la carte, aucune dans la liste des îles sans pont')

    print('Carreaux (services-carreaux.csv.gz)')
    communes = lire_carreaux(os.path.join(RAW, 'services-carreaux.csv.gz'))
    hors = sorted(set(communes) - set(codes))
    check(not hors, f'codes des carreaux tous sur la carte, Paris, Lyon et Marseille réunies ({len(communes)} communes ; hors carte : {hors[:10]})')
    habitees = {c for c, x in communes.items() if x['pop'] > 0}
    sans = sorted(set(codes) - habitees)
    check(len(habitees) == ATTENDU['avec un carreau habité'],
          f"{len(habitees)} communes avec au moins un carreau habité (attendu {ATTENDU['avec un carreau habité']}, D2)")
    check(sans == sorted(SANS_CARREAU), f'les {len(sans)} sans carreau sont celles des mesures : {", ".join(f"{c} {nom[c]}" for c in sans)}')

    print('Trajets depuis la mairie (ors-grandes-lignes.jsonl, H171)')
    ors = lire_ors(pop)
    attendues = {c for c in codes if pop[c] != 0 and c not in ILES and dep[c] not in ('2A', '2B')}
    check(set(ors) == attendues and all(len(v) == 3 for v in ors.values()),
          f'{len(ors)} communes avec 3 trajets = communes hors population 0, îles sans pont et Corse ({len(attendues)})')

    print('Temps (R52)')
    temps = {c: temps_commune(communes.get(c, SANS_CARREAUX), pop[c], c in ILES, dep[c] in ('2A', '2B'), ors.get(c, ()))
             for c in codes}
    retraits = lire_retraits(set(codes))
    retirer(temps, retraits)
    print(f'  retraits (D12, services-retraits.csv) : {len(retraits)} {retraits}')

    sortie = {'codes': codes, **{s: ''.join(caractere(temps[c][s]) for c in codes) for s in SERVICES},
              'iles_sans_pont': sorted(ILES)}
    contenu = json.dumps(sortie, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    chemin = os.path.join(OUT, 'services.json')
    with open(chemin, 'wb') as f:
        f.write(contenu)

    print('Fichier servi, relu (public/data/services.json)')
    relu = json.load(open(chemin, encoding='utf-8'))
    check(list(relu) == ['codes', *SERVICES, 'iles_sans_pont'] and relu['codes'] == codes
          and all(len(relu[s]) == len(codes) for s in SERVICES),
          f'{len(relu["codes"])} codes dans l\'ordre de communes.json, {len(SERVICES)} chaînes de {len(codes)} caractères ({", ".join(s for s in relu if s in SERVICES)})')
    check(all(ch in ALPHABET[1:PLUS_D_UNE_HEURE + 1] + PAS_DE_CHIFFRE for s in SERVICES for ch in set(relu[s])),
          'caractères de l\'alphabet seulement (« 0 » jamais écrit)')
    servi = {c: {s: lire_caractere(relu[s][i]) for s in SERVICES} for i, c in enumerate(codes)}
    check(all(servi[c][s] == (None if temps[c][s] is None else min(temps[c][s], PLUS_D_UNE_HEURE)) for c in codes for s in SERVICES),
          'chaque temps relu égal au temps calculé (61 = « 61 ou plus »)')
    check(relu['iles_sans_pont'] == sorted(ILES), f'iles_sans_pont : {len(relu["iles_sans_pont"])} codes de H161')
    avec_temps = [c for c in codes if any(v is not None for v in servi[c].values())]
    sans_temps = sorted(set(codes) - set(avec_temps))
    check(len(avec_temps) == ATTENDU['avec un temps'],
          f"{len(avec_temps)} communes avec au moins un temps (attendu {ATTENDU['avec un temps']}) ; sans : {', '.join(f'{c} {nom[c]}' for c in sans_temps)}")
    check(sans_temps == sorted(set(SANS_CARREAU) - set(GL_DEPUIS_LA_MAIRIE)), 'sans temps = les sans carreau, moins Suzan et Villefranche-le-Château')
    for c in GL_DEPUIS_LA_MAIRIE:
        v = servi[c]
        check(v['gare_grandes_lignes'] is not None and all(v[s] is None for s in DES_CARREAUX),
              f'{nom[c]} ({c}) : seulement « Gare grandes lignes », depuis la mairie ({v["gare_grandes_lignes"]} min)')
    check(all(all(v is None for v in servi[c].values()) for c in POP_0), 'les 6 communes de population 0 sans aucun temps')
    for c, attendu in AC13.items():
        lu = {s: servi[c][s] for s in attendu}
        check(lu == attendu, f'AC-13 : {nom[c]} ({c}) {lu}', muet=c in POP_0)
    brut, gz = len(contenu), len(gzip.compress(contenu, 9, mtime=0))
    check(gz <= LIMITE_GZIP, f'poids écrit (H206) : {brut} octets bruts, {gz} octets en gzip -9 (limite {LIMITE_GZIP}, H162)')

    print('Gares grandes lignes (public/data/gares-grandes-lignes.csv)')
    with open(os.path.join(RAW, 'services-gares.csv'), encoding='utf-8', newline='') as f:
        gares = list(csv.reader(f))
    chemin_gares = os.path.join(OUT, 'gares-grandes-lignes.csv')
    texte = io.StringIO()
    csv.writer(texte, lineterminator='\n').writerows(gares)
    with open(chemin_gares, 'w', encoding='utf-8', newline='') as f:
        f.write(texte.getvalue())
    with open(chemin_gares, encoding='utf-8', newline='') as f:
        relues = list(csv.reader(f))
    check(relues == gares and len(gares) - 1 == ATTENDU['gares'],
          f'{len(relues) - 1} gares écrites et relues, colonnes {relues[0]}')

    print('Comptes refaits sur le fichier servi (nouveau / ancien des mesures de /spec ; information)')
    nouveaux = comptes(servi, codes)
    print('  ' + ' | '.join(['service'.ljust(20)] + [(f'≤ {s}' if isinstance(s, int) else s).rjust(15) for s in SEUILS]))
    for s in SERVICES:
        cases = [f"{nouveaux[s][k]} / {ANCIENS[s].get(k, '—')}".rjust(15) for k in SEUILS]
        print('  ' + ' | '.join([s.ljust(20)] + cases))
    check(nouveaux['supermarche'] == SUPERMARCHE,
          f"supermarché : comptes égaux à ceux de mesures.md (révision D19, D20), Tende retiré (H210) {nouveaux['supermarche']}")

    print('Urgences et supermarché : témoins de mesures.md, minutes avant arrondi (information)')
    for c in ['75056', '33063', '76351', '48095', '74056', '32013', '85194', '22016', '05157', '04155', '06163', '85113']:
        m = communes.get(c, SANS_CARREAUX)['medianes']
        avant = {s: None if m[s] is None else m[s] / 100 for s in ('urgences', 'supermarche')}
        print(f"  {c} {nom[c]} : urgences {avant['urgences']} → {servi[c]['urgences']} ; supermarché {avant['supermarche']} → {servi[c]['supermarche']}")
    print('Urgences : les 10 plus grands temps hors îles sans pont, minutes avant arrondi (information, H205)')
    pires = sorted(((communes.get(c, SANS_CARREAUX)['medianes']['urgences'], c) for c in codes
                    if c not in ILES and servi[c]['urgences'] is not None), reverse=True)[:10]
    for m, c in pires:
        print(f"  {c} {nom[c]} ({dep[c]}) : {m / 100} min ; supermarché {servi[c]['supermarche']}")

    print('« Gare grandes lignes » : d\'où vient le temps retenu (information)')
    insee = mairie = gagne = 0
    for c in codes:
        if temps[c]['gare_grandes_lignes'] is None:
            continue
        nat = communes.get(c, SANS_CARREAUX)['medianes']['nationale']
        m = min((t for t in ors.get(c, ()) if t is not None), default=None)
        if m is None or (nat is not None and nat <= m):
            insee += 1
        else:
            mairie += 1
            if (nat is None or arrondi(nat) > 30) and temps[c]['gare_grandes_lignes'] <= 30:
                gagne += 1
    print(f'  Insee (gare nationale) : {insee} ; depuis la mairie (openrouteservice) : {mairie} ; passent sous 30 min grâce aux gares ajoutées : {gagne}')

    print('Population des carreaux et population légale (communes de 500 habitants ou plus, écart de plus de 30 % ; information)')
    ecarts = []
    for c in codes:
        if pop[c] >= 500:
            p = communes.get(c, SANS_CARREAUX)['pop'] / 10 ** DEC_POP
            if abs(p - pop[c]) > 0.3 * pop[c]:
                ecarts.append((p / pop[c] - 1, c, nom[c], dep[c], pop[c], round(p)))
    print(f'  {len(ecarts)} communes')
    for e, c, n, d, legale, carreaux in sorted(ecarts):
        print(f'  {c} {n} ({d}) : {carreaux} dans les carreaux, {legale} légaux ({e:+.0%})')
    print(f'écrit : {os.path.relpath(chemin, ROOT)} ({brut} octets) et {os.path.relpath(chemin_gares, ROOT)}')


if __name__ == '__main__':
    main()
