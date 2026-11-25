# Recalage des critères et des tests des tranches construites : la mer en minutes seulement (recherche-et-mer, D5 révisée,
# D6, D7, D9 ; R60 à R63). Modèle des règles indépendant du code du site, vérifié d'abord sur l'état actuel (mer en km) :
# chaque texte « avant » est recalculé par le modèle en km et doit se trouver mot pour mot dans le critère d'aujourd'hui ;
# le texte « après » est le même calcul en minutes. Le modèle en minutes est vérifié sur AC-6 à AC-10 d'ici.
# Usage : python3 -I recalage.py              → contrôle du modèle, puis écrit recalage.md (lecture pour Vincent)
#         python3 -I recalage.py --appliquer  → réécrit aussi les acceptance.json des 7 tranches (tâche 3b, après l'accord)
import json, math, re, sys
from pathlib import Path

ICI = Path(__file__).resolve().parent
SPECS = ICI.parent
RACINE = SPECS.parent.parent


def charger(tranche):
    return json.loads((SPECS / tranche / 'acceptance.json').read_text())


TRANCHES = {
    'loyer-mer': '2026-10-12-loyer-mer', 'interface-telephone': '2026-10-13-interface-telephone',
    'proches': '2026-10-13-proches', 'cadre-de-vie': '2026-10-14-cadre-de-vie', 'immobilier': '2026-10-14-immobilier',
    'proches-fiables': '2026-10-16-proches-fiables', 'mairies': '2026-10-18-mairies',
}
SANS_MER = {'emploi': '2026-11-21-emploi', 'services': '2026-11-23-services'}  # contrôlées : aucune mer en km
ICI_SPEC = charger('2026-11-25-recherche-et-mer')

# ---------------------------------------------------------------------------------------------------------------------
# Données des jeux de test, lues dans les fixtures (jamais recopiées).
IMMO = {it['id']: it for it in charger(TRANCHES['immobilier'])['fixture']['items']}  # A à F, loyers, prix, mer en km
CADRE = {it['code_insee']: it for it in charger(TRANCHES['cadre-de-vie'])['fixture']['items']}
MAIRIES = {it['code_insee']: it for it in charger(TRANCHES['mairies'])['fixture']['items']}
MER_MIN = {it['code_insee']: it['mer_min'] for it in ICI_SPEC['fixture']['items']}  # null = sans temps (D7)
METRO = {it['id']: it for it in json.loads((RACINE / 'tests/fixtures/metropole.json').read_text())['items']}
_PR = charger(TRANCHES['proches'])['fixture']['services']
TRAJETS = next(v for k, v in _PR.items() if k.startswith('calcul de trajets'))
_PF = charger(TRANCHES['proches-fiables'])['fixture']
TRAJETS.update(next(v for k, v in _PF['services'].items() if k.startswith('calcul de trajets')))
_DIST = re.search(r"Distances à vol d'oiseau depuis \[0\.5, 0\.5\][^:]*: ([^.]*)\.", _PF['description']).group(1)
ROCHELLE_KM = {nom: int(km) for nom, km in re.findall(r"([A-Z][a-z]+) (\d+)", _DIST)}


def rh(x):
    """Arrondi de la page (Math.round) : moitié vers le haut."""
    return math.floor(x + 0.5)


def mer_min_du_jeu(it):
    """Règle de carte.ts (plan, « Accordé ») : mer_min de recherche-et-mer par code INSEE ; sinon les km servis à la minute."""
    return MER_MIN[it['code_insee']] if it['code_insee'] in MER_MIN else rh(it['mer_km'])


def commune(it):
    code = it['code_insee']
    cadre, mairie = CADRE.get(code, {}), MAIRIES.get(code)
    bord = None if mairie is None or mairie['sans_resultat'] else (mairie['mairie_bloc'] or 'sans-etiquette')
    return dict(code=code, nom=it['nom'], dep=it['dep'], pop=it['population'], loyer=it['loyer_m2'],
                loyer_maison=it.get('loyer_m2_maison'), achat={'appartement': it.get('achat_appartement', {}).get('m2'),
                                                                'maison': it.get('achat_maison', {}).get('m2')},
                mer_km=it['mer_km'], mer_min=mer_min_du_jeu(it), montagne=cadre.get('montagne_km'),
                type=cadre.get('type_env'), bord=bord)


SIX = {i: commune(it) for i, it in IMMO.items()}
CINQ = {i: c for i, c in SIX.items() if i != 'F'}
METROPOLE = {i: (CINQ[i] if i in CINQ else commune(it)) for i, it in METRO.items()}  # A à E identiques, R1 et R2 à 300 km
assert all(SIX[i]['mer_km'] == METRO[i]['mer_km'] for i in CINQ)

# ---------------------------------------------------------------------------------------------------------------------
# Règles d'aujourd'hui (km) et de demain (minutes).
CHOIX_KM = [10, 30, 50, 100]  # R28 de cadre-de-vie
CHOIX_MIN = [15, 30, 60, 90]  # R60


def lire_mer_km(n):
    """url.ts d'aujourd'hui (R31 de cadre-de-vie) : 5 à 200 par pas de 5 → le choix juste au-dessus, sinon Peu importe."""
    if not (5 <= n <= 200 and (n - 5) % 5 == 0):
        return None
    return next((c for c in CHOIX_KM if c >= n), None)


def duree(m):
    """H191 : « moins d'1 min », « 50 min », « 1 h », « 1 h 05 », « 2 h 40 »."""
    if m == 0:
        return "moins d'1 min"
    if m < 60:
        return f'{m} min'
    return f'{m // 60} h' + (f' {m % 60:02d}' if m % 60 else '')


def entier(n):
    return f'{rh(n):,}'.replace(',', ' ')


def euros(n):
    return f'{entier(n)} €'


def taille(pop):
    return 'petite-commune' if pop < 10000 else 'petite-ville' if pop < 50000 else 'ville-moyenne' if pop < 200000 else 'grande-ville'


PRIX_DEPART = ('louer', 'appartement', 'total', 52)


def valeur_prix(c, prix):
    mode, bien, unite, surface = prix
    m2 = c['achat'][bien] if mode == 'acheter' else (c['loyer'] if bien == 'appartement' else c['loyer_maison'])
    if m2 is None:
        return None
    if unite == 'm2':
        return rh(m2 * 10) / 10 if mode == 'louer' else rh(m2)
    return rh(m2 * surface) if mode == 'louer' else rh(m2 * surface / 1000) * 1000


def prix_texte(v, prix):
    mode, _, unite, _ = prix
    if v is None:
        return 'prix inconnu'
    if unite == 'total':
        return euros(v)
    return f"{v:.1f}".replace('.', ',') + ' €/m²' if mode == 'louer' else f'{entier(v)} €/m²'


class S:
    """Un réglage de la page. `mer` : le choix d'aujourd'hui en km ; `mer_min` : un choix en minutes posé directement
    (critères de recherche-et-mer seulement) ; `proches` : (nom, plafond, {id: fin de tranche}) ou (nom, plafond km, 'km')."""

    def __init__(self, jeu, loyer=1200, prix=PRIX_DEPART, mer=None, mer_min=None, montagne=None, tailles=(), types=(),
                 bords=(), proches=(), sans_temps=(), nom=''):
        self.jeu, self.loyer, self.prix, self.mer, self.mer_min_direct, self.montagne = jeu, loyer, prix, mer, mer_min, montagne
        self.tailles, self.types, self.bords, self.proches, self.sans_temps, self.nom = tailles, types, bords, proches, sans_temps, nom


def km_vers_min(km):
    return CORRESPONDANCE[km]


