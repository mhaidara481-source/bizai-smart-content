// Source de vérité unique des offres BizAI (client + serveur).

export type PlanId = "free" | "starter" | "pro" | "business";

export type Plan = {
  id: PlanId;
  name: string;
  price: number;
  priceLabel: string;
  generations: number;
  teamMembers: number;
  tagline: string;
  highlight?: boolean;
  features: string[];
  /** Renseigné plus tard avec le vrai plan Whop (voir src/lib/payments). */
  whopPlanKey: string | null;
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 19,
    priceLabel: "19€",
    generations: 100,
    teamMembers: 1,
    tagline: "Pour démarrer une communication régulière.",
    whopPlanKey: null,
    features: [
      "100 générations par mois",
      "Générateur de posts et réponses aux avis",
      "Idées de contenu",
      "1 utilisateur",
      "Support email",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 39,
    priceLabel: "39€",
    generations: 500,
    teamMembers: 3,
    tagline: "Le choix des commerces qui publient chaque semaine.",
    highlight: true,
    whopPlanKey: null,
    features: [
      "500 générations par mois",
      "Les 4 outils IA",
      "Calendrier marketing 30 jours",
      "3 utilisateurs",
      "Support prioritaire",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 79,
    priceLabel: "79€",
    generations: 1500,
    teamMembers: 10,
    tagline: "Pour plusieurs établissements ou une petite équipe.",
    whopPlanKey: null,
    features: [
      "1 500 générations par mois",
      "Les 4 outils IA",
      "Calendrier marketing 30 jours",
      "10 utilisateurs",
      "Support prioritaire et accompagnement",
    ],
  },
];

export const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  starter: 100,
  pro: 500,
  business: 1500,
};

export const PLAN_LABELS: Record<string, string> = {
  free: "Découverte",
  starter: "Starter",
  pro: "Pro",
  business: "Business",
};

export const TEAM_MEMBERS: Record<string, number> = {
  free: 1,
  starter: 1,
  pro: 3,
  business: 10,
};

export const PAID_PLAN_IDS = ["starter", "pro", "business"] as const;

export function isPaidPlan(plan: string | undefined): boolean {
  return (PAID_PLAN_IDS as readonly string[]).includes(plan ?? "");
}

export function planLimitFor(plan: string | undefined): number {
  return PLAN_LIMITS[plan ?? "free"] ?? PLAN_LIMITS["free"]!;
}

/** Tableau comparatif affiché sur la page Abonnement. */
export const PLAN_COMPARISON: Array<{ label: string; values: Record<string, string> }> = [
  {
    label: "Générations par mois",
    values: { starter: "100", pro: "500", business: "1 500" },
  },
  {
    label: "Générateur de posts",
    values: { starter: "Illimité dans le quota", pro: "Illimité dans le quota", business: "Illimité dans le quota" },
  },
  {
    label: "Réponses aux avis",
    values: { starter: "Inclus", pro: "Inclus", business: "Inclus" },
  },
  {
    label: "Idées de contenu",
    values: { starter: "10 par génération", pro: "30 par génération", business: "30 par génération" },
  },
  {
    label: "Calendrier 30 jours",
    values: { starter: "—", pro: "Inclus", business: "Inclus" },
  },
  {
    label: "Utilisateurs",
    values: { starter: "1", pro: "3", business: "10" },
  },
  {
    label: "Support",
    values: { starter: "Email", pro: "Prioritaire", business: "Prioritaire + accompagnement" },
  },
];
