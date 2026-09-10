import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Lightbulb,
  MessageSquareQuote,
  PenLine,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { SiteHeader, BizAILogo } from "@/components/landing/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PLANS } from "@/lib/plans";
import heroImage from "@/assets/hero-bizai.jpg";
import featurePostsImage from "@/assets/feature-posts.jpg";
import featureCalendarImage from "@/assets/feature-calendrier.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BizAI — Crée ton contenu marketing avec l'IA" },
      {
        name: "description",
        content:
          "BizAI aide les restaurants, coiffeurs, garages et artisans à créer leurs publications, répondre à leurs clients et planifier leur contenu.",
      },
      { property: "og:title", content: "BizAI — Crée ton contenu marketing avec l'IA" },
      {
        property: "og:description",
        content:
          "Publications, réponses aux avis, idées et calendrier marketing : tout ton contenu en quelques secondes.",
      },
    ],
  }),
  component: Landing,
});

const benefits = [
  {
    icon: Clock,
    title: "Gagne des heures chaque semaine",
    text: "Ce qui te prenait une soirée se fait maintenant en deux minutes, entre deux clients.",
  },
  {
    icon: TrendingUp,
    title: "Une communication régulière",
    text: "Publie sans interruption et reste visible auprès de tes clients locaux.",
  },
  {
    icon: Sparkles,
    title: "Un ton toujours professionnel",
    text: "Des textes clairs, soignés et adaptés à ton métier, sans faute et sans blocage.",
  },
  {
    icon: Wallet,
    title: "Moins cher qu'une agence",
    text: "Le prix d'un abonnement, pas d'un prestataire mensuel.",
  },
];

const steps = [
  {
    number: "01",
    title: "Décris ton activité",
    text: "Ton métier, ton style, ta ville. Une fois pour toutes.",
  },
  {
    number: "02",
    title: "Choisis un outil",
    text: "Publication, réponse à un avis, idée de contenu ou calendrier.",
  },
  {
    number: "03",
    title: "Publie",
    text: "Tu récupères un texte prêt à l'emploi, que tu peux ajuster en un clic.",
  },
];

const features = [
  {
    icon: PenLine,
    title: "Générateur de posts",
    text: "Des publications Instagram, Facebook ou Google adaptées à ton commerce et à tes offres.",
  },
  {
    icon: MessageSquareQuote,
    title: "Réponses aux avis",
    text: "Réponds avec justesse aux avis positifs comme aux critiques, sans y passer la journée.",
  },
  {
    icon: Lightbulb,
    title: "Idées de contenu",
    text: "Une réserve d'idées pertinentes pour ton métier, prêtes à être transformées en posts.",
  },
  {
    icon: CalendarDays,
    title: "Calendrier marketing",
    text: "Vois ton mois d'un coup d'œil et planifie tes temps forts sans rien oublier.",
  },
];

const plans = PLANS.map((plan) => ({
  name: plan.name.toUpperCase(),
  price: plan.priceLabel,
  generations: `${plan.generations.toLocaleString("fr-FR")} générations par mois`,
  highlight: Boolean(plan.highlight),
  perks: plan.features,
}));

