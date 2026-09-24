# Nettoyage de BizAI avant publication

## Résultat attendu
- Starter et Pro restent disponibles ; Business reste visible uniquement comme offre future, sans aucun bouton d’achat ou de changement.
- Les textes provisoires, fautes et messages techniques visibles sont remplacés par un français clair.
- Les pages inconnues affichent une page 404 BizAI soignée, et chaque chargement de données possède un indicateur stable.
- Chaque page possède ses informations de partage BizAI ; l’accueil utilise une image Open Graph publique et le favicon BizAI.
- L’inscription et la connexion sont testées, avec des erreurs compréhensibles et des boutons bloqués pendant l’envoi.

## Mise en œuvre
1. Filtrer les actions d’abonnement pour exclure Business tout en conservant ses limites historiques côté serveur.
2. Corriger les textes visibles et supprimer les mentions de paiement en mode démo devenues obsolètes.
3. Franciser les écrans 404/erreur et compléter les états de chargement manquants.
4. Ajouter les métadonnées manquantes (`og:type`, `twitter:card`) sur toutes les pages et une image sociale publique pour l’accueil.
5. Sécuriser les formulaires d’accès avec gestion d’erreurs propre, indicateurs de chargement et redirections cohérentes.
6. Vérifier sur ordinateur et mobile les pages publiques, la 404 et le parcours d’accès.

## Hypothèse
Business reste affiché comme aperçu avec la mention « Bientôt disponible », mais sans bouton cliquable ni redirection vers Whop.
