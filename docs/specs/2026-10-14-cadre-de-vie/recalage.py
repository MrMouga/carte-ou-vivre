# Recalage des critères des tranches construites (D4, D7 de cadre-de-vie).
# Valeurs calculées par un modèle des règles indépendant du code du site, vérifié d'abord sur les valeurs à 60 km.
# Usage : python3 recalage.py          → écrit recalage.md (lecture pour Vincent)
#         python3 recalage.py --appliquer → réécrit les acceptance.json des 4 tranches (après l'accord de Vincent)
import json, sys
from pathlib import Path

SPECS = Path(__file__).resolve().parent.parent
TRANCHES = {'loyer-mer': '2026-10-12-loyer-mer', 'proches': '2026-10-13-proches',
            'interface-telephone': '2026-10-13-interface-telephone', 'immobilier': '2026-10-14-immobilier'}
CHAMPS_FIXTURE = (" Révision cadre-de-vie (2026-10-14) : chaque commune gagne type_env, montagne_classee et montagne_km, "
                  "valeurs de la fixture « 6 communes · cadre de vie » de la tranche cadre-de-vie.")

# Par tranche : (champ, avant, après) appliqués à chaque critère dans l'ordre, après les remplacements propres au critère.
COMMUNS = {
    'loyer-mer': [('given', 'mer 60 km', 'mer 50 km'), ('when', 'mer=60', 'mer=50')],
    'proches': [('given', 'page ouverte sur / (réglages de départ)', 'page ouverte sur /?loyer=1200&mer=50'),
                ('given', 'réglages de départ', 'page ouverte sur /?loyer=1200&mer=50'),
                ('then', 'mer=60', 'mer=50')],
    'interface-telephone': [('given', 'mer=60', 'mer=50'), ('when', 'mer=60', 'mer=50'), ('then', 'mer=60', 'mer=50')],
    'immobilier': [('given', 'page ouverte sur /?loyer=1200&mer=60', 'page ouverte sur /?loyer=1200&mer=50'),
                   ('given', 'mer=60', 'mer=50'), ('then', 'mer=60', 'mer=50')],
}
# Remplacements propres à un critère : (champ, avant, après) ; chaque « avant » doit exister.
PROPRES = {
  'loyer-mer': {
    'AC-1': [('then', "A a le score 72 et la couleur de la tranche 60–80 de la légende, E 49 (tranche 40–60), B 32 (tranche 20–40) ; C et D ne sont pas colorées",
              "D a le score 65 et la couleur de la tranche 60–80 de la légende, A 46 (tranche 40–60), B 31 (tranche 20–40), E 9 (tranche 0–20) ; C n'est pas colorée")],
    'AC-2': [('when', "règle la mer sur « Sans limite »", "règle la mer sur « Peu importe »")],
    'AC-3': [('when', "règle la mer sur 40 km", "règle le loyer sur 650 €"),
             ('then', "B passe avec le score 15 (39,9 km affiché 40 km, égal au plafond) ; A a 72, E 46 ; C et D ne sont pas colorées",
              "A passe avec le score 49 (650 € affiché, égal au plafond) ; B, C, D et E ne sont pas colorées")],
    'AC-4': [('then', "49 · 1 092 €", "48 · 1 092 €"), ('then', "32 · 832 €", "25 · 832 €")],
    'AC-5': [('when', "la mer sur 5 km", "la mer sur 10 km")],
    'AC-6': [('when', "règle le loyer et la mer sur « Sans limite »", "règle le loyer sur « Sans limite », la mer et la montagne restant sur « Peu importe »")],
    'AC-7': [('then', "« Grande ville · 260 000 habitants », le score 32", "« Grand centre urbain · 260 000 habitants », le score 25")],
    'AC-8': [('then', "« Petite ville · 23 000 habitants »", "« Centre urbain intermédiaire · 23 000 habitants »")],
    'AC-9': [('then', "plafond de 60 km", "plafond de 50 km")],
    'AC-10': [('when', "la taille « Petite ville »", "la taille « 10 000 – 50 000 hab. »"),
              ('then', "« Taille : grande ville (260 000 habitants) »", "« Taille : 260 000 habitants, hors des tailles choisies »")],
    'AC-11': [('then', "800 € et 60 km", "800 € et 50 km"), ('then', "· 59 ·", "· 58 ·")],
    'AC-12': [('then', "les réglages affichent 1 200 €, « Sans limite » et « Peu importe »", "les réglages affichent 1 200 €, la mer sur « Peu importe » et aucune taille cochée"),
              ('then', "/?loyer=1200&mer=aucun", "/?loyer=1200")],
    'AC-13': [('then', "/?loyer=800&mer=60", "/?loyer=800")],
    'AC-14': [('then', "les pastilles « Petite ville » et « Ville moyenne » sont cochées", "les pastilles « 10 000 – 50 000 hab. » et « 50 000 – 200 000 hab. » sont cochées"),
              ('then', "/?loyer=1200&mer=60&taille=", "/?loyer=1200&taille="),
              ('then', "Portmer (17) 72 et Quaibleu (13) 49", "Portmer (17) 46 et Quaibleu (13) 9")],
    'AC-15': [('then', "A (72), E (49) et B (32) sont colorées", "D (65), A (46), B (31) et E (9) sont colorées"),
              ('then', "« 3 communes passent tes critères »", "« 4 communes passent tes critères »")],
  },
  'proches': {
    'AC-2': [('then', "· 67 ·", "· 66 ·"), ('then', "· 21 ·", "· 17 ·")],
    'AC-4': [('then', "· 30 ·", "· 26 ·")],
    'AC-5': [('then', "le score 30", "le score 26")],
    'AC-6': [('given', "loyer et mer sur « Sans limite »", "loyer sur « Sans limite », mer sur « Peu importe »")],
    'AC-8': [('when', "puis rouvre /", "puis rouvre /?loyer=1200&mer=50"), ('then', "Portmer (17) 67 puis Grandeville (33) 21", "Portmer (17) 66 puis Grandeville (33) 17")],
    'AC-9': [('when', "puis rouvre /", "puis rouvre /?loyer=1200&mer=50"), ('then', "Portmer (17) 72, Quaibleu (13) 49 et Grandeville (33) 32", "Portmer (17) 72, Quaibleu (13) 48 et Grandeville (33) 25")],
    'AC-10': [('then', "Portmer (17) 72, Quaibleu (13) 49 et Grandeville (33) 32", "Portmer (17) 72, Quaibleu (13) 48 et Grandeville (33) 25")],
  },
  'interface-telephone': {
    'AC-3': [('when', "« Taille de ville »", "« Taille de la commune »"), ('then', "« Taille de ville »", "« Taille de la commune »")],
    'AC-5': [('then', "49 · 1 092 €", "48 · 1 092 €"), ('then', "32 · 832 €", "25 · 832 €")],
    'AC-7': [('then', "3 · Grandeville (33) · 32 · 832 €", "3 · Grandeville (33) · 25 · 832 €")],
  },
  'immobilier': {
    'AC-1': [('then', "l'adresse devient /?loyer=1200&mer=60 ; A a le score 72, E 49, B 32 ; C, D et F ne sont pas colorées",
              "l'adresse devient /?loyer=1200 ; D a le score 65, F 52, A 46, B 31, E 9 ; C n'est pas colorée")],
    'AC-2': [('given', "page ouverte sur /", "page ouverte sur /?loyer=1200&mer=50"), ('then', "· 19 ·", "· 12 ·")],
    'AC-3': [('then', "· 28 ·", "· 21 ·")],
    'AC-4': [('given', "page ouverte sur /", "page ouverte sur /?loyer=1200&mer=50"), ('then', "· 49 · 21,0", "· 47 · 21,0"), ('then', "· 32 · 16,0", "· 25 · 16,0")],
    'AC-5': [('given', "page ouverte sur /", "page ouverte sur /?loyer=1200&mer=50"), ('then', "· 46 · 4 800", "· 45 · 4 800"), ('then', "· 23 · 4 400", "· 16 · 4 400")],
    'AC-6': [('then', "· 46 · 250 000", "· 45 · 250 000"), ('then', "· 23 · 229 000", "· 16 · 229 000")],
    'AC-7': [('then', "· 48 · 4 600", "· 47 · 4 600")],
    'AC-8': [('when', "/?achat=5000&mer=200", "/?achat=5000&montagne=100"),
             ('then', "la liste montre « 4 communes passent tes critères » puis « 1 · Portmer (17) · 62 · 3 800 €/m² · moins d'1 km », « 2 · Quaibleu (13) · 50 · 4 800 €/m² · 7 km », « 3 · Grandeville (33) · 46 · 4 400 €/m² · 40 km », « 4 · Terrebasse (23) · 10 · prix inconnu · 180 km »",
              "la liste montre « 4 communes passent tes critères » puis « 1 · Grandeville (33) · 31 · 4 400 €/m² · 40 km », « 2 · Quaibleu (13) · 21 · 4 800 €/m² · 7 km », « 3 · Terrebasse (23) · 100 · prix inconnu · 180 km », « 4 · Rhinval (67) · 99 · prix inconnu · 420 km »"),
             ('then', "le score 10 et « 4e sur 4 communes qui passent » ; C et F ne sont pas colorées",
              "le score 100 et « 3e sur 4 communes qui passent » ; Portmer (17) et Montcher (75) ne sont pas colorées")],
    'AC-10': [('then', "la mer sur « Sans limite » ; l'adresse ne change pas", "la mer sur « Peu importe » ; l'adresse devient /?achat=300000&bien=maison&unite=total&surface=100")],
    'AC-11': [('then', "/?achat=5000&mer=60", "/?achat=5000"), ('then', "Portmer (17) 61, Quaibleu (13) 46, Grandeville (33) 23", "Portmer (17) 24, Grandeville (33) 12, Quaibleu (13) 4")],
    'AC-13': [('then', "l'adresse ne change pas", "l'adresse devient /?loyer=1100&bien=maison")],
  },
}
FIXTURE_PROPRE = {'interface-telephone': [("« 2 · Quaibleu (13) · 49 · 1 092 € · 7 km », « 3 · Grandeville (33) · 32 · 832 € · 40 km »",
                                            "« 2 · Quaibleu (13) · 48 · 1 092 € · 7 km », « 3 · Grandeville (33) · 25 · 832 € · 40 km »"), ('mer=60', 'mer=50')]}


