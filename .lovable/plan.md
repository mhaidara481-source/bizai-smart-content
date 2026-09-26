# Polish UI/UX de l’app authentifiée

## Objectif
Donner aux huit pages connectées une finition plus premium et cohérente, sans modifier leur logique, leurs données ni les paiements.

## Modifications prévues
- Harmoniser les cartes et sections avec un rayon commun, des bordures discrètes et des transitions légères.
- Renforcer les boutons partagés avec un léger mouvement au survol et à l’appui, tout en respectant la réduction des animations.
- Ajouter une apparition douce au contenu des pages, aux résultats générés et aux listes.
- Remplacer les grands spinners de contenu par des skeletons structurés sur les résultats, idées et calendrier.
- Conserver les petits spinners intégrés aux boutons : ils indiquent clairement que l’action lancée est toujours en cours.
- Uniformiser les espacements verticaux et les grilles sur Dashboard, Créer un post, Créer un visuel, Calendrier, Idées de contenu, Répondre aux avis, Abonnement et Paramètres.

## Détails techniques
- Utiliser uniquement les composants et classes Tailwind déjà présents, notamment `Skeleton`, `animate-fade-in`, les transitions et les ombres du design system.
- Centraliser les micro-interactions générales dans les composants partagés `Button`, `Card`, `PageHeader` et `AppShell` afin d’éviter les répétitions.
- Ajouter des skeletons spécifiques dans les pages de génération, sans toucher aux appels IA, aux quotas ou au checkout Whop.
- Vérifier le résultat sur ordinateur et mobile, puis contrôler l’absence d’erreurs de compilation et d’exécution.
