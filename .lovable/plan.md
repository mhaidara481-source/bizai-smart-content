# Polish de l’application connectée

## Objectif
Donner aux pages connectées un rendu plus net et plus proche d’une application mobile moderne, sans modifier les fonctions existantes.

## Changements
- Transformer « Tes outils » du tableau de bord en grille de sept tuiles tactiles, colorées par famille, avec icônes bien visibles et accès direct.
- Renforcer la hiérarchie du tableau de bord : accueil plus compact, indicateurs plus lisibles et activité récente mieux structurée.
- Harmoniser les cartes, leurs bordures, ombres et espacements depuis les composants partagés pour couvrir toutes les pages connectées.
- Rehausser les titres et sous-textes, et améliorer l’enveloppe générale ainsi que la navigation mobile sans changer la barre latérale.
- Ajuster les grilles et les espacements pour mobile d’abord, puis tablette et ordinateur.

## Détails techniques
- Ajouter des couleurs sémantiques dédiées aux familles d’outils dans le design global, avec variantes claires et sombres.
- Réutiliser les composants Card, Button, PageHeader et AppShell plutôt que dupliquer les styles page par page.
- Conserver les routes, formulaires, appels IA, quotas, publications et paiements inchangés.

## Vérifications
- Vérifier la compilation et les erreurs d’exécution.
- Contrôler visuellement le tableau de bord et les pages principales sur mobile, tablette et ordinateur.
- Confirmer l’absence de débordement et la lisibilité des textes et boutons.
