# Polish premium de la landing et adaptation tablette

## Résultat attendu
- Une page d’accueil plus distinctive et crédible, avec un premier écran plus immersif, une démonstration animée du produit et une preuve sociale sobre.
- Des transitions de sections, ombres, espacements et arrondis cohérents avec l’application connectée.
- Une expérience tablette solide en portrait et paysage, sur la landing comme dans les outils connectés.

## Mise en œuvre
1. Corriger d’abord l’erreur CSS actuelle qui bloque la compilation, sans changer le design existant.
2. Recomposer le premier écran de la landing autour de BizAI et d’un aperçu produit animé, tout en conservant les appels à l’action et les images existantes nettes.
3. Ajouter une section de témoignages crédibles, explicitement présentés comme profils types plutôt que comme de faux clients vérifiés.
4. Affiner les transitions entre sections, les cartes, les ombres et les animations légères, avec respect de la réduction des mouvements.
5. Ajuster les seuils tablette et les grilles de toutes les pages connectées afin d’utiliser deux colonnes quand l’espace le permet, sans débordement ni boutons comprimés.
6. Vérifier visuellement la landing et les pages principales à 768×1024, 1024×768 et sur ordinateur, puis lancer `tsgo --noEmit` et contrôler la compilation de l’aperçu.

## Limites
- Aucun changement de logique métier, d’IA, de quotas ou de paiements.
- Aucun faux logo client ou témoignage présenté comme authentique.
- Les images existantes restent utilisées à leur résolution native, sans agrandissement ou compression supplémentaire.

## Détails techniques
- Réutiliser les composants et tokens existants, sans nouvelle dépendance.
- Employer des grilles `md:grid-cols-2` ciblées, `min-w-0`, tailles stables et navigation adaptée aux largeurs 768–1024 px.
- Utiliser uniquement les animations CSS déjà prévues ou de petites variantes tokenisées dans `src/styles.css`.
