import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/landing/LegalPage";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — BizAI" },
      {
        name: "description",
        content:
          "Informations légales concernant l'édition et l'hébergement du site BizAI.",
      },
      { property: "og:title", content: "Mentions légales — BizAI" },
      {
        property: "og:description",
        content:
          "Informations légales concernant l'édition et l'hébergement du site BizAI.",
      },
    ],
  }),
  component: MentionsLegales,
});

function MentionsLegales() {
  return (
    <LegalPage title="Mentions légales">
      <section>
        <h2>Éditeur du site</h2>
        <p>
          BizAI est édité par Mohamed Abdoulaye Haidara, exerçant sous le nom
          commercial "MH Studio", entrepreneur individuel (micro-entreprise) en
          cours d'immatriculation auprès de l'INPI (dossier n° J00279868459,
          SIRET en attente d'attribution — mention mise à jour dès réception).
        </p>
      </section>

      <section>
        <h2>Adresse</h2>
        <p>25 avenue de Mérignac, 33200 Bordeaux, France</p>
      </section>

      <section>
        <h2>Email de contact</h2>
        <p>
          <a
            href="mailto:mhaidara481@gmail.com"
            className="text-primary underline underline-offset-2"
          >
            mhaidara481@gmail.com
          </a>
        </p>
      </section>

      <section>
        <h2>Directeur de la publication</h2>
        <p>Mohamed Abdoulaye Haidara</p>
      </section>

      <section>
        <h2>Hébergement</h2>
        <p>
          Le site et l'application sont hébergés par Lovable Labs, Inc. et
          s'appuient sur l'infrastructure Supabase (base de données) pour le
          stockage des données.
        </p>
      </section>

      <section>
        <h2>Propriété intellectuelle</h2>
        <p>
          L'ensemble des contenus présents sur BizAI (textes, logo, éléments
          graphiques, structure) est la propriété de l'éditeur, sauf mention
          contraire, et ne peut être reproduit sans autorisation préalable.
        </p>
      </section>
    </LegalPage>
  );
}
