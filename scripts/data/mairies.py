"""Mairie élue en 2026 de chaque commune de la carte (tranche mairies, R39, D4, D5, D8) : public/data/mairies.json et
public/data/nuances.json.

Résultats (H116) : ressource « Résultats - Communes » des jeux « Elections municipales 2026 - Résultats du premier tour »
et « … du second tour » du ministère de l'Intérieur (data.gouv.fr, Licence Ouverte), téléchargés par sources.py ; une
ligne par commune, ses listes à la suite (nuance, libellé, voix, sièges au conseil municipal). Blocs (H117) : annexes 2 et 3
de la circulaire du 2 février 2026 relative à l'attribution des nuances (n° 45645), lues dans le PDF et recopiées dans
scripts/data/nuances-2026.csv (colonne `bloc_annexe`) ; sauf LFI et LEXG, rangées en « gauche » par Vincent le 2026-10-19
(D2 amendée, colonnes `bloc` et `ecart`) : le bloc « extrême gauche » n'existe plus sur le site.

Règle (R39) : la mairie est la liste qui a le plus de sièges au conseil municipal, au second tour si la commune en a eu un,
sinon au premier ; à égalité de sièges, celle qui a le plus de voix (H115) ; au moins un siège, sinon « sans résultat ».
Une commune absente des deux tours est « sans résultat ». Nuance vide = « sans étiquette » (le ministère ne nuance que les
communes de 3 500 habitants et plus et les chefs-lieux d'arrondissement, D8). Jointure par code INSEE (H121) ; Paris, Lyon
et Marseille : le conseil de toute la ville (fichiers des communes, pas ceux des conseils d'arrondissement).

Sorties : mairies.json = {"champs": ["code", "nuance", "liste"], "communes": [...]}, une ligne par commune de
communes.json, dans son ordre ; nuance "" = sans étiquette ; nuance et liste à null = sans résultat. nuances.json =
{"<code>": {"etiquette", "bloc"}} (bloc : nom de H108).

Prérequis : python3 scripts/data/sources.py, puis python3 scripts/data/communes.py
Usage : python3 -I scripts/data/mairies.py  (s'arrête sur le premier contrôle qui échoue)
        python3 -I scripts/data/mairies.py --extrait <fichier.json>  (format de fixture.extrait_ministere d'AC-11 :
        écrit sur la sortie standard {"<code>": {"bloc", "etiquette", "liste"} | null} pour communes_attendues)
"""
import csv
import hashlib
import json
import os
import sys

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
RAW = os.path.join(ROOT, 'data-raw')
OUT = os.path.join(ROOT, 'public', 'data')
NUANCES = os.path.join(os.path.dirname(__file__), 'nuances-2026.csv')

# Fichiers retenus en tâche 0 (2026-10-18), empreintes notées aussi dans CLAUDE.md : un fichier rectifié arrête le script.
FICHIERS = {
    'premier tour': ('municipales-2026-resultats-communes-2026-03-20.csv',
                     'bc17b6186012da734d5073f3fe95cdcac4cef1c26fe512d50b578cea85b61275'),
    'second tour': ('municipales-2026-resultats-communes-2026-03-23-16h14.csv',
                    'f83bc07995a75b1602186c0159aace3f3520e72ce6d9bf6f8aac0b4b8a25b69a'),
}
BLOCS = ('gauche', 'divers', 'centre', 'droite', 'extreme-droite')  # H108, ordre de R38 (D2 amendée le 2026-10-19)
SEUIL_NUANCE = 3500  # D8 : seuil de population sous lequel le ministère ne nuance pas (hors chefs-lieux d'arrondissement)
# Comptes d'AC-12, mesurés le 2026-10-18 sur ces fichiers ; tout écart arrête le script (condition d'arrêt de la tâche 0).
ATTENDU = {'communes': 34746, 'avec mairie': 34672, 'sans résultat': 74, 'avec étiquette': 3164, 'sans étiquette': 31508,
           'codes non reliés': 0, 'égalités de sièges': 4}
DEBUT_LISTES, LARGEUR_LISTE = 18, 13  # colonnes des fichiers : 18 de la commune, puis 13 par liste
NUANCE, LIBELLE, VOIX, SIEGES = 4, 6, 7, 11  # dans les 13 colonnes d'une liste
MODE_EXTRAIT = '--extrait' in sys.argv  # contrôles écrits sur la sortie d'erreur, la sortie standard reste du JSON


def check(cond, msg, muet=False):
    """Contrôle : affiché, arrêt s'il échoue ; `muet` : affiché seulement s'il échoue (contrôles ligne à ligne)."""
    if cond and muet:
        return
    print(('  ok   ' if cond else '  ÉCHEC ') + msg, file=sys.stderr if MODE_EXTRAIT else sys.stdout)
    if not cond:
        raise SystemExit(1)


