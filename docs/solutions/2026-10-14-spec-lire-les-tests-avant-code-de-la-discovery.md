# Avant de spécifier un nouveau critère, ouvrir les « tests avant de coder » de la discovery, pas seulement sa synthèse
Étiquettes : spec, discovery, data, process · Tranche : cadre-de-vie · Source : /spec cadre-de-vie, constaté après validation

**Problème** — La spec cadre-de-vie a fixé la source de la montagne (zonage loi Montagne du Cerema) d'après une suggestion extérieure et une recherche rapide, alors que la discovery avait déjà testé une autre règle (zone de montagne 2017 × massifs 2021, 5 882 communes, recalée sur 2025) et mesuré ses limites (Lyon 13,8 km, Toulouse 52 km par la Montagne Noire).
**Symptômes** — Le test a été retrouvé en mettant à jour STATE.md, après la validation et le commit : un critère verrouillé (AC-12) citait « Cerema », il a fallu une révision (D9) et l'accord de Vincent.
**Ce qui n'a pas marché** — Lire la synthèse de la discovery « en diagonale » via STATE.md : la montagne y était « sortie de la V1 », et le test détaillé n'était cité que dans la liste des Documents.
**Ce qui a marché** — Garder la décision produit (D5) et renvoyer le choix de la source à la tâche 0, mesures côte à côte ; écrire les chiffres déjà mesurés dans « Le risque ».
**Prévention** — Pour /spec : avant la première question sur un critère nouveau, `grep -ril "<critère>" ~/git-repository/ideas/<projet>/discovery/` et ouvrir chaque fichier trouvé, tests avant de coder compris ; ne citer une source dans un critère d'acceptation que si elle a été testée.
