1. Convertir chaque Path en primitives
   Segment | ArcCenter

2. Trouver toutes les intersections entre primitives
   segment/segment
   segment/arc
   arc/arc

3. Découper chaque primitive à ses points d’intersection
   chaque morceau devient une edge atomique

4. Construire un graphe planaire
   nodes = points
   edges = morceaux entre deux nodes

5. Trier les edges autour de chaque node par angle
   nécessaire pour suivre les contours correctement

6. Marcher dans le graphe pour extraire toutes les faces fermées
   chaque cycle = une forme

7. Filtrer / classer
   retirer doublons
   gérer orientation
   gérer trous plus tard