def choisir_mairie(premier, second):
    """R39 : la mairie d'une commune à partir de ses listes ({liste, nuance, voix, sieges}) aux deux tours.

    `second` : None si la commune n'a pas eu de second tour. Renvoie (liste retenue ou None, égalité de sièges départagée
    par les voix). Deux listes à égalité de sièges et de voix : arrêt (aucune règle pour les départager).
    """
    listes = [l for l in (second if second is not None else premier) if l['sieges'] >= 1]
    if not listes:
        return None, False
    listes.sort(key=lambda l: (l['sieges'], l['voix']), reverse=True)
    if len(listes) > 1:
        a, b = listes[0], listes[1]
        check((a['sieges'], a['voix']) != (b['sieges'], b['voix']), f"pas deux listes à égalité de sièges et de voix ({a['liste']})", muet=True)
        return a, a['sieges'] == b['sieges']
    return listes[0], False


def table_nuances():
    with open(NUANCES, encoding='utf-8', newline='') as f:
        lignes = list(csv.DictReader(f))
    table = {r['code']: {'etiquette': r['etiquette'], 'bloc': r['bloc']} for r in lignes}
    check(len(table) == 25 and all(n['bloc'] in BLOCS for n in table.values()),
          f'table des nuances : {len(table)} nuances de listes (annexe 2), chacune dans un des {len(BLOCS)} blocs du site')
    ecarts = sorted(r['code'] for r in lignes if r['bloc'] != r['bloc_annexe'])
    check(ecarts == sorted(r['code'] for r in lignes if r['ecart']) == ['LEXG', 'LFI']
          and all((r['bloc_annexe'], r['bloc']) == ('extreme-gauche', 'gauche') for r in lignes if r['ecart']),
          f"D2 amendée : seules LEXG et LFI quittent le bloc de l'annexe 3 (extreme-gauche → gauche), écart noté ({ecarts})")
    return table


def empreinte(tour, nom, sha_attendu):
    """Le fichier présent est celui retenu en tâche 0 (empreinte de CLAUDE.md) et celui noté par sources.py."""
    path = os.path.join(RAW, nom)
    info = json.load(open(path + '.info.json'))
    sha = hashlib.sha256()
    with open(path, 'rb') as f:
        while chunk := f.read(1 << 20):
            sha.update(chunk)
    print(f"{tour} : {nom}, Last-Modified {info['last_modified']}, téléchargé le {info['telecharge_le']},"
          f" {info['octets']} octets, sha256 {sha.hexdigest()}")
    check(sha.hexdigest() == sha_attendu == info['sha256'], f'{tour} : empreinte égale à celle retenue (CLAUDE.md) et à celle notée')
    return path


def lire_tour(path):
    """Listes de chaque commune de métropole (codes des départements 97x et 98x exclus), par code INSEE."""
    communes = {}
    with open(path, encoding='utf-8', newline='') as f:
        lignes = csv.reader(f, delimiter=';')
        tete = next(lignes)
        check(tete[2] == 'Code commune' and tete[DEBUT_LISTES + NUANCE] == 'Nuance liste 1'
              and tete[DEBUT_LISTES + LIBELLE] == 'Libellé de liste 1' and tete[DEBUT_LISTES + SIEGES] == 'Sièges au CM 1',
              f'{os.path.basename(path)} : colonnes attendues')
        for r in lignes:
            if r[0].startswith(('97', '98')):
                continue
            check(r[2] not in communes, f'code {r[2]} une seule fois', muet=True)
            listes = []
            for i in range(DEBUT_LISTES, len(r), LARGEUR_LISTE):
                l = r[i:i + LARGEUR_LISTE]
                if any(l):
                    listes.append({'liste': l[LIBELLE], 'nuance': l[NUANCE], 'voix': int(l[VOIX]), 'sieges': int(l[SIEGES] or 0)})
            communes[r[2]] = listes
    return communes


def extrait(chemin, table):
    """AC-11 : le même calcul sur un extrait au format de fixture.extrait_ministere."""
    ex = json.load(open(chemin, encoding='utf-8'))
    def tour(cle):
        return {c['code_commune']: [{'liste': l['liste'], 'nuance': l['nuance'], 'voix': l['voix'], 'sieges': l['sieges_cm']}
                                    for l in c['listes']] for c in ex[cle]}
    t1, t2 = tour('premier_tour'), tour('second_tour')
    sortie = {}
    for code in ex['communes_attendues']:
        m = None
        if code in t1 or code in t2:
            m, _ = choisir_mairie(t1.get(code, []), t2.get(code))
        if m is None:
            sortie[code] = None
        elif m['nuance'] == '':
            sortie[code] = {'bloc': None, 'etiquette': None, 'liste': m['liste']}
        else:
            check(m['nuance'] in table, f"nuance {m['nuance']} dans la table", muet=True)
            n = table[m['nuance']]
            sortie[code] = {'bloc': n['bloc'], 'etiquette': n['etiquette'], 'liste': m['liste']}
    json.dump(sortie, sys.stdout, ensure_ascii=False)
    print()


