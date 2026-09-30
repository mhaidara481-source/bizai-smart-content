# BizAI: Your Marketing Assistant

Crée une application SaaS appelée "BizAI" — un assistant IA pour aider les petites entreprises (restaurants, coiffeurs, barbiers, garages, boutiques, agences immobilières, artisans...) à créer leur contenu marketing et gérer leur communication client.

C'est une étape 1 de plusieurs : dans ce premier message, je veux uniquement la fondation du projet + la landing page + l'authentification + la structure de navigation. Je t'enverrai ensuite des messages séparés pour construire les outils IA (générateur de posts, réponses aux avis, idées de contenu, calendrier) et la page d'abonnement.

DESIGN
Interface SaaS moderne, premium, très minimaliste : beaucoup d'espace blanc, cartes avec coins arrondis et ombres douces, boutons clairs avec un bon contraste, typographie soignée, navigation simple. Excellente expérience mobile (responsive complet, menu mobile propre). Palette professionnelle (ex: un accent bleu/violet sur fond neutre clair, mode clair uniquement pour l'instant).

1. LANDING PAGE (route publique "/")
- Hero section avec le titre principal : "Crée ton contenu marketing avec l'IA en quelques secondes."
- Sous-titre : "BizAI aide les petites entreprises à créer leurs publications, répondre à leurs clients et planifier leur contenu."
- Bouton principal "Commencer gratuitement" qui mène vers l'inscription
- Section présentation de BizAI (le problème résolu)
- Section avantages
- Section "Comment ça marche" en 3 étapes
- Section fonctionnalités (générateur de posts, réponses aux avis, idées de contenu, calendrier marketing)
- Section tarifs avec deux plans :
  - STARTER : 19€/mois — 100 générations/mois
  - PRO : 39€/mois — 500 générations/mois
  (boutons "Choisir ce plan" qui mènent vers l'inscription si non connecté)
- Section FAQ
- Footer simple

2. AUTHENTIFICATION (via Supabase Auth)
- Page d'inscription (email + mot de passe)
- Page de connexion
- Déconnexion
- Toutes les routes de l'application (tout ce qui n'est pas la landing page) doivent être protégées : redirection vers la connexion si non authentifié

3. STRUCTURE DE NAVIGATION DE L'APP (une fois connecté)
Crée le layout applicatif avec une sidebar (desktop) / menu mobile propre, avec ces entrées (les pages peuvent être de simples placeholders "en construction" pour l'instant, on les remplira dans les prochains messages) :
- Dashboard (page d'accueil de l'app connectée)
- Créer un post
- Répondre aux avis
- Idées de contenu
- Calendrier
- Abonnement
- Paramètres

Pour le Dashboard, mets déjà en place la structure visuelle avec des cartes : nombre de générations utilisées ce mois, nombre de générations restantes, abonnement actuel, raccourcis vers les 4 outils, et une section "activité récente" (données provisoires/vides pour l'instant, on branchera la vraie logique ensuite).

IMPORTANT
- Utilise Supabase pour l'authentification et prévois dès maintenant la base pour une table "profiles" liée à l'utilisateur (nom, entreprise, plan d'abonnement).
- Code propre, composants réutilisables, TypeScript strict.
- Ne mets aucune fausse donnée de paiement ni fausse clé API.
- Ne construis pas encore les outils IA ni la logique d'abonnement/Whop : ce sera dans les messages suivants.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://bizai-smart-content.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7423c2b8-ad9a-47c4-9c40-4838b4f2559b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
