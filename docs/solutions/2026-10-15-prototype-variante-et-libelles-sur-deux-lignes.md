# Prototype à variantes : lire `?variant=` avant que la page réécrive son adresse ; libellés sur deux lignes : espaces insécables dans les nombres
Étiquettes : build, design, outil · Tranche : cadre-de-vie · Source : /ui cadre-de-vie (captures des directions)

**Problème** — Les captures des directions B et C montraient la direction A, et les cases de taille coupaient « 10 / 000 hab. ».
**Symptômes** — `?variant=B` ouvrait A ; dans une case étroite, « Moins de 10 000 hab. » passait à la ligne au milieu du nombre.
**Ce qui n'a pas marché** — Lire `location.search` dans le rendu : la page réécrit son adresse au chargement (R7 de loyer-mer) et efface tout paramètre qu'elle ne connaît pas.
**Ce qui a marché** — Lire la variante une fois, au chargement du module, avant la réécriture ; écrire les milliers et l'unité avec des espaces insécables (`10 000 hab.`), ce que H3 de loyer-mer demandait déjà.
**Prévention** — Dans un prototype de ce projet, tout paramètre propre au prototype se lit au chargement du module ; tout libellé qui peut passer sur deux lignes est vérifié en capture à 390 px avant de le montrer.
