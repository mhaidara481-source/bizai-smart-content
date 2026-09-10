import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/landing/LegalPage";

export const Route = createFileRoute("/cgv")({
  head: () => ({
    meta: [
      { title: "Conditions générales de vente — BizAI" },
      {
        name: "description",
        content:
          "Conditions de souscription, paiement et résiliation des abonnements BizAI.",
      },
      {
        property: "og:title",
        content: "Conditions générales de vente — BizAI",
      },
      {
        property: "og:description",
        content:
          "Conditions de souscription, paiement et résiliation des abonnements BizAI.",
      },
    ],
  }),
  component: CGV,
});

function CGV() {
  return (
    <LegalPage title="Conditions générales de vente">
      <section>
        <h2>1. Offres et tarifs</h2>
        <p>
          BizAI propose deux formules d'abonnement mensuel, sans engagement de
          durée : STARTER 19€/mois (100 générations/mois), PRO 39€/mois (500
          générations/mois). Les prix sont indiqués en euros. TVA non
          applicable, art. 293 B du CGI (franchise en base).
        </p>
      </section>

      <section>
        <h2>2. Paiement</h2>
        <p>
          Le paiement s'effectue par carte bancaire via le prestataire de
          paiement Whop, de manière récurrente mensuelle, jusqu'à résiliation
          par l'utilisateur.
        </p>
      </section>

      <section>
        <h2>3. Renouvellement et résiliation</h2>
        <p>
          L'abonnement se renouvelle automatiquement chaque mois. L'utilisateur
          peut résilier à tout moment depuis la page Abonnement ; la résiliation
          prend effet à la fin de la période en cours, sans remboursement au
          prorata.
        </p>
      </section>

      <section>
        <h2>4. Droit de rétractation</h2>
        <p>
          Conformément à l'article L221-28 du Code de la consommation, le droit
          de rétractation ne s'applique pas aux services pleinement exécutés avant
          la fin du délai de rétractation avec l'accord exprès du consommateur,
          ce que l'utilisateur reconnaît en commençant à utiliser le service
          immédiatement après souscription.
        </p>
      </section>

      <section>
        <h2>5. Réclamations</h2>
        <p>
          Toute question relative à la facturation ou à l'abonnement peut être
          adressée à{" "}
          <a
            href="mailto:mhaidara481@gmail.com"
            className="text-primary underline underline-offset-2"
          >
            mhaidara481@gmail.com
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