AMENDEMENTS = ["## Amendements des tranches validées",
  "Texte ajouté, après l'accord de Vincent, à la fin des décisions de chaque spec.md (statut « validée · révisée 2026-10-14 (D-n, tranche cadre-de-vie) »).", "",
  "- **loyer-mer, D22** — Contredite et étendue par la tranche [cadre-de-vie](../2026-10-14-cadre-de-vie/spec.md) : (1) la mer se règle par choix fixes Peu importe / 10 / 30 / 50 / 100 km (D4 de cadre-de-vie), ce qui remplace H2 pour la mer, et elle part sur Peu importe, ce qui remplace la mer 60 km de H1 (D7) ; R7, H7 : `mer` n'est écrite que si une distance est choisie, une ancienne valeur prend le choix juste au-dessus (R31) ; (2) les pastilles de taille s'écrivent en chiffres, et la fiche dit le type d'environnement à la place du nom de taille (D2) : R4 et la raison de taille de R1 changent (R27, R30) ; (3) la montagne note comme la mer (R2, D4) et l'état **sans plafond** suppose qu'aucun critère ne note. La liste des éléments touchés fait foi dans le [tableau d'impact de cadre-de-vie](../2026-10-14-cadre-de-vie/details.md#impact-sur-les-tranches-existantes) ; les critères AC-1 à AC-15 sont recalés selon [recalage.md](../2026-10-14-cadre-de-vie/recalage.md). *Pourquoi* : choix de Vincent du 2026-10-14. *Écarté* : une seconde règle dans cadre-de-vie qui contredise celles-ci.",
  "- **proches, D17** — Étendue par la tranche cadre-de-vie : la montagne note comme la mer (R11) ; le départ n'a plus de mer (D7 de cadre-de-vie), donc les critères partent de l'adresse explicite `/?loyer=1200&mer=50` ; AC-1 à AC-11, AC-14 et AC-16 recalés selon recalage.md ; les critères reportés (AC-12, AC-13, AC-15) seront réécrits avec la mer en minutes. *Pourquoi* : D4 et D7 de cadre-de-vie. *Écarté* : garder la mer à 60 km dans ces seuls critères.",
  "- **interface-telephone, D13** — Étendue par la tranche cadre-de-vie : l'onglet « Critères » contient « Cadre de vie » à la place de « Mer » et « Taille de ville » (R18) ; les adresses `mer=60` deviennent `mer=50` ; AC-3 glisse dans « Taille de la commune » ; AC-1 à AC-11 recalés selon recalage.md. H48 (curseur du prix visible à 375 × 548) reste une contrainte. *Pourquoi* : D2 et D4 de cadre-de-vie. *Écarté* : —.",
  "- **immobilier, D11** — Étendue par la tranche cadre-de-vie : R25, la montagne fait partie des critères qui notent une commune sans prix ; R26, l'adresse gagne `montagne` et `env` et n'écrit plus `mer` quand elle est sur Peu importe (R31) ; le départ n'a plus de mer (D7) ; AC-1 à AC-8, AC-10, AC-11 et AC-13 recalés selon recalage.md (AC-8 passe de `mer=200` à `montagne=100`) ; AC-9 et AC-12 inchangés. *Pourquoi* : D4, D6 et D7 de cadre-de-vie. *Écarté* : —.", ""]


