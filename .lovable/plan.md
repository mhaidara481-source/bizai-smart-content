# Densifier et animer la landing page

## Objectif
Rendre la page publique plus dense, vivante et intentionnelle sans modifier son contenu ni la logique de l’application.

## Changements
- Réduire les espacements verticaux des sections, titres, grilles et cartes, avec des valeurs adaptées au mobile, à la tablette et au bureau.
- Ajouter un composant léger d’apparition au scroll basé sur l’observation du viewport, puis l’appliquer aux titres, textes, images et groupes de cartes.
- Échelonner légèrement l’apparition des cartes pour éviter une animation simultanée trop mécanique.
- Renforcer les effets au survol des cartes de fonctionnalités et de tarifs avec une élévation et une ombre discrètes.
- Ajouter deux formes décoratives animées et non interactives dans le premier écran, avec des couleurs du design existant.
- Désactiver les mouvements et afficher immédiatement le contenu lorsque la réduction des animations est demandée.

## Vérifications
- Contrôler la page à des largeurs mobile, tablette portrait, tablette paysage et bureau.
- Vérifier l’absence de débordement et le déclenchement progressif des animations au défilement.
- Lancer la vérification TypeScript demandée et confirmer que la compilation reste valide.
