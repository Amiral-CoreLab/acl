# FAIRE LES CONSOLE POUR FIGMA SPEC

- feat/ → new feature
- fix/ → bug fix
- chore/ → maintenance, build, CI, tooling
- refactor/ → refactor
- style/ → formatting
- doc/ → documentation
- test/ → tests

CI:
Test

Ajout un fichier report global de tout les test de frame et ducoup qui casse si pas bon donc définir un score minimum

✔ Check total du temps de rendu Storybook

→ si un composant devient lent → échec

✔ Check du poids des images générées

→ si un icône devient énorme → échec
(utile pour performance UI)

✔ Check du nombre de diffs générés

→ si plus de 30% des tests diff → échec

✔ Check du nombre de composants modifiés

→ si trop de composants changent en même temps, c’est suspect

✔ Check du ratio pixels changés

→ tu peux analyser le .diff.png (des bibliothèques existent)

✔ Check de cohérence typographique

→ extraire les polices utilisées dans le screenshot (possible)

✔ Check du contraste APCA

→ via ton système de colorimétrie
→ si un screenshot donne une couleur basse, tu peux détecter un bug

✔ Check que Figma renvoie bien les variables attendues

→ si Figma supprime une variable → CI échoue
→ tu détectes une régression Figma automatiquement (rare mais possible)

✔ Check que tous les composants ont un spec MDX

→ si un composant ne génère pas sa spec : échec

✔ Check que tous les composants ACL ont une page Storybook

→ facile à automatiser

✔ Check que les tokens couleur / icon / typo sont bien synchronisés

→ si Figma change → ACL change
→ ton test figma-check garantit la synchro totale

🔧 Build
Angular build + Storybook
🧹 Code
ESLint + Stylelint
🎨 UI
snapshots visuels Playwright
📊 Scores
analyse des scores (Chromium/Firefox/WebKit)
🎛️ Figma
icons / tokens / components / specs
🔐 Qualité
qualité gate personnalisée
📈 Performance
poids des images, delta pixels
🔁 Diff
nombre de diff acceptable
🧪 Par composant
spec.mdxx par component
