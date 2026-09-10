import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/landing/LegalPage";

export const Route = createFileRoute("/cgu")({
  head: () => ({
    meta: [
      { title: "Conditions générales d'utilisation — BizAI" },
      {
        name: "description",
        content:
          "Conditions d'accès et d'utilisation du service BizAI.",
      },
      {
        property: "og:title",
        content: "Conditions générales d'utilisation — BizAI",
      },
      {
        property: "og:description",
        content:
          "Conditions d'accès et d'utilisation du service BizAI.",
      },
    ],
  }),
  component: CGU,
});

function CGU() {
  return (
    <LegalPage title="Conditions générales d'utilisation">
      <section>
        <h2>1. Objet</h2>
        <p>
          Les présentes CGU définissent les conditions d'accès et
          d'utilisation du service BizAI, assistant IA d'aide à la création de
          contenu marketing pour les petites entreprises (génération de
          publications, réponses aux avis clients, idées de contenu, calendrier
          éditorial).
        </p>
      </section>

      <section>
        <h2>2. Accès au service</h2>
        <p>
          L'accès à BizAI nécessite la création d'un compte utilisateur (email
          et mot de passe). L'utilisateur s'engage à fournir des informations
          exactes et à préserver la confidentialité de ses identifiants.
        </p>
      </section>

      <section>
        <h2>3. Utilisation du service</h2>
        <p>
          L'utilisateur s'engage à utiliser BizAI conformément à la loi et à ne
          pas générer de contenu illicite, diffamatoire, trompeur ou portant
          atteinte aux droits de tiers. BizAI génère du contenu à l'aide de
          modèles d'intelligence artificielle ; l'utilisateur reste seul
          responsable de la vérification et de la publication finale des contenus
          générés.
        </p>
      </section>

      <section>
        <h2>4. Limites de génération</h2>
        <p>
          Chaque abonnement (Starter, Pro) inclut un nombre de générations
          mensuelles défini sur la page Abonnement. Ces limites sont vérifiées
          automatiquement et peuvent entraîner un blocage temporaire des
          générations en cas de dépassement, jusqu'au renouvellement de la
          période ou à la mise à niveau du plan.
        </p>
      </section>

      <section>
        <h2>5. Résiliation</h2>
        <p>
          L'utilisateur peut supprimer son compte à tout moment depuis les
          paramètres. L'éditeur se réserve le droit de suspendre un compte en
          cas de non-respect des présentes CGU.
        </p>
      </section>

      <section>
        <h2>6. Responsabilité</h2>
        <p>
          BizAI est fourni "en l'état". L'éditeur ne garantit pas l'absence
          totale d'erreurs ou d'interruptions du service et ne saurait être tenu
          responsable d'un usage inapproprié des contenus générés par
          l'utilisateur.
        </p>
      </section>
    </LegalPage>
  );
}
