import {
  LayoutDashboard,
  PenLine,
  Image as ImageIcon,
  Clapperboard,
  MessageSquareQuote,
  Lightbulb,
  CalendarDays,
  CreditCard,
  Share2,
  Settings,
} from "lucide-react";

export type NavItem = {
  to:
    | "/dashboard"
    | "/creer-un-post"
    | "/creer-un-visuel"
    | "/creer-une-video"
    | "/repondre-aux-avis"
    | "/idees-de-contenu"
    | "/calendrier"
    | "/reseaux"
    | "/abonnement"
    | "/parametres";
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
};

export const navItems: NavItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Vue d'ensemble de ton activité",
  },
  {
    to: "/creer-un-post",
    label: "Créer un post",
    icon: PenLine,
    description: "Génère des publications prêtes à publier",
  },
  {
    to: "/creer-un-visuel",
    label: "Créer un visuel",
    icon: ImageIcon,
    description: "Génère des images marketing avec l'IA",
  },
  {
    to: "/creer-une-video",
    label: "Créer une vidéo",
    icon: Clapperboard,
    description: "Des vidéos marketing courtes générées par l'IA",
  },
  {
    to: "/repondre-aux-avis",
    label: "Répondre aux avis",
    icon: MessageSquareQuote,
    description: "Des réponses professionnelles en un clic",
  },
  {
    to: "/idees-de-contenu",
    label: "Idées de contenu",
    icon: Lightbulb,
    description: "Ne manque plus jamais d'inspiration",
  },
  {
    to: "/calendrier",
    label: "Calendrier",
    icon: CalendarDays,
    description: "Planifie ton mois de communication",
  },
  { to: "/reseaux", label: "Mes réseaux", icon: Share2, description: "Connecte Facebook et Instagram" },
  { to: "/abonnement", label: "Abonnement", icon: CreditCard, description: "Gère ton offre BizAI" },
  { to: "/parametres", label: "Paramètres", icon: Settings, description: "Ton profil et ton entreprise" },
];

export const toolItems = navItems.slice(1, 8);