class Vue:
    """Le réglage `s` évalué avec les règles d'un mode : 'km' (aujourd'hui) ou 'min' (demain)."""

    def __init__(self, s, mode):
        self.s, self.mode, self.km, self.lus = s, mode, mode == 'km', set()
        self.plafond = (s.mer if self.km else (s.mer_min_direct if s.mer_min_direct is not None else
                                               (km_vers_min(s.mer) if s.mer is not None else None)))
        if s.mer_min_direct is not None:
            assert not self.km
        self.e = {i: self._evaluer(i, c) for i, c in s.jeu.items()}
        classes = sorted((i for i, e in self.e.items() if e['score'] is not None),
                         key=lambda i: (self.e[i]['prix'] is None, -self.e[i]['score'], self.e[i]['prix'] or 0, s.jeu[i]['nom']))
        for r, i in enumerate(classes, 1):
            self.e[i]['rang'] = r
        self.classes = classes

    def mer(self, i):
        """Valeur comparée (km au km affiché ; minutes servies, ou km comptés comme minutes, D7) et drapeau « compté »."""
        c = self.s.jeu[i]
        if self.km:
            return max(1, rh(c['mer_km'])), False
        m = None if i in self.s.sans_temps else c['mer_min']
        return (max(1, m), False) if m is not None else (max(1, rh(c['mer_km'])), True)

    def _evaluer(self, i, c):
        s, raisons, notes = self.s, [], {}
        v = valeur_prix(c, s.prix)
        if s.loyer is not None and v is not None:
            if v > s.loyer:
                raisons.append('prix')
            else:
                notes['loyer'] = 100 * (1 - v / s.loyer)
        if self.plafond is not None:
            m, _ = self.mer(i)
            if m > self.plafond:
                raisons.append('mer')
            else:
                notes['mer'] = 100 * (1 - m / self.plafond)
        if s.montagne is not None:
            k = c['montagne']
            k = 0 if k == 0 else max(1, rh(k))
            if k > s.montagne:
                raisons.append('montagne')
            else:
                notes['montagne'] = 100 * (1 - k / s.montagne)
        if s.tailles and taille(c['pop']) not in s.tailles:
            raisons.append('taille')
        if s.types and c['type'] not in s.types:
            raisons.append('type')
        if s.bords and c['bord'] not in s.bords:
            raisons.append('bord')
        for k, (nom, p, t, _) in enumerate(s.proches):
            x = max(1, rh(ROCHELLE_KM[c['nom']])) if t == 'km' else (t.get(i) or 0)
            if (t != 'km' and x == 0) or x > p:
                raisons.append(nom)
            else:
                notes[nom.split(' (')[0]] = 100 * (1 - x / p)
        moyenne = sum(notes.values()) / len(notes) if notes else None
        score = rh(round(moyenne * 1e9) / 1e9) if (not raisons and notes) else None
        moitie = moyenne is not None and score is not None and abs(moyenne - math.floor(moyenne) - 0.5) <= 0.01
        return dict(raisons=raisons, notes=notes, score=score, prix=v, moyenne=moyenne, moitie=moitie, rang=None)

    # Textes de la page.
    @property
    def pm(self):
        """Pastille du choix de la mer : « 50 km » / « 1 h »."""
        return f'{self.plafond} km' if self.km else duree(self.plafond)

    @property
    def adr(self):
        return f'mer={self.plafond}' if self.km else f'mer-min={self.plafond}'

    def col(self, i):
        """Dernière colonne de la liste (R5 de loyer-mer ; R62)."""
        c = self.s.jeu[i]
        if self.km:
            return "moins d'1 km" if c['mer_km'] < 1 else f"{entier(c['mer_km'])} km"
        m, compte = self.mer(i)
        return f'≈ {duree(m)}' if compte else duree(c['mer_min'])

    def sc(self, i):
        e = self.e[i]
        assert e['score'] is not None, (self.s.nom, i, e)
        self.lus.add(i)
        return str(e['score'])

    def l(self, i):
        """Ligne de liste : « 1 · Portmer (17) · 72 · 650 € · moins d'1 km »."""
        c, e = self.s.jeu[i], self.e[i]
        return f"{e['rang']} · {c['nom']} ({c['dep']}) · {self.sc(i)} · {prix_texte(e['prix'], self.s.prix)} · {self.col(i)}"

    def n(self, i):
        c = self.s.jeu[i]
        return f"{c['nom']} ({c['dep']}) {self.sc(i)}"

    def fm(self, i):
        """Ligne de la fiche (R4 de loyer-mer ; R63)."""
        c = self.s.jeu[i]
        if self.km:
            return "moins d'1 km de la mer" if c['mer_km'] < 1 else f"{entier(c['mer_km'])} km de la mer à vol d'oiseau"
        m, compte = self.mer(i)
        return f"Temps en voiture jusqu'à la mer inconnu : compté {duree(m)} d'après les km" if compte else f"{duree(c['mer_min'])} de la mer en voiture"

    def rm(self, i):
        """Raison de la mer (R1 de loyer-mer ; R62)."""
        assert 'mer' in self.e[i]['raisons'], (self.s.nom, i)
        m, compte = self.mer(i)
        if self.km:
            return f'Mer {m} km : au-dessus de ton plafond de {self.plafond} km'
        return f"Mer {'≈ ' if compte else ''}{duree(m)} : au-dessus de ton plafond de {duree(self.plafond)}"

    def pal(self, i):
        return str(min(5, self.e[i]['score'] // 20 + 1))

    def note(self, i, critere):
        return str(rh(self.e[i]['notes'][critere]))

    def compte(self):
        n = len(self.classes)
        return 'Aucune commune ne passe tes critères' if n == 0 else '1 commune passe tes critères' if n == 1 else f'{n} communes passent tes critères'


# ---------------------------------------------------------------------------------------------------------------------
# La correspondance des choix (sortie 1 du plan) : pour chaque choix en km, le choix en minutes qui garde les mêmes
# communes sur la mer seule, dans tous les jeux (le plus proche du nombre de km s'il y en a plusieurs).
def passent_mer(jeu, mode, plafond):
    s = S(jeu, loyer=None, mer=plafond if mode == 'km' else None, mer_min=plafond if mode == 'min' else None)
    return {i for i, e in Vue(s, mode).e.items() if not e['raisons']}


JEUX = {'5 communes': CINQ, '6 communes': SIX, 'métropole': METROPOLE}
CORRESPONDANCE, CANDIDATS = {}, {}
for k in CHOIX_KM:
    ok = [m for m in CHOIX_MIN if all(passent_mer(j, 'km', k) == passent_mer(j, 'min', m) for j in JEUX.values())]
    CANDIDATS[k] = ok
    CORRESPONDANCE[k] = min(ok, key=lambda m: (abs(m - k), m)) if ok else None
assert all(CORRESPONDANCE.values()), CANDIDATS  # sinon : critères qui changent de sens, à ranger à part

# Réglages des critères (nommés pour le tableau des valeurs de référence).
P = lambda mode='louer', bien='appartement', unite='total', surface=52: (mode, bien, unite, surface)
PANNES = lambda pannes: f" (zones {', '.join(map(str, pannes))} min en panne)" if pannes else ''
N = lambda plafond, pannes=(): ('Nantesville (44)', plafond, partiel(TRAJETS['1 rue Test 44000 Nantesville'], pannes),
                                f'Nantesville {duree(plafond)}{PANNES(pannes)}')
T = lambda plafond: ('Toulouseville (31)', plafond, partiel(TRAJETS['2 place Test 31000 Toulouseville'], ()), f'Toulouseville {duree(plafond)}')
R = lambda plafond, pannes=(): ('Rochelleville (17)', plafond, partiel(TRAJETS['6 rue Test 17000 Rochelleville'], pannes),
                                f'Rochelleville {duree(plafond)}{PANNES(pannes)}')
RKM = lambda plafond: ('Rochelleville (17)', plafond, 'km', f"Rochelleville à vol d'oiseau {plafond} km")
ID = {c['code']: i for i, c in SIX.items()}


def partiel(temps, pannes):
    """Proche par zones (R34 de proches-fiables) : fin de la plus petite zone obtenue qui contient la commune ; 0 au-delà
    de la couverture (plus grande zone obtenue) ou à plus de 3 h."""
    obtenues = [z for z in range(15, 181, 15) if z not in pannes]
    couverture = max(obtenues)
    fin = lambda t: 0 if not t or t > couverture else min(z for z in obtenues if z >= t)
    return {ID[code]: fin(t) for code, t in temps.items()}


Z = lambda a, b: tuple(range(a, b + 1, 15))  # zones en panne
MER50_5 = S(CINQ, mer=50, nom='5 communes, /?loyer=1200&mer=50')
MER50_6 = S(SIX, mer=50, nom='6 communes, /?loyer=1200&mer=50')
DEPART_5 = S(CINQ, nom='5 communes, / (départ)')
DEPART_6 = S(SIX, nom='6 communes, / (départ)')
M = MER50_5  # raccourci

# ---------------------------------------------------------------------------------------------------------------------
# Critères. Pour chacun : (champ, réglage, f) ; f(vue) écrit le texte ; avant = f(vue km), après = f(vue min).
# Toute adresse `mer=<n>` lue aujourd'hui comme un choix en km devient `mer-min=<choix correspondant>` (règle commune,
# appliquée après) ; `mer=aucun`, `mer=200` et toute valeur hors choix restent telles quelles (D9 : ignorées, Peu importe).
ligne = lambda *ids: (lambda v: ', '.join(f'« {v.l(i)} »' for i in ids[:-1]) + {1: '', 2: ' et '}.get(len(ids), ', ') + f'« {v.l(ids[-1])} »')
noms = lambda *ids, et=' et ': (lambda v: ', '.join(v.n(i) for i in ids[:-1]) + et + v.n(ids[-1]))
VERIF = 'vérification'  # f qui donne le même texte dans les deux modes : contrôle du modèle, sans changement

CRITERES = {
    'loyer-mer': {
        '*': [('given', M, lambda v: f'mer {v.pm}')],
        'AC-1': [('then', DEPART_5, lambda v: f"D a le score {v.sc('D')} et la couleur de la tranche 60–80 de la légende, A {v.sc('A')} (tranche 40–60), B {v.sc('B')}")],
        'AC-2': [('when', M, lambda v: f'décoche la mer « {v.pm} »'), ('then', DEPART_5, lambda v: f"D {v.sc('D')}, A {v.sc('A')}, B {v.sc('B')}, E {v.sc('E')}")],
        'AC-3': [('then', S(CINQ, loyer=650, mer=50), lambda v: f"A passe avec le score {v.sc('A')} (650 € affiché")],
        'AC-4': [('then', M, ligne('A', 'E', 'B'))],
        'AC-5': [('when', S(CINQ, loyer=300, mer=10), lambda v: f'la mer sur {v.pm}')],
        'AC-7': [('then', M, lambda v: f"le score {v.sc('B')}, « 3e sur 3"), ('then', M, lambda v: f"« {v.fm('B')} »")],
        'AC-8': [('then', M, lambda v: f"« {v.fm('A')} »")],
        'AC-9': [('then', M, lambda v: f"« {v.rm('C')} »")],
        'AC-10': [('then', S(CINQ, mer=50, tailles=('petite-ville',)), lambda v: f"seule A passe (score {v.sc('A')})")],
        'AC-11': [('then', S(CINQ, loyer=800, mer=50), lambda v: f'800 € et {v.pm}'),
                  ('then', S(CINQ, loyer=800, mer=50), ligne('A'))],
        'AC-12': [('then', DEPART_5, noms('D', 'A', 'B', 'E', et=', '))],
    },
    'interface-telephone': {
        'AC-1': [('then', S(METROPOLE, mer=50), lambda v: f"({v.pal('A')}, {v.pal('E')} et {v.pal('B')})")],
        'AC-2': [('then', M, lambda v: v.compte())],
        'AC-4': [('then', S(CINQ, loyer=1000, mer=50), lambda v: v.compte()), ('then', S(CINQ, loyer=650, mer=50), lambda v: v.compte()),
                 ('then', S(CINQ, loyer=300, mer=50), lambda v: v.compte())],
        'AC-5': [('then', M, ligne('A', 'E', 'B'))],
        'AC-6': [('then', M, lambda v: f"score {v.sc('A')}, « 1re sur 3")],
        'AC-7': [('then', M, lambda v: f"« {v.l('B')} »")],
        'AC-10': [('then', S(CINQ, loyer=1000, mer=50), lambda v: f'à « {v.compte()} »')],
        'AC-11': [('then', S(CINQ, mer=50, proches=(N(120),)), lambda v: f'à « {v.compte()} »')],
    },
    'proches': {
        'AC-1': [('then', S(CINQ, mer=50, proches=(N(120),)), ligne('A'))],
        'AC-2': [('then', S(CINQ, mer=50, proches=(N(135),)), ligne('A', 'B'))],
        'AC-3': [('then', S(CINQ, mer=50, proches=(N(120),)), lambda v: f"« {v.fm('B')} »")],
        'AC-4': [('then', S(CINQ, mer=50, proches=(N(135), T(165))), ligne('A', 'B'))],
        'AC-5': [('then', S(CINQ, mer=50, proches=(N(135), T(165))), lambda v: f"le score {v.sc('B')} et « 2e sur 2")],
        'AC-6': [('then', S(CINQ, loyer=None, proches=(N(135),)), lambda v: f"Portmer (17) avec le score {v.sc('A')} et Grandeville (33) avec le score {v.sc('B')}")],
        'AC-8': [('then', S(CINQ, mer=50, proches=(N(135),)), noms('A', 'B', et=' puis '))],
        'AC-9': [('then', M, noms('A', 'E', 'B'))],
        'AC-11': [('then', M, lambda v: v.compte())],
    },
    'cadre-de-vie': {
        'AC-1': [('then', DEPART_6, ligne('D', 'F', 'A', 'B', 'E'))],
        'AC-2': [('when', MER50_6, lambda v: f'la mer « {v.pm} »'), ('then', MER50_6, ligne('A', 'E', 'B')), ('then', MER50_6, lambda v: f"« {v.rm('F')} »")],
        'AC-3': [('then', S(SIX, montagne=10), lambda v: f"« {v.l('D')} » et « {v.l('F')} »")],
        'AC-4': [('then', S(SIX, montagne=50), lambda v: f"« {v.l('D')} », « {v.l('F')} » et « {v.l('B')} »")],
        'AC-5': [('then', S(SIX, types=('ville-dense',)), ligne('B')),
                 ('then', S(SIX, types=('ville-dense', 'bourg-et-village')), noms('D', 'B'))],
        'AC-6': [('then', S(SIX, tailles=('petite-ville',)), noms('F', 'A'))],
        'AC-7': [('then', MER50_6, lambda v: f"le score {v.sc('B')}, « 3e sur 3"), ('then', MER50_6, lambda v: f"« {v.fm('B')} »"),
                 ('then', MER50_6, lambda v: f"« {v.rm('D')} »")],
        'AC-8': [('then', S(SIX, tailles=('petite-commune',), types=('bourg-et-village',)), ligne('D')),
                 ('then', None, lambda v: "(`mer=200` et `montagne=0` ne sont pas des choix)" if v.km else
                  "(`mer=200`, ancien lien, est ignoré, D9 de recherche-et-mer ; `montagne=0` n'est pas un choix)")],
        # Change de sens : la règle vérifiée (une ancienne valeur prend le choix juste au-dessus, R31) disparaît avec D9.
        'AC-9': [('then', S(SIX, mer=100), lambda v: f"avec mer=60 : la mer est sur « {v.pm} », l'adresse devient /?loyer=1200&{v.adr}" if v.km
                  else f"avec {v.adr} : la mer est sur « {v.pm} », l'adresse ne change pas"),
                 ('then', S(SIX, mer=100), noms('A', 'E', 'B', et=', ')),
                 ('then', S(SIX, mer=30), lambda v: f"Avec mer=25 : la mer est sur « {v.pm} », l'adresse devient /?loyer=1200&{v.adr}" if v.km
                  else f"Avec {v.adr} : la mer est sur « {v.pm} », l'adresse ne change pas"),
                 ('then', S(SIX, mer=30), noms('A', 'E'))],
        'AC-11': [('then', S(SIX, mer=100, montagne=50), ligne('B')),
                  ('then', S(SIX, mer=100, montagne=50), lambda v: f"loyer {v.note('B', 'loyer')}, mer {v.note('B', 'mer')})")],
    },
    'immobilier': {
        'AC-1': [('then', DEPART_6, lambda v: f"D a le score {v.sc('D')}, F {v.sc('F')}, A {v.sc('A')}, B {v.sc('B')}, E {v.sc('E')}")],
        'AC-2': [('then', S(SIX, mer=50, prix=P(surface=72)), ligne('A', 'B'))],
        'AC-3': [('then', S(SIX, mer=50, prix=P(bien='maison', surface=72)), ligne('A', 'B'))],
        'AC-4': [('then', S(SIX, loyer=23, mer=50, prix=P(unite='m2')), ligne('A', 'E', 'B'))],
        'AC-5': [('then', S(SIX, loyer=5000, mer=50, prix=P('acheter', unite='m2')), ligne('A', 'E', 'B'))],
        'AC-6': [('then', S(SIX, loyer=260000, mer=50, prix=P('acheter')), ligne('A', 'E', 'B'))],
        'AC-7': [('then', S(SIX, loyer=5000, mer=50, prix=P('acheter', 'maison', 'm2')), ligne('A', 'E'))],
        'AC-8': [('then', S(SIX, loyer=5000, montagne=100, prix=P('acheter', unite='m2')), ligne('B', 'E', 'D', 'F'))],
        'AC-9': [('then', S(SIX, loyer=5000, prix=P('acheter', unite='m2')), noms('A', 'B', 'E', et=', '))],
        'AC-10': [('then', S(SIX, loyer=300000, prix=P('acheter', 'maison', 'total', 100)), ligne('D'))],
        'AC-13': [('then', S(SIX, loyer=1100, prix=P(bien='maison', surface=92)), lambda v: f"« {v.l('D')} » et « {v.l('A')} »")],
        'AC-14': [('then', None, None)],  # remplacé plus bas (variante « D tous biens »)
    },
    'proches-fiables': {
        'AC-2': [('then', S(CINQ, mer=50, proches=(N(150, (135,)),)), ligne('A', 'B')),
                 ('then', S(CINQ, mer=50, proches=(N(135, (135,)),)), lambda v: f"puis « {v.l('A')} », et la fiche")],
        'AC-3': [('then', S(CINQ, mer=50, proches=(N(120, (180,)),)), ligne('A'))],
        'AC-4': [('then', S(CINQ, mer=50, proches=(RKM(120),)), lambda v: f"« {v.l('A')} », « {v.l('E')} » et « {v.l('B')} »")],
        'AC-5': [('then', S(CINQ, mer=50, proches=(RKM(90),)), lambda v: f"« {v.l('A')} » et « {v.l('B')} »")],
        'AC-6': [('then', S(CINQ, mer=50, proches=(RKM(120),)), lambda v: f"la liste montre {noms('A', 'E', 'B', et=', ')(v)} ; (b)"),
                 ('then', S(CINQ, mer=50, proches=(R(120, Z(135, 180)),)), lambda v: f"puis {noms('A', 'E', 'B', et=', ')(v)}, et la fiche"),
                 ('then', S(CINQ, mer=50, proches=(R(45, Z(120, 180)),)), ligne('A'))],
        'AC-7': [('then', S(CINQ, mer=50, proches=(N(150, (135,)),)), lambda v: f"(la liste montre {noms('A', 'B')(v)})"),
                 ('then', S(CINQ, mer=50, proches=(N(150),)), lambda v: f"« {v.l('A')} » et « {v.l('B')} »")],
        'AC-8': [('then', S(CINQ, mer=50, proches=(R(90),)), lambda v: f"puis « {v.l('A')} » et « {v.l('B')} » ; (b)"),
                 ('then', S(CINQ, mer=50, proches=(RKM(90),)), lambda v: f"montre {noms('A', 'B')(v)} ; (c)"),
                 ('then', S(CINQ, mer=50, proches=(N(150, (135,)),)), lambda v: f"montre {noms('A', 'B')(v)} ; (d)"),
                 ('then', S(CINQ, mer=50, proches=(R(90),)), lambda v: f"montre {noms('A', 'B')(v)} ; (e)")],
        'AC-9': [('then', S(CINQ, mer=50, proches=(RKM(120),)), lambda v: f"la liste reste {noms('A', 'E', 'B', et=', ')(v)} ;"),
                 ('then', S(CINQ, mer=50, proches=(R(120),)), lambda v: f"« {v.l('A')} », « {v.l('E')} » et « {v.l('B')} »")],
        'AC-10': [('then', S(CINQ, mer=50, proches=(N(135),)), lambda v: f"« {v.l('A')} » et « {v.l('B')} »")],
    },
    'mairies': {
        'AC-1': [('then', DEPART_6, noms('D', 'F', 'A', 'B', 'E', et=', '))],
        'AC-2': [('then', S(SIX, bords=('droite',)), ligne('A'))],
        'AC-3': [('then', S(SIX, bords=('gauche',)), ligne('B')), ('then', S(SIX, bords=('gauche', 'sans-etiquette')), noms('D', 'B'))],
    },
}
# Immobilier AC-14 : variante « D tous biens » (achat d'appartement de Terrebasse 1 100 €/m², tests/e2e/lib/carte.ts).
D_TOUS_BIENS = {i: (dict(c, achat=dict(c['achat'], appartement=1100)) if i == 'D' else c) for i, c in SIX.items()}
CRITERES['immobilier']['AC-14'] = [('then', S(D_TOUS_BIENS, loyer=5000, prix=P('acheter', unite='m2')), ligne('D', 'A', 'B', 'E'))]
# Les critères de recherche-et-mer qui donnent des valeurs en minutes de référence (contrôle du modèle en minutes).
REFERENCE_MIN = {
    'AC-6': [S(SIX, mer_min=30), ligne('A', 'E')],
    'AC-7': [S(SIX), ligne('D', 'F', 'A', 'B', 'E')],
    'AC-8': [S(SIX, mer_min=60), lambda v: f"puis {v.n('A')}, {v.n('E')}, {v.n('B')} ; la fiche de Terrebasse contient « Ne passe pas tes critères », « {v.rm('D')} » et « {v.fm('D')} » ; celle de Rhinval contient « {v.rm('F')} » et « {v.fm('F')} »"],
    'AC-9': [S(SIX), lambda v: f"« {v.fm('B')} » puis"],
    'AC-10': [S(SIX, mer_min=15), ligne('A', 'E')],
}
REFERENCE_MIN['AC-9b'] = [S(SIX), lambda v: f"celle de Quaibleu contient « {v.fm('E')} »"]

ADRESSE = re.compile(r'(?<![\w-])mer=(\d+)(?!\d)')


def adresse_min(m):
    c = lire_mer_km(int(m.group(1)))
    return m.group(0) if c is None else f'mer-min={CORRESPONDANCE[c]}'


# Descriptions des fixtures : une phrase ajoutée à chacune des 7 tranches ; et les textes qui y citent la mer en km.
def phrase_fixture(jeu):
    v = Vue(S(jeu), 'min')
    parts = ', '.join(f"{c['nom']} {v.col(i)}" for i, c in jeu.items())
    return (f" Révision recherche-et-mer (2026-11-25, D5 révisée et D9 de cette tranche-là) : la mer ne s'affiche et ne se règle plus "
            f"qu'en minutes de voiture ; chaque commune gagne mer_min, pris dans la fixture de recherche-et-mer par code INSEE "
            f"({parts}{' ; Rhinval est sans temps, comptée d' + chr(39) + 'après ses 420 km' if 'F' in jeu else ''}) ; mer_km reste servi (point "
            f"de côte, repli de D7) mais ne s'affiche plus ; une adresse `mer=` (km) est ignorée.")


FIXTURE_JEU = {'loyer-mer': CINQ, 'interface-telephone': CINQ, 'proches': CINQ, 'cadre-de-vie': SIX, 'immobilier': SIX,
               'proches-fiables': CINQ, 'mairies': SIX}
FIXTURE_PROPRE = {'interface-telephone': [(M, ligne('A', 'E', 'B'))]}


def remplacer(texte, avant, apres, ou):
    assert avant in texte, f'contrôle du modèle : « {avant} » absent de {ou}'
    return texte.replace(avant, apres, 1)


CONTROLES, MOITIES = [], []


def noter_moities(v, ou):
    """Signale les scores en minutes lus par le texte dont la moyenne est à ± 0,01 d'une moitié (H74)."""
    for i in sorted(v.lus):
        e = v.e[i]
        if e['moitie']:
            MOITIES.append((ou, f"{v.s.jeu[i]['nom']} ({v.s.jeu[i]['dep']})", e['moyenne'], e['score'], e['notes']))


class SansReglage:
    def __init__(self, km):
        self.km = km


def textes(s, f):
    """(avant, après, vue en minutes) d'une entrée."""
    if s is None:
        return f(SansReglage(True)), f(SansReglage(False)), None
    vm = Vue(s, 'min')
    return f(Vue(s, 'km')), f(vm), vm


def recaler(nom):
    d = charger(TRANCHES[nom])
    changes = []
    for c in d['criteria']:
        avant = {k: c[k] for k in ('given', 'when', 'then')}
        propres = [(e, True) for e in CRITERES[nom].get(c['id'], [])]
        communes = [(e, False) for e in CRITERES[nom].get('*', [])]
        for (champ, s, f), oblige in propres + communes:
            ou = f"{nom} {c['id']} ({champ})"
            a, b, vm = textes(s, f)
            if not oblige and a not in c[champ]:
                continue  # règle commune de la tranche : seulement là où son texte existe
            c[champ] = remplacer(c[champ], a, b, ou)
            CONTROLES.append((ou, a, b))
            if vm:
                noter_moities(vm, ou)
        for k in avant:
            c[k] = ADRESSE.sub(adresse_min, c[k])
        diff = [(k, avant[k], c[k]) for k in avant if avant[k] != c[k]]
        if diff:
            c['passes'] = False
            changes.append((c['id'], diff))
    # Fixture.
    desc = d['fixture']['description']
    desc0 = desc
    for s, f in FIXTURE_PROPRE.get(nom, []):
        desc = remplacer(desc, f(Vue(s, 'km')), f(Vue(s, 'min')), f'{nom} fixture')
    desc = ADRESSE.sub(adresse_min, desc) + phrase_fixture(FIXTURE_JEU[nom])
    d['fixture']['description'] = desc
    # D19 de proches : AC-15 est remplacé par AC-6 et AC-10 (AC-10 teste désormais les anciens liens, D9).
    extra = []
    if nom == 'proches':
        r = d['remplaces']
        a = "AC-12, AC-13 et AC-15 (mer en minutes, reportés par D14) sont remplacés par AC-6, AC-8 et AC-10 de recherche-et-mer"
        b = ("AC-12, AC-13 et AC-15 (mer en minutes, reportés par D14) sont remplacés par AC-6, AC-8, et AC-6 et AC-10 ensemble, "
             "de recherche-et-mer (AC-10 teste les anciens liens, D9 de recherche-et-mer)")
        r['pourquoi'] = remplacer(r['pourquoi'], a, b, 'proches remplaces')
        ac15 = next(x for x in r['criteria'] if x['id'] == 'AC-15')
        assert ac15['remplace_par'] == 'AC-10 de recherche-et-mer'
        ac15['remplace_par'] = 'AC-6 et AC-10 de recherche-et-mer'
        extra = [('remplaces.pourquoi', a, b), ('remplaces AC-15.remplace_par', 'AC-10 de recherche-et-mer', 'AC-6 et AC-10 de recherche-et-mer')]
    return d, changes, (desc0, desc), extra


# Ce qui doit avoir disparu de tous les critères des tranches passées après le recalage.
RESTES = [
    (ADRESSE, 'adresse mer= lue en km aujourd’hui'),  # `mer=200` et autres valeurs hors choix restent (ignorées, D9)
    (re.compile(r"km de la mer|de la mer à vol d'oiseau"), 'ligne de fiche en km'),
    (re.compile(r'Mer \d+ km'), 'raison en km'),
    (re.compile(r"· (?:\d[\d ]*|moins d'1) km »"), 'ligne de liste en km'),
    (re.compile(r'mer (?:sur |« )?\d+ km'), 'choix de mer en km'),
    (re.compile(r'€ et \d+ km'), 'choix de mer en km'),
]


def restes(d):
    out = []
    for c in d['criteria']:
        for k in ('given', 'when', 'then'):
            for rx, quoi in RESTES:
                for m in rx.finditer(c[k]):
                    if rx is ADRESSE and lire_mer_km(int(m.group(1))) is None:
                        continue
                    out.append((c['id'], k, quoi, m.group(0)))
    return out


# ---------------------------------------------------------------------------------------------------------------------
# Tests hors critère : repérage de toute ligne qui lit la mer en km (adresse, ligne de liste, fiche, raison, pastille,
# résumé, réglage du domaine, commune écrite à la main) dans tests/ et src/**/*.test.ts. Chaque fichier repéré doit avoir
# sa règle (REGLES_TESTS) : un fichier nouveau ou oublié arrête le script.
REPERES = [
    (re.compile(r'(?<![\w-])mer=\d'), 'adresse'),
    (re.compile(r"km de la mer|de la mer à vol d|d'1 km de la mer"), 'fiche'),
    (re.compile(r"Mer \d+ km|'Mer (?!à moins)|Mer \$\{"), 'raison ou résumé'),
    (re.compile(r"· (?:\d[\d ]*|moins d'1) km['\"`]"), 'ligne de liste'),
    (re.compile(r"(?<!ontagne\(page, )'(?:10|30|50|100) km'"), 'pastille'),
    (re.compile(r'\bmer: [1-9]'), 'réglage du domaine'),
    (re.compile(r'\b(?:merKm|mer_km|merTexte|merFiche)\b'), 'commune ou format du domaine'),
    (re.compile(r"SANS_PROCHE = |const DEPART = '/\?loyer=1200&mer"), 'constante'),
]

REGLES_COMMUNES = [
    ("(a) Adresse",
     "`mer=50` → `mer-min=60` ; `mer=60` et `mer=100` → `mer-min=90` ; `mer=5` et `mer=10` → `mer-min=15` ; `mer=25` et "
     "`mer=30` → `mer-min=30` (une valeur d'aujourd'hui lue comme un choix en km prend le choix en minutes qui garde les "
     "mêmes communes) ; `mer=aucun`, `mer=200`, `mer=23`, `mer=0` restent écrites telles quelles (déjà Peu importe, et ignorées "
     "par D9). Avec ces adresses, les mêmes communes passent, dans le même ordre et avec les mêmes paliers de couleur : seuls "
     "les scores et la dernière colonne changent (tableau des valeurs)."),
    ("(b) Liste",
     "Dernière colonne en minutes, toujours (R62) : Portmer « moins d'1 km » → « 5 min », Grandeville « 40 km » → « 50 min », "
     "Montcher « 148 km » → « 2 h 15 », Terrebasse « 180 km » → « 2 h 40 », Quaibleu « 7 km » → « 14 min », Rhinval « 420 km » "
     "→ « ≈ 7 h » ; les scores sont ceux du tableau des valeurs pour le même réglage. Un test qui ouvre `/` sans mer (le départ) "
     "garde ses comptes, scores, rangs et couleurs : le départ n'a pas de mer (R32 de cadre-de-vie), seule la colonne change."),
    ("(c) Fiche et raisons",
     "« 40 km de la mer à vol d'oiseau » → « 50 min de la mer en voiture » ; « moins d'1 km de la mer » → « 5 min de la mer en "
     "voiture » ; « Mer 148 km : au-dessus de ton plafond de 50 km » → « Mer 2 h 15 : au-dessus de ton plafond de 1 h » ; Rhinval "
     "« Mer ≈ 7 h : … » et « Temps en voiture jusqu'à la mer inconnu : compté 7 h d'après les km » (R61, R63) ; la montagne et "
     "les proches restent en km."),
    ("(d) Pastilles et résumé",
     "Pastilles de « Mer à moins de » : « 10 km », « 30 km », « 50 km », « 100 km » → « 15 min », « 30 min », « 1 h », « 1 h 30 » "
     "(même ordre, même nom de groupe) ; résumé replié « Mer 50 km » → « Mer 1 h » (H75 ; « Mer 30 min » à 30). Les pastilles de "
     "la montagne ne changent pas."),
    ("(e) Test d'un critère",
     "Un test dont le titre porte « AC-n » suit son critère recalé ci-dessus, titre compris."),
    ("(f) Commune du domaine",
     "Une commune fabriquée depuis une fixture (`merKm: it.mer_km`) gagne `merMin`, lu dans la fixture de recherche-et-mer par "
     "code INSEE, comme `carte.ts` : les tests du domaine calculent alors les mêmes valeurs que les critères. Une commune écrite à "
     "la main sans `merMin` est sans temps et comptée d'après ses km (D7) : ses nombres ne changent pas (1 km = 1 min), seuls les "
     "textes prennent « ≈ ». `communeDeLigne` lit `mer_min` en dernière colonne, `null` par défaut (plan, tâche 0b)."),
]

REGLES_TESTS = {
    'tests/e2e/adresse.spec.ts': "(e) AC-11 : `/?loyer=800&mer-min=60`, « 1 h » cochée, « 1 · Portmer (17) · 55 · 650 € · 5 min ». AC-12 : rien (`mer=aucun`).",
    'tests/e2e/aucune.spec.ts': "(a) `mer=5` → `mer-min=15` ; aucune commune ne passe à 300 €, rien d'autre ne change.",
    'tests/e2e/cadre-de-vie.spec.ts': (
        "(e) AC-1 à AC-5, AC-7, AC-8, AC-11 ; **AC-9 change de sens** (comme son critère : `mer-min=90` puis `mer-min=30`, adresse "
        "inchangée). Hors critère : H75 (résumés, (d)) ; H76 (pastilles de la mer, (d)) ; D12 Tab (« 10 km » → « 15 min », puis "
        "« 30 min », « 1 h », « 1 h 30 », (d)) ; D12/H75 (« 50 km » → « 1 h ») ; R32 (colonne, (b)). **Le test « R31 » change de "
        "sens** : la règle « une ancienne valeur prend le choix juste au-dessus » disparaît (D9) ; il devient « `/?loyer=1200&mer=5` → "
        "Peu importe, adresse /?loyer=1200 ; `mer-min=` 200, 23, 0 et 50 → Peu importe, adresse /?loyer=1200 » (R60). Les lignes de la "
        "montagne ne changent pas."),
    'tests/e2e/carte.spec.ts': "(e) AC-2 (adresse, pastille « 1 h ») ; AC-3 (adresse, A passe avec 46, toujours en 40–60).",
    'tests/e2e/etats.spec.ts': "(a) ; A passe avec 69, toujours en 60–80 (`score-4`).",
    'tests/e2e/fiche.spec.ts': "(e) AC-7 à AC-10. Parcours : (a), pastille « 50 km » → « 1 h ». Ronds du top 10 : (a), toujours 3 ronds.",
    'tests/e2e/immobilier.spec.ts': (
        "(e) AC-2 à AC-8, AC-10, AC-13, AC-14. Hors critère : D2 et Acheter sans plafond (adresses, (a)) ; « Total puis Au m² » "
        "(adresses, (a)) ; `mer=aucun` des tests « aucune commune » et « sans plafond » : rien ; « aucune commune avec un proche » "
        "(5 communes, `mer=50`) : (a), message inchangé ; design F : (a) et (c), « 50 min de la mer en voiture »."),
    'tests/e2e/lib/carte.ts': "Tâche 3b : la colonne `mer_min` (règle du plan, « Accordé ») ; aucune autre ligne.",
    'tests/e2e/lib/proches.ts': "`SANS_PROCHE` (5 communes, `mer-min=60`) : « 1 · Portmer (17) · 69 · 650 € · 5 min », « 2 · Quaibleu (13) · 43 · 1 092 € · 14 min », « 3 · Grandeville (33) · 24 · 832 € · 50 min » ; commentaires (a), (b). Les tests qui l'importent changent avec elle.",
    'tests/e2e/liste.spec.ts': "(e) AC-4, AC-5 (pastille « 10 km » → « 15 min »). Zone annoncée : (a) ; comptes 3, 1, aucune inchangés.",
    'tests/e2e/mairies.spec.ts': "(e) AC-2, AC-3 : colonne (b), scores inchangés.",
    'tests/e2e/proches-carte.spec.ts': "(e) AC-3 (« 50 min de la mer en voiture »), AC-5 (Grandeville 25), AC-14, AC-16 (adresses). Test des ronds : (a), Portmer toujours 1re.",
    'tests/e2e/proches-clavier-iphone.spec.ts': "(a).",
    'tests/e2e/proches-etats.spec.ts': (
        "`DEPART` : (a). (e) AC-7, AC-8, AC-9, AC-11. Hors critère : « mémoire refusée » : « 1 · Portmer (17) · 63 · 650 € · 5 min » "
        "(moitié exacte 62,5) ; « empreinte qui ne correspond plus » : son `communes.json`, écrit par le test, n'a pas de `mer_min` "
        "(décidé par Claude : il n'en gagne pas, le test garde son objet) ; à la réouverture la page compte la mer d'après les km "
        "(D7) : « 1 · Portmer (17) · 65 · 650 € · ≈ 1 min » ; titres « (Portmer 65) » ajustés en conséquence."),
    'tests/e2e/proches-fiables.spec.ts': "`DEPART` : (a), pour tous les tests du fichier. (e) AC-2 à AC-10 (valeurs de leurs critères) ; AC-1, AC-11, AC-12 : titres seulement (adresse). Hors critère : `SANS_PROCHE` (lib/proches.ts) ; aucun autre chiffre de mer.",
    'tests/e2e/proches.spec.ts': "(e) AC-1, AC-2, AC-4, AC-6 (sans mer : colonne seule, « Portmer (17) · 56 · 650 € · 5 min », « Grandeville (33) · 0 · 832 € · 50 min »). « Retirer » : (a), 69, 43, 24 en minutes.",
    'tests/e2e/services.spec.ts': "(a) ; rien d'autre (le test lit les services).",
    'tests/e2e/telephone-feuille.spec.ts': "(a), dont `mer=60` → `mer-min=90` (trois tests hors critère : focus, H50, « Aucune commune ») ; (e) AC-1 à AC-11 ; `SANS_PROCHE`.",
    'tests/e2e/telephone-vue.spec.ts': "(a), jeu « métropole » : Coin-Sud-Ouest et Coin-Nord-Est à 300 min (« 5 h », règle de carte.ts), ne passent pas (loyer).",
    'src/domain/emploi.test.ts': "(f) ; aucune mer réglée dans ce fichier : rien d'autre.",
    'src/domain/format.test.ts': (
        "Tâches 3a et 3b : la durée de la mer et ses textes remplacent ceux en km ; `merTexte` reste pour la distance d'un proche "
        "(`distanceProche`), ses trois cas en km ne changent pas. AC-4 (format) : « 1 · Portmer (17) · 69 · 650 € · 5 min » "
        "(Portmer avec `merMin: 5`) ; `merFiche` : « 50 min de la mer en voiture », « 5 min de la mer en voiture », « Distance à la mer "
        "inconnue » gardée ; raison « Mer 2 h 15 : au-dessus de ton plafond de 1 h » (135, 60) ; résumés `mer: 50` → `mer: 60` « Mer 1 h », "
        "`mer: 100` → `mer: 90` « Mer 1 h 30 » (montagne inchangée)."),
    'src/domain/mairies.test.ts': "(f) ; H113 : `mer: 10` → `mer: 15` (ordre des raisons inchangé) ; adresse `mer=50` → `mer-min=60`, même place (H193).",
    'src/domain/prix.test.ts': "(f) ; (e) AC-2 à AC-8, AC-10, AC-13 (adresses et lignes de leurs critères) ; AC-9 inchangé.",
    'src/domain/proches.test.ts': (
        "(f) ; `MER50` → `mer: 60` (5 communes, `mer-min=60`) : 72, 48, 25 → 69, 43, 24 ; Nantesville 2 h 15 et Toulouseville "
        "2 h 45 : Portmer 48, Grandeville 25 ; Rochelleville à vol d'oiseau 120 km : 68, 29, 25 ; 90 km : 65, 17 (tableau des "
        "valeurs). `mer: 60` des raisons : rien (60 min est un choix)."),
    'src/domain/score.test.ts': (
        "(f) ; AC-3 (calcul) : `mer: 60`, A 46 ; AC-10 : A 69 ; AC-11 (calcul) de cadre-de-vie : `mer: 90`, Grandeville 25 "
        "(31 + 44 + 0) / 3 ; ordres des raisons H83 et R27 (`mer: 10`) : `mer: 15`, ordres inchangés ; « sous 1 km comparée comme 1 km » (`mer: 5`) devient le cas « moins "
        "d'1 min » comparé comme 1 min (R61) : `merMin: 0` sous 15 min, note 93 ; « prix inconnu » (`mer: 60`) : Sansloyer, copie de "
        "Portmer, gagne `merMin: 5` → score 92 (100 × (1 − 5/60)) ; Avecprix, Sansprix, Terre et le test des égalités (`merKm` "
        "réécrit) prennent `merMin: null` : comptés d'après leurs km (D7), mêmes nombres. H74 : les quatre moitiés du recalage de "
        "cadre-de-vie sont remplacées par celle d'ici (Portmer 62,5 → 63, Nantesville 2 h). Vraies données : Tréon (« R28 "
        "non-régression ») devient le repli de D7 : sans temps, ses 100,49 km comptent 100 min, pas 101 (« ≈ 1 h 40 ») ; "
        "`communeDeLigne` : `merMin: null` attendu. Montagne inchangée."),
    'src/domain/services.test.ts': "(f) commune écrite à la main, `merKm: null`, aucune mer réglée : rien.",
    'src/domain/url.test.ts': (
        "AC-11 (adresse) : `?loyer=800&mer-min=60` → `mer: 60` ; AC-12, AC-10 (`mer=aucun`) : rien ; **AC-9 (adresse) change de sens** "
        "comme son critère ; **« ancienne plage » et « toute autre valeur » changent de sens** : toute valeur de `mer` donne Peu importe "
        "et disparaît (D9) ; `mer-min` ne garde que 15, 30, 60, 90 (R60 : 50, 0, 23, abc, 60.0 → Peu importe) ; écrire `mer: 60` donne "
        "`mer-min=60`, à la place de `mer` (H193) ; allers-retours : `mer=10` → `mer-min=15`, `mer=50` → `mer-min=60`."),
}


def reperer():
    fichiers = sorted(set((RACINE / 'tests').rglob('*.ts')) | set((RACINE / 'src').rglob('*.test.ts')) | set((RACINE / 'src').rglob('*.test.tsx')))
    trouves = {}
    for f in fichiers:
        rel = str(f.relative_to(RACINE))
        for n, texte in enumerate(f.read_text().splitlines(), 1):
            quoi = [q for rx, q in REPERES if rx.search(texte) and not ('ontagne' in texte and q == 'pastille')]
            if quoi:
                trouves.setdefault(rel, []).append((n, quoi, texte.strip()))
    return trouves


# Les chiffres écrits dans les règles des tests hors critère, recalculés ici (aucun n'est tapé sans calcul).
SANS_TEMPS_A = S(CINQ, mer=50, proches=(N(120),), sans_temps=('A',), nom='5 communes, mer 1 h, Nantesville 2 h, Portmer sans temps')


def verifier_regles():
    v = lambda s: Vue(s, 'min')
    attendus = [
        ('tests/e2e/adresse.spec.ts', f"« {v(S(CINQ, loyer=800, mer=50)).l('A')} »"),
        ('tests/e2e/lib/proches.ts', ligne('A', 'E', 'B')(v(M))),
        ('tests/e2e/proches-etats.spec.ts', f"« {v(S(CINQ, mer=50, proches=(N(120),))).l('A')} »"),
        ('tests/e2e/proches-etats.spec.ts', f"« {v(SANS_TEMPS_A).l('A')} »"),
        ('tests/e2e/proches.spec.ts', f"Portmer (17) · {v(S(CINQ, loyer=None, proches=(N(135),))).sc('A')} · 650 € · 5 min"),
        ('tests/e2e/proches.spec.ts', ', '.join(v(M).sc(i) for i in 'AEB')),
        ('tests/e2e/etats.spec.ts', f"A passe avec {v(M).sc('A')}, toujours en 60–80"),
        ('tests/e2e/carte.spec.ts', f"A passe avec {v(S(CINQ, loyer=650, mer=50)).sc('A')}, toujours en 40–60"),
        ('src/domain/format.test.ts', f"« {v(M).l('A')} »"),
        ('src/domain/format.test.ts', v(M).rm('C')),
        ('src/domain/proches.test.ts', ', '.join(v(M).sc(i) for i in 'AEB')),
        ('src/domain/proches.test.ts', 'Portmer {}, Grandeville {}'.format(*(v(S(CINQ, mer=50, proches=(N(135), T(165)))).sc(i) for i in 'AB'))),
        ('src/domain/proches.test.ts', '120 km : {}, {}, {}'.format(*(v(S(CINQ, mer=50, proches=(RKM(120),))).sc(i) for i in 'AEB'))),
        ('src/domain/proches.test.ts', '90 km : {}, {}'.format(*(v(S(CINQ, mer=50, proches=(RKM(90),))).sc(i) for i in 'AB'))),
        ('src/domain/score.test.ts', f"`mer: 60`, A {v(S(CINQ, loyer=650, mer=50)).sc('A')}"),
        ('src/domain/score.test.ts', f"AC-10 : A {v(S(CINQ, mer=50, tailles=('petite-ville',))).sc('A')}"),
        ('src/domain/score.test.ts', "Grandeville {} ({} + {} + {}) / 3".format(*(lambda w: (w.sc('B'), w.note('B', 'loyer'), w.note('B', 'mer'), w.note('B', 'montagne')))(v(S(SIX, mer=100, montagne=50))))),
        ('src/domain/score.test.ts', f"score {rh(100 * (1 - CINQ['A']['mer_min'] / 60))} "),
        ('src/domain/score.test.ts', f"note {rh(100 * (1 - 1 / 15))}"),
        ('src/domain/score.test.ts', f"« ≈ {duree(rh(100.49))} »"),
    ]
    for f, texte in attendus:
        assert texte in REGLES_TESTS[f], f'règle de {f} : « {texte} » attendu'
    assert v(M).pal('A') == '4' and v(S(CINQ, loyer=650, mer=50)).pal('A') == '3'
    return len(attendus)


def verifier_minutes():
    """Le modèle en minutes retrouve les valeurs de référence de AC-6 à AC-10 de recherche-et-mer."""
    crit = {c['id']: c['then'] for c in ICI_SPEC['criteria']}
    n = 0
    for ac, (s, f) in REFERENCE_MIN.items():
        texte = f(Vue(s, 'min'))
        assert texte in crit[ac[:5].rstrip('b')], f'modèle en minutes : « {texte} » absent de {ac} de recherche-et-mer'
        n += 1
    return n


def decrire(s):
    jeu = {id(CINQ): '5 communes', id(SIX): '6 communes', id(METROPOLE): 'métropole', id(D_TOUS_BIENS): '6 communes, D tous biens'}[id(s.jeu)]
    mode, bien, unite, surface = s.prix
    prix = 'loyer' if mode == 'louer' else 'achat'
    morceaux = [jeu, f"{prix} {'sans limite' if s.loyer is None else s.loyer}" + ('' if (bien, unite, surface) in (('appartement', 'total', 52), ('appartement', 'm2', 52)) and unite == ('total' if mode == 'louer' else 'm2') else f' ({bien}, {unite}, {surface} m²)')]
    if s.mer is not None:
        morceaux.append(f'mer {s.mer} km → {duree(CORRESPONDANCE[s.mer])}')
    if s.montagne is not None:
        morceaux.append(f'montagne {s.montagne} km')
    for k, x in (('tailles', s.tailles), ('types', s.types), ('mairies', s.bords)):
        if x:
            morceaux.append(f"{k} {', '.join(x)}")
    morceaux += [label for _, _, _, label in s.proches]
    if s.sans_temps:
        morceaux.append('Portmer sans temps (communes.json sans mer_min)')
    return ' · '.join(morceaux)


def reglages_des_criteres():
    """Les réglages distincts des critères (le jeu « métropole » à part : ses deux coins ne passent jamais)."""
    vus, reglages = set(), []
    for nom in TRANCHES:
        for entrees in CRITERES[nom].values():
            for _, s, _ in entrees:
                cle = s and (id(s.jeu), s.loyer, s.prix, s.mer, s.montagne, s.tailles, s.types, s.bords, tuple(p[3] for p in s.proches))
                if s is not None and cle not in vus and s.jeu is not METROPOLE:
                    vus.add(cle)
                    reglages.append(s)
    return reglages


def tableau_valeurs(reglages):
    lignes = ['| Réglage | Avant (km) | Après (minutes) |', '|---|---|---|']
    for s in reglages:
        vk, vm = Vue(s, 'km'), Vue(s, 'min')
        f = lambda v: ' ; '.join(v.l(i) for i in v.classes) or v.compte()
        lignes.append(f'| {decrire(s)} | {f(vk)} | {f(vm)} |')
    return lignes


def ecrire_md(resultats, controles_regles, controles_min, trouves):
    total = sum(len(ch) for _, ch, _, _ in resultats.values())
    sens = [('cadre-de-vie', 'AC-9')]
    a_recaler = {}
    for l in (ICI / 'criteres-a-recaler.md').read_text().splitlines():
        m = re.match(r'- \*\*\d{4}-\d\d-\d\d-([\w-]+)\*\* \(\d+\) : (.*)', l)
        if m:
            a_recaler[m.group(1)] = set(re.findall(r'AC-\d+', m.group(2)))
    ecarts_plus = {n: sorted(set(i for i, _ in resultats[n][1]) - a_recaler.get(n, set()), key=lambda x: int(x[3:])) for n in TRANCHES}
    ecarts_moins = {n: sorted(a_recaler.get(n, set()) - set(i for i, _ in resultats[n][1]), key=lambda x: int(x[3:])) for n in TRANCHES}
    n_tests = len(trouves)
    n_e2e = sum(1 for f in trouves if f.startswith('tests/'))
    moities = sorted({(n, round(m, 6), s) for _, n, m, s, _ in MOITIES})
    corr = ', '.join(f'{k} km → {duree(v)}' for k, v in CORRESPONDANCE.items())
    ecarts, couleurs = [], []
    for s in reglages_des_criteres():
        vk, vm = Vue(s, 'km'), Vue(s, 'min')
        assert vk.classes == vm.classes, decrire(s)  # mêmes communes, même ordre
        ecarts += [int(vk.sc(i)) - int(vm.sc(i)) for i in vk.classes if s.mer is not None]
        couleurs += [(decrire(s), s.jeu[i]['nom'], vk.sc(i), vm.sc(i)) for i in vk.classes if vk.pal(i) != vm.pal(i)]
    ecarts = [e for e in ecarts if e] or [0]
    L = []
    L += ["# Recalage des critères et des tests — la mer en minutes seulement",
          "Généré par `recalage.py` (recherche-et-mer, tâche 0c, 2026-11-26) — ne pas éditer à la main. Les valeurs viennent d'un "
          "modèle des règles écrit à part du code du site, vérifié d'abord sur l'état d'aujourd'hui : il retrouve mot pour mot "
          f"{len(CONTROLES)} textes en km des critères actuels, et en minutes les valeurs de référence d'AC-6 à AC-10 d'ici. "
          "À appliquer en tâche 3b, après l'accord de Vincent, et seulement cela.", "",
          "**Ce que je te demande** : valider ce tableau en une fois, ou contester des lignes. Trois points sont des choix de ma "
          "part : (1) la correspondance des choix (10 km → 15 min, 50 km → 1 h…) ; (2) cadre-de-vie AC-9, réécrit plutôt que "
          "retiré ; (3) le test « empreinte » de `proches-etats.spec.ts`, qui garde son fichier sans minutes et lit donc "
          "« ≈ 1 min ».", "",
          "## En bref", "",
          f"- **{total} critères changent**, dans 7 tranches ({', '.join(f'{n} {len(resultats[n][1])}' for n in TRANCHES)}). "
          "Presque tous pour la même raison : une adresse `mer=50` devient `mer-min=60`, et la dernière colonne de la liste, la "
          "ligne de la fiche ou la raison passent en minutes. Partout, les mêmes communes passent, dans le même ordre ; les "
          f"scores des réglages où la mer note baissent de {min(ecarts)} à {max(ecarts)} points (dans la fixture, les communes "
          "sont un peu plus loin de la mer en minutes qu'en km, rapporté au plafond). "
          + (f"La couleur (tranche de 20 points) ne change que {len(couleurs)} fois, et aucun critère ni aucun test ne lit "
             "ces couleurs-là (relevé des `attendreCouleurs` des tests) : "
             + ' ; '.join(f'{n} {a} → {b} ({r})' for r, n, a, b in couleurs) + '.' if couleurs else "Aucune couleur ne change."),
          f"- **1 critère change de sens** : cadre-de-vie AC-9. Il vérifiait qu'une ancienne valeur de la mer en km "
          "(`mer=60`, `mer=25`) prend le choix juste au-dessus ; D9 supprime cette règle (un ancien lien est ignoré, ce que vérifie "
          "AC-10 d'ici). Il vérifiera désormais les choix « 1 h 30 » et « 30 min », que rien d'autre ne teste. Trois tests hors "
          "critère changent de sens pour la même raison (« R31 » de `cadre-de-vie.spec.ts`, « ancienne plage » et « toute autre "
          "valeur » de `url.test.ts`).",
          f"- **{len(moities)} moitié exacte** : Portmer, avec un proche à 2 h de plafond et la mer à 1 h, a la moyenne 62,5, "
          "arrondie à 63 (moitié vers le haut, H74). Elle revient dans 4 textes (proches AC-1, proches-fiables AC-3 et AC-8 deux fois).",
          f"- **{n_tests} fichiers de tests** lisent la mer en km et changent avec la règle de recalage ci-dessous ({n_e2e} de bout "
          f"en bout, {n_tests - n_e2e} du domaine) ; la liste de leurs lignes est en fin de document.",
          "- **Les communes de test sans minutes** (Coin-Sud-Ouest et Coin-Nord-Est du jeu « métropole ») prennent leurs km servis, "
          "arrondis à la minute (300 km → 300 min, « 5 h »), écrits par `carte.ts` et jamais dans un `acceptance.json` ; elles ne "
          "passent jamais (loyer de 2 600 €), donc aucun critère ne les affiche. Toutes les autres communes des jeux de test (y "
          "compris les variantes écrites dans les tests) ont les codes 99001 à 99006, qui ont leurs minutes dans la fixture d'ici "
          "(Rhinval sans temps). Seule exception : le fichier écrit à la main par un test de `proches-etats.spec.ts` (plus bas).",
          f"- **Correspondance des choix** (calculée, la même dans tous les jeux de test) : {corr}. Les choix en minutes qui gardent "
          f"exactement les mêmes communes que chaque choix en km sont : {' ; '.join(f'{k} km : ' + ' ou '.join(duree(m) for m in v) for k, v in CANDIDATS.items())}. "
          "Quand il y en a deux, le plus proche du nombre de km est retenu (décidé par Claude : la page reste lisible, « 50 km » "
          "devient « 1 h » plutôt que « 1 h 30 »).",
          "- **La liste de /spec (58 critères)** était faite par un script : vérifiée un à un, il en manquait 3 (loyer-mer "
          f"{', '.join(ecarts_plus['loyer-mer'])}, qui disent « mer 50 km » ou « 10 km » sans adresse) et aucun n'y était à tort"
          + ('' if not any(ecarts_moins.values()) else f" (à tort : {ecarts_moins})") + ".", ""]
    assert not any(v for n, v in ecarts_plus.items() if n != 'loyer-mer'), ecarts_plus
    L += ["## Le critère qui change de sens", "",
          "**cadre-de-vie AC-9.** Avant : `/?loyer=1200&mer=60` se lisait « 100 km » (le choix juste au-dessus) et l'adresse était "
          "réécrite `mer=100` ; `mer=25` se lisait « 30 km ». Cette règle (R31 de cadre-de-vie) disparaît avec D9 : tout `mer=` est "
          "ignoré, ce que vérifie déjà AC-10 d'ici. Proposé : le critère ouvre `/?loyer=1200&mer-min=90` puis "
          "`/?loyer=1200&mer-min=30` (les mêmes communes que 100 et 30 km) et vérifie la pastille cochée, l'adresse inchangée et les "
          "scores. *Autre choix possible* : le retirer (« remplacé par AC-10 de recherche-et-mer »), au prix de ne plus tester "
          "« 1 h 30 » nulle part. Le texte exact est plus bas.", "",
          "## Règle de recalage (critères et tests)", ""]
    L += [f"- **{t}** — {r}" for t, r in REGLES_COMMUNES]
    L += ["", "## Moitiés exactes (± 0,01)", "",
          "| Où | Commune | Moyenne exacte | Score affiché |", "|---|---|---|---|"]
    virgule = lambda x: f'{x:.2f}'.rstrip('0').rstrip('.').replace('.', ',')
    lignes_moities = []
    for ou, n, m, s, notes in MOITIES:
        l = f"| {ou} | {n} | {virgule(m)} (notes : {', '.join(f'{k} {virgule(x)}' for k, x in notes.items())}) | {s} |"
        if l not in lignes_moities:
            lignes_moities.append(l)
    L += lignes_moities
    L += ["", "proches-fiables AC-8 la contient deux fois (cas a et d). Le code arrondit la moyenne au milliardième avant de "
          "l'arrondir à l'entier (H74) : 62,5 calculé en virgule flottante donne bien 63. À garder dans les tests du domaine (règle "
          "de `score.test.ts`)."]
    L += ["", "## Critères, avant → après", "",
          "Chaque critère changé repasse à `passes: false` jusqu'à la tâche 3b. Seuls les champs qui changent sont montrés.", ""]
    for nom in TRANCHES:
        d, changes, (desc0, desc), extra = resultats[nom]
        inchanges = [c['id'] for c in d['criteria'] if c['id'] not in dict(changes)]
        L.append(f"### {nom} — {len(changes)} critères changés" + (f" ; inchangés : {', '.join(inchanges)}" if inchanges else ''))
        L.append('')
        for i, diff in changes:
            marque = ' **(change de sens)**' if (nom, i) in sens else ''
            L.append(f"- **{i}**{marque} — " + ' ; '.join(f"*{k}* : « {a} » → « {b} »" for k, a, b in diff))
        L.append(f"- **Fixture** — la description gagne : « {phrase_fixture(FIXTURE_JEU[nom]).strip()} »"
                 + ''.join(f" ; « {f(Vue(s, 'km'))} » → « {f(Vue(s, 'min'))} »" for s, f in FIXTURE_PROPRE.get(nom, []))
                 + (" ; `mer=50` → `mer-min=60`" if ADRESSE.search(desc0) else ''))
        for k, a, b in extra:
            L.append(f"- **{k}** (D19 de proches) — « {a} » → « {b} »")
        L.append('')
    L += ["### Tranches vérifiées sans changement", "",
          f"emploi et services : aucun de leurs critères ne lit la mer en km (contrôle du script) ; recherche-et-mer est la "
          "référence. Les critères qui disent seulement « aucune distance à la mer cochée » ou « Fixe un loyer ou une distance à la mer "
          "pour classer les communes » ne changent pas : le texte des états vides est inchangé (D8 de cadre-de-vie, rappelé par la "
          "spec), et ils ne lisent aucun km.", ""]
    L += ["## Tableau des valeurs (pour les tests)", "",
          "Toutes les listes calculées par le modèle pour les réglages des critères, avant et après. Un test qui ouvre le même "
          "réglage lit les mêmes valeurs.", ""]
    L += tableau_valeurs(reglages_des_criteres() + [SANS_TEMPS_A])
    L += ["", "## Tests hors critère touchés", "",
          "Repérés par le script dans `tests/` et `src/**/*.test.ts` : adresse `mer=`, ligne de liste, ligne de fiche, raison, pastille "
          "ou résumé en km, réglage `mer:` du domaine, commune fabriquée avec `merKm`. Un test qui ouvre `/` et lit un compte, un "
          "score, un rang ou une couleur (leçon du 2026-10-15) ne change pas : le départ n'a pas de mer, ses notes n'en dépendent "
          "pas ; seule la colonne de la liste change, et le repérage la trouve. Les lettres renvoient à la règle de recalage.", ""]
    for f in sorted(trouves):
        lignes = trouves[f]
        L.append(f"### `{f}` — {len(lignes)} lignes")
        L.append(f"{REGLES_TESTS[f]}")
        L.append("Lignes : " + ', '.join(str(n) for n, _, _ in lignes) + '.')
        L.append('')
    L += ["`scripts/data/communes.test.ts` n'est pas dans ce périmètre : il lit `mer_km` (les km restent servis) ; sa ligne 76 "
          "change en tâche 0b (exception accordée du plan).", "",
          "## Tests du domaine qui fabriquent une `Commune`", "",
          "`merMin` vaut `null` par défaut dans `communeDeLigne` (comme `typeEnv ?? null`). Écrites à la main (règle (f)) :", ""]
    for f, lignes in sorted(trouves.items()):
        mains = [n for n, q, t in lignes if 'commune ou format du domaine' in q and 'merKm' in t]
        if mains and f.startswith('src/'):
            L.append(f"- `{f}`, lignes {', '.join(map(str, mains))}")
    L += ["", "## Textes à écrire avec le recalage (tâche 3b)", "",
          "- **D19 de proches** (`docs/specs/2026-10-13-proches/spec.md`) : « remplacés par AC-6, AC-8 et AC-10 de recherche-et-mer » → "
          "« remplacés par AC-6, AC-8, et AC-6 et AC-10 ensemble pour AC-15 (AC-10 teste désormais les anciens liens, D9 de "
          "recherche-et-mer) » ; même chose dans `remplaces` de son `acceptance.json` (ci-dessus).",
          "- **CLAUDE.md, « Données »** : la ligne « Loyer… 52 m² » ne bouge pas ; nouvelle ligne : « Mer (tranche recherche-et-mer, D5 "
          "révisée, D9) : la distance à vol d'oiseau (`mer_km`) sert à trouver le point de côte (D4) et au repli d'une commune sans "
          "temps (D7 : 1 km = 1 min) ; seul le temps en voiture (`mer_min`, en minutes) s'affiche et se règle (« Mer à moins de » 15, "
          "30, 60, 90 min ; `mer-min=` dans l'adresse) ; un ancien lien `mer=` est ignoré. »",
          "- **cadre-de-vie, details.md** : sous R28, H69, H75, H76 et H77, « remplacé par R60 à R62 de recherche-et-mer (2026-11-25) » (plan).", "",
          "## Contrôle du modèle (sortie du script)", "", "```"]
    L += controle_texte(resultats, controles_regles, controles_min, trouves)
    L += ["```", ""]
    (ICI / 'recalage.md').write_text('\n'.join(L))


def controle_texte(resultats, controles_regles, controles_min, trouves):
    out = [f"Correspondance des choix : {', '.join(f'{k} km → {v} min' for k, v in CORRESPONDANCE.items())} "
           f"(candidats : {CANDIDATS})",
           f"Textes d'aujourd'hui retrouvés par le modèle en km : {len(CONTROLES)} sur {len(CONTROLES)}",
           f"Valeurs de référence en minutes (AC-6 à AC-10 de recherche-et-mer) retrouvées : {controles_min}",
           f"Chiffres des règles des tests recalculés : {controles_regles}"]
    for nom in TRANCHES:
        d, changes, _, _ = resultats[nom]
        brut = (SPECS / TRANCHES[nom] / 'acceptance.json').read_text()
        nouveau = json.dumps(d, ensure_ascii=False, indent=2) + ('\n' if brut.endswith('\n') else '')
        lignes = sum(1 for a, b in zip(brut.splitlines(), nouveau.splitlines()) if a != b)
        assert len(brut.splitlines()) == len(nouveau.splitlines()), nom
        out.append(f"{nom} : {len(changes)} critères changés ; restes en km après recalage : {len(restes(d))} ; "
                   f"--appliquer changerait {lignes} lignes du fichier")
    for nom, t in SANS_MER.items():
        out.append(f"{nom} : restes en km dans les critères : {len(restes(charger(t)))}")
    out.append(f"Critères changés : {sum(len(r[1]) for r in resultats.values())} ; moitiés exactes signalées : {len(MOITIES)} textes, "
               f"{len({(n, s) for _, n, _, s, _ in MOITIES})} cas")
    out.append(f"Fichiers de tests repérés : {len(trouves)} ({sum(len(l) for l in trouves.values())} lignes), tous avec leur règle")
    return out


def main():
    resultats = {nom: recaler(nom) for nom in TRANCHES}
    for nom, (d, _, _, _) in resultats.items():
        assert not restes(d), (nom, restes(d))
    for nom, t in SANS_MER.items():
        assert not restes(charger(t)), (nom, restes(charger(t)))
    trouves = reperer()
    assert set(trouves) == set(REGLES_TESTS), (sorted(set(trouves) - set(REGLES_TESTS)), sorted(set(REGLES_TESTS) - set(trouves)))
    controles_regles, controles_min = verifier_regles(), verifier_minutes()
    ecrire_md(resultats, controles_regles, controles_min, trouves)
    for l in controle_texte(resultats, controles_regles, controles_min, trouves):
        print(l)
    if '--appliquer' in sys.argv:
        for nom, (d, _, _, _) in resultats.items():
            f = SPECS / TRANCHES[nom] / 'acceptance.json'
            fin = '\n' if f.read_text().endswith('\n') else ''  # même forme que le fichier (cadre-de-vie n'a pas de saut final)
            f.write_text(json.dumps(d, ensure_ascii=False, indent=2) + fin)
        print('acceptance.json réécrits :', ', '.join(TRANCHES))


main()