def recaler(nom):
    d = json.loads((SPECS / TRANCHES[nom] / 'acceptance.json').read_text())
    changes = []
    desc = d['fixture']['description']
    for a, b in FIXTURE_PROPRE.get(nom, []):
        assert a in desc, (nom, 'fixture', a)
        desc = desc.replace(a, b)
    desc += CHAMPS_FIXTURE
    d['fixture']['description'] = desc
    for c in d['criteria']:
        avant = {k: c[k] for k in ('given', 'when', 'then')}
        for champ, a, b in PROPRES.get(nom, {}).get(c['id'], []):
            assert a in c[champ], (nom, c['id'], champ, a)
            c[champ] = c[champ].replace(a, b, 1)
        for champ, a, b in COMMUNS[nom]:
            c[champ] = c[champ].replace(a, b)
        diff = [(k, avant[k], c[k]) for k in avant if avant[k] != c[k]]
        if diff:
            c['passes'] = False
            changes.append((c['id'], diff))
    return d, changes


def main():
    lignes = ["# Recalage des critères des tranches construites",
              "Généré par `recalage.py` (cadre-de-vie, D4 et D7) — ne pas éditer à la main. Valeurs calculées par un modèle des règles indépendant du code du site, vérifié d'abord sur toutes les valeurs connues à 60 km.",
              "", "Règle générale : la mer à 60 km devient 50 km (le choix le plus proche) ; « réglages de départ » devient l'adresse explicite `/?loyer=1200&mer=50`, sauf pour les critères qui testent le départ lui-même, recalculés avec le nouveau départ (D7). À 50 km, les mêmes communes passent ; seuls des scores changent. **Deux exceptions changent ce que le critère vérifie** : loyer-mer AC-3 (40 km n'existe plus : l'égalité au plafond se teste sur le loyer à 650 €, une seule commune passe) et immobilier AC-8 (`mer=200` devient Peu importe : les communes sans prix sont notées par la montagne à 100 km ; Grandeville, Quaibleu, Terrebasse et Rhinval passent). Les critères changés repassent à `passes: false` jusqu'au /build.",
              "", "Plusieurs nouveaux scores tombent sur une moitié exacte, arrondie vers le haut (H74 de cadre-de-vie) : Quaibleu 47,5 → 48 à 50 km ; Portmer 61,5 → 62 en 72 m², 67,5 → 68 en maison 72 m², 66,5 → 67 à 1 000 €.", ""]
    total = 0
    for nom in TRANCHES:
        d, changes = recaler(nom)
        inchanges = [c['id'] for c in d['criteria'] if c['id'] not in dict(changes)]
        total += len(changes)
        lignes.append(f"## {nom} — {len(changes)} critères changés" + (f" ; inchangés : {', '.join(inchanges)}" if inchanges else ""))
        lignes.append("")
        for i, diff in changes:
            parts = []
            for champ, a, b in diff:
                parts.append(f"*{champ}* : « {a} » → « {b} »")
            lignes.append(f"- **{i}** — " + " ; ".join(parts))
        lignes.append(f"- **Fixture** — la description gagne : « {CHAMPS_FIXTURE.strip()} »" + "".join(f" ; « {x} » → « {y} »" for x, y in FIXTURE_PROPRE.get(nom, [])))
        lignes.append("")
        if '--appliquer' in sys.argv:
            (SPECS / TRANCHES[nom] / 'acceptance.json').write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n")
    lignes.insert(3, f"**Total : {total} critères changés.**")
    lignes += AMENDEMENTS
    (Path(__file__).parent / 'recalage.md').write_text("\n".join(lignes))
    print(total)


main()
