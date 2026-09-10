import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/landing/LegalPage";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — BizAI" },
      {
        name: "description",
        content:
          "Politique de confidentialité et traitement des données personnelles sur BizAI.",
      },
      {
        property: "og:title",
        content: "Politique de confidentialité — BizAI",
      },
      {
        property: "og:description",
        content:
          "Politique de confidentialité et traitement des données personnelles sur BizAI.",
      },
    ],
  }),
  component: Confidentialite,
});

function Confidentialite() {
  return (
    <LegalPage title="Politique de confidentialité (RGPD)">
      <section>
        <h2>1. Responsable du traitement</h2>
        <p>
          Mohamed Abdoulaye Haidara (MH Studio) est responsable du traitement
          des données personnelles collectées via BizAI.
        </p>
      </section>

      <section>
        <h2>2. Données collectées</h2>
        <p>
          Données de compte (email, mot de passe chiffré, nom de l'entreprise)
          ; données d'usage (contenus générés, historique, plan d'abonnement,
          statistiques) ; données de paiement (traitées directement par Whop,
          non stockées sur les serveurs de BizAI).
        </p>
      </section>

      <section>
        <h2>3. Finalités</h2>
        <p>
          fournir et améliorer le service, gérer les comptes et abonnements,
          assurer la sécurité de la plateforme, communiquer avec l'utilisateur
          sur son compte.
        </p>
      </section>

      <section>
        <h2>4. Base légale</h2>
        <p>Exécution du contrat et, le cas échéant, consentement de l'utilisateur.</p>
      </section>

      <section>
        <h2>5. Durée de conservation</h2>
        <p>
          Pendant toute la durée d'utilisation du compte, puis
          suppression/anonymisation dans un délai raisonnable après suppression du
          compte, sauf obligation légale de conservation plus longue.
        </p>
      </section>

      <section>
        <h2>6. Droits de l'utilisateur</h2>
        <p>
          Droit d'accès, de rectification, d'effacement, de limitation, de
          portabilité et d'opposition, exerçables par email à{" "}
          <a
            href="mailto:mhaidara481@gmail.com"
            className="text-primary underline underline-offset-2"
          >
            mhaidara481@gmail.com
          </a>
          . Droit d'introduire une réclamation auprès de la CNIL (
          <a
            href="https://www.cnil.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2"
          >
            www.cnil.fr
          </a>
          ).
        </p>
      </section>

      <section>
        <h2>7. Sécurité</h2>
        <p>
          Données stockées sur l'infrastructure Supabase avec chiffrement et
          Row Level Security (un utilisateur ne peut accéder qu'à ses propres
          données).
        </p>
      </section>

      <section>
        <h2>8. Cookies</h2>
        <p>
          Uniquement des cookies techniques nécessaires au fonctionnement
          (authentification, session). Aucun cookie publicitaire ou de tracking
          tiers à ce stade.
        </p>
      </section>
    </LegalPage>
  );
}