def main():
    table = table_nuances()
    if MODE_EXTRAIT:
        extrait(sys.argv[sys.argv.index('--extrait') + 1], table)
        return
    t1 = lire_tour(empreinte('premier tour', *FICHIERS['premier tour']))
    t2 = lire_tour(empreinte('second tour', *FICHIERS['second tour']))
    carte = json.load(open(os.path.join(OUT, 'communes.json'), encoding='utf-8'))
    pop = {r[0]: r[carte['champs'].index('population')] for r in carte['communes']}
    nom = {r[0]: r[1] for r in carte['communes']}
    check(len(pop) == ATTENDU['communes'], f"{len(pop)} communes sur la carte")

    print(f'premier tour : {len(t1)} communes de métropole ; second tour : {len(t2)}')
    non_relies = sorted(c for c in set(t1) | set(t2) if c not in pop)
    print(f'codes de métropole des fichiers absents de communes.json : {len(non_relies)} {non_relies[:20]}')
    check(len(non_relies) == ATTENDU['codes non reliés'], 'H121 : tout code de métropole des fichiers existe dans communes.json')
    check(all(c in t1 for c in t2), 'toute commune du second tour est aussi au premier')
    sieges_t1 = sorted(c for c in t2 if any(l['sieges'] for l in t1[c]))
    print(f'communes du second tour qui ont des sièges au premier : {len(sieges_t1)} {sieges_t1[:20]}')
    absentes = [c for c in pop if c not in t1 and c not in t2]
    print(f'communes de la carte absentes des deux fichiers : {len(absentes)} (attendu {ATTENDU["sans résultat"]})')

    nuances_fichiers = sorted({l['nuance'] for t in (t1, t2) for ls in t.values() for l in ls})
    hors = [n for n in nuances_fichiers if n and n not in table]
    print(f'nuances des fichiers : {", ".join(n or "(vide)" for n in nuances_fichiers)}')
    check(not hors, f'toute nuance non vide des fichiers est dans la table (hors table : {hors})')

    lignes, egalites, sans_siege = [], [], []
    for code in pop:
        m = None
        if code in t1:
            m, egalite = choisir_mairie(t1[code], t2.get(code))
            if m is None:
                sans_siege.append(code)
            elif egalite:
                egalites.append(code)
        lignes.append([code, None, None] if m is None else [code, m['nuance'], m['liste']])

    avec = [l for l in lignes if l[1] is not None]
    etiq = [l for l in avec if l[1] != '']
    sans_etiq = [l for l in avec if l[1] == '']
    print(f'communes présentes mais sans liste avec un siège : {len(sans_siege)} {sans_siege}')
    print(f"égalités de sièges, départagées par les voix (H115) : {len(egalites)} "
          f"{[(c, nom[c]) for c in egalites]}")
    gros = [l[0] for l in sans_etiq if not (pop[l[0]] is not None and pop[l[0]] < SEUIL_NUANCE)]
    petits = [l[0] for l in etiq if pop[l[0]] is not None and pop[l[0]] < SEUIL_NUANCE]
    print(f'mairies avec étiquette dans une commune de moins de {SEUIL_NUANCE} habitants (chefs-lieux attendus) : {len(petits)}')
    check(not gros, f'D8 : toute mairie sans étiquette est dans une commune de moins de {SEUIL_NUANCE} habitants ({gros[:10]})')
    comptes = {'communes': len(lignes), 'avec mairie': len(avec), 'sans résultat': len(lignes) - len(avec),
               'avec étiquette': len(etiq), 'sans étiquette': len(sans_etiq), 'codes non reliés': len(non_relies),
               'égalités de sièges': len(egalites)}
    for k, v in ATTENDU.items():
        check(comptes[k] == v, f'AC-12 : {k} {comptes[k]} (attendu {v})')
    par_bloc = {b: sum(1 for l in etiq if table[l[1]]['bloc'] == b) for b in BLOCS}
    print('mairies par bloc : ' + ', '.join(f'{b} {n}' for b, n in par_bloc.items()) + f', sans étiquette {len(sans_etiq)}')

    with open(os.path.join(OUT, 'mairies.json'), 'w', encoding='utf-8') as f:
        json.dump({'champs': ['code', 'nuance', 'liste'], 'communes': lignes}, f, ensure_ascii=False, separators=(',', ':'))
    with open(os.path.join(OUT, 'nuances.json'), 'w', encoding='utf-8') as f:
        json.dump(table, f, ensure_ascii=False, separators=(',', ':'))
    for n in ('mairies.json', 'nuances.json'):
        print(f'écrit : public/data/{n} ({os.path.getsize(os.path.join(OUT, n))} octets)')


if __name__ == '__main__':
    main()
