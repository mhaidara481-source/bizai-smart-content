// Types partagés entre le client et le serveur pour les outils IA.

export const BUSINESS_TYPES = [
  "Restaurant",
  "Coiffeur",
  "Barbier",
  "Garage",
  "Boutique",
  "Immobilier",
  "Artisan",
  "Autre",
] as const;

export const PLATFORMS = ["Instagram", "Facebook", "TikTok", "LinkedIn"] as const;

export const TONES = ["Professionnel", "Amical", "Premium", "Drôle", "Promotionnel"] as const;

export const LANGUAGES = ["Français", "Anglais"] as const;

export type PostResult = {
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
};

export type ReviewResult = {
  sentiment: "positif" | "neutre" | "négatif";
  reply: string;
};

export type ContentIdea = {
  subject: string;
  hook: string;
  format: string;
  description: string;
  cta: string;
};

export type IdeasResult = { ideas: ContentIdea[] };

export type CalendarEntry = {
  entry_date: string;
  platform: string;
  idea: string;
  format: string;
};

export type CalendarResult = { entries: CalendarEntry[] };

export type Generated<T> = { data: T; demo: boolean; remaining: number };

export const LIMIT_REACHED_MESSAGE =
  "Tu as atteint ta limite mensuelle. Passe à Pro pour continuer.";

export const CALENDAR_STATUSES = { a_publier: "À publier", publie: "Publié" } as const;

export const VISUAL_STYLES = [
  "Photo réaliste",
  "Minimaliste",
  "Premium / luxe",
  "Coloré et fun",
  "Ambiance chaleureuse",
] as const;

export const VISUAL_FORMATS = ["Carré (post)", "Portrait (story)", "Paysage (bannière)"] as const;

export type VisualResult = { url: string; prompt: string; path?: string };