const faq = [
  {
    q: "Est-ce que je dois savoir écrire ou utiliser l'IA ?",
    a: "Non. Tu réponds à deux ou trois questions simples sur ton activité et BizAI rédige à ta place. Aucune compétence technique n'est nécessaire.",
  },
  {
    q: "Est-ce que ça marche pour mon métier ?",
    a: "BizAI est conçu pour les petites entreprises de proximité : restaurants, coiffeurs, barbiers, garages, boutiques, agences immobilières et artisans.",
  },
  {
    q: "Qu'est-ce qu'une génération ?",
    a: "Chaque texte créé compte pour une génération : une publication, une réponse à un avis ou une série d'idées.",
  },
  {
    q: "Puis-je changer de plan ou arrêter ?",
    a: "Oui, tu peux changer d'offre ou arrêter quand tu le souhaites, sans engagement de durée.",
  },
  {
    q: "Les textes m'appartiennent-ils ?",
    a: "Oui, tout ce que tu génères est à toi et tu peux le modifier librement avant publication.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 size-[38rem] -translate-x-1/2 rounded-full bg-primary-soft blur-3xl" />
        <div className="relative mx-auto w-full max-w-4xl px-5 py-20 text-center sm:py-28">
          <Badge variant="secondary" className="mb-6 rounded-full px-3 py-1 text-xs font-semibold">
            Assistant IA pour les petites entreprises
          </Badge>
          <h1 className="text-4xl font-extrabold leading-[1.1] sm:text-5xl md:text-6xl">
            Crée ton contenu marketing avec l'IA en{" "}
            <span className="text-gradient-hero">quelques secondes.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            BizAI aide les petites entreprises à créer leurs publications, répondre à leurs clients
            et planifier leur contenu.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full rounded-full px-7 sm:w-auto">
              <Link to="/inscription">
                Commencer gratuitement
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full rounded-full px-7 sm:w-auto">
              <a href="#fonctionnalites">Voir les fonctionnalités</a>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Sans engagement · Prêt à utiliser en 2 minutes
          </p>
          <img
            src={heroImage}
            alt="Deux gérants de salon de coiffure préparant leur communication sur une tablette"
            width={1600}
            height={1104}
            className="mt-14 aspect-[16/10] w-full rounded-3xl object-cover shadow-lift"
          />
        </div>
      </section>

      {/* Problème résolu */}
      <section id="produit" className="border-t border-border/70 bg-muted/40 py-20">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Tu gères ton entreprise. Pas une agence de communication.
            </h2>
            <p className="mt-5 text-muted-foreground">
              Trouver quoi publier, écrire un texte correct, répondre à un avis délicat, tenir un
              rythme régulier : c'est du temps que tu n'as pas. Résultat, la communication passe
              après tout le reste, et les clients ne voient plus rien de ton activité.
            </p>
            <p className="mt-4 text-muted-foreground">
              BizAI comble ce vide. Tu décris ton métier une seule fois, et l'assistant se charge de
              rédiger, répondre et planifier à ta place — dans un ton qui te ressemble.
            </p>
          </div>
          <Card className="rounded-3xl border-border/70 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Avant / Après BizAI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-2xl bg-muted p-4 text-muted-foreground">
                « Je devais publier cette semaine… j'ai encore oublié. »
              </div>
              <div className="rounded-2xl bg-primary-soft p-4 text-secondary-foreground">
                « 3 publications programmées, 5 avis traités, mon mois est planifié. »
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-20">
        <div className="mx-auto w-full max-w-6xl px-5">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Ce que tu y gagnes</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="rounded-2xl border-border/70 shadow-soft">
                <CardContent className="pt-6">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft">
                    <benefit.icon className="size-5 text-primary" />
                  </span>
                  <h3 className="mt-4 font-semibold">{benefit.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{benefit.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="fonctionnement" className="border-y border-border/70 bg-muted/40 py-20">
        <div className="mx-auto w-full max-w-6xl px-5">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Comment ça marche</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            Trois étapes, et ton contenu est prêt.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <Card key={step.number} className="rounded-2xl border-border/70 shadow-soft">
                <CardContent className="pt-6">
                  <span className="text-sm font-extrabold text-primary">{step.number}</span>
                  <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="py-20">
        <div className="mx-auto w-full max-w-6xl px-5">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Quatre outils, un seul espace</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <img
              src={featurePostsImage}
              alt="Commerçant qui rédige une publication depuis son téléphone"
              loading="lazy"
              width={1200}
              height={912}
              className="h-64 w-full rounded-3xl object-cover shadow-soft sm:h-80"
            />
            <img
              src={featureCalendarImage}
              alt="Gérante de boutique qui planifie son mois de publications"
              loading="lazy"
              width={1200}
              height={912}
              className="h-64 w-full rounded-3xl object-cover shadow-soft sm:h-80"
            />
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title} className="rounded-2xl border-border/70 shadow-soft">
                <CardContent className="flex gap-4 pt-6">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
                    <feature.icon className="size-5 text-primary" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{feature.text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section id="tarifs" className="border-y border-border/70 bg-muted/40 py-20">
        <div className="mx-auto w-full max-w-6xl px-5">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Des tarifs simples</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
            Choisis le volume qui correspond à ton rythme de publication.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={
                  plan.highlight
                    ? "relative rounded-3xl border-primary/40 shadow-lift"
                    : "rounded-3xl border-border/70 shadow-soft"
                }
              >
                {plan.highlight ? (
                  <Badge className="absolute -top-3 left-6 rounded-full">Le plus choisi</Badge>
                ) : null}
                <CardHeader>
                  <CardTitle className="text-sm font-bold tracking-widest text-muted-foreground">
                    {plan.name}
                  </CardTitle>
                  <p className="mt-2">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground"> /mois</span>
                  </p>
                  <p className="text-sm font-medium text-primary">{plan.generations}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    {plan.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{perk}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="mt-7 w-full rounded-full"
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    <Link to="/inscription">Choisir ce plan</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="mx-auto w-full max-w-3xl px-5">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">Questions fréquentes</h2>
          <Accordion type="single" collapsible className="mt-10">
            {faq.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="text-left text-base font-semibold">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-5 pb-20">
        <div className="mx-auto max-w-6xl rounded-3xl bg-gradient-hero px-6 py-14 text-center shadow-lift">
          <h2 className="text-3xl font-extrabold text-primary-foreground sm:text-4xl">
            Ton prochain post est à une minute d'ici.
          </h2>
          <Button asChild size="lg" variant="secondary" className="mt-8 rounded-full px-7">
            <Link to="/inscription">
              Commencer gratuitement
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/70 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-5 px-5 sm:flex-row">
          <BizAILogo />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} BizAI. Tous droits réservés.
          </p>
          <div className="flex gap-5 text-sm text-muted-foreground">
            <a href="#tarifs" className="transition-colors hover:text-foreground">
              Tarifs
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </a>
            <Link to="/connexion" className="transition-colors hover:text-foreground">
              Connexion
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
