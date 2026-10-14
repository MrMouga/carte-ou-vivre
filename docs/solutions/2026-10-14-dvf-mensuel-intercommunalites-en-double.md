# Statistiques DVF d'Etalab : une intercommunalité sur plusieurs départements a une ligne par département, en garder une seule avant d'additionner
Étiquettes : data, discovery · Tranche : immobilier · Source : tâche 0 (reprise, règle de Vincent), `docs/plans/2026-10-14-immobilier/mesure-tache-0.md`

**Problème** — Pour le prix récent (≥ 30 ventes de 2023 à 2025), on additionne les ventes mensuelles de `stats_dvf.csv` par commune et par intercommunalité.
**Symptômes** — La Métropole du Grand Paris comptait 656 898 ventes d'appartements sur 2023-2025, plus que les 214 554 de 2021-2025 dans `stats_whole_period.csv` (Aix-Marseille-Provence : 53 691 contre 33 161). Cause : une ligne `epci` par département couvert (`code_parent` = le département), aux chiffres identiques (Grand Paris : 6 copies par mois). 3 455 lignes en double sur 2023-2025.
**Ce qui n'a pas marché** — Additionner toutes les lignes `epci` d'un code. Dans le fichier sur toute la période, le défaut était caché : un dictionnaire par code écrasait des copies identiques.
**Ce qui a marché** — Une ligne par (échelle, code, mois). Le script s'arrête si deux copies diffèrent. Effet : 459 communes changent de règle (prix récent → 2021-2025 de leur intercommunalité). La médiane ne change pas, seul le seuil était faussé.
**Prévention** — Contrôle dans `scripts/data/communes.py` (doublons comptés et affichés, copies différentes = arrêt). Règle de jugement : avant d'additionner un fichier agrégé, comparer la somme d'une période courte à celle d'une période qui la contient.
