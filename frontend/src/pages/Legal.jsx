const SECTIONS = [
  { id: 'lg-mentions', label: 'Mentions légales' },
  { id: 'lg-cgu', label: "Conditions d'utilisation (CGU)" },
  { id: 'lg-reglement', label: 'Règlement du jeu' },
  { id: 'lg-rgpd', label: 'Confidentialité (RGPD)' },
  { id: 'lg-cookies', label: 'Cookies' },
];

const H2 = { fontWeight: 600, fontSize: 26, margin: '0 0 12px', scrollMarginTop: 90 };
const H3 = { fontWeight: 600, fontSize: 17, margin: '18px 0 6px', color: 'var(--ink)' };
const P = { margin: '0 0 14px' };

export default function Legal() {
  return (
    <section className="ttt-section ttt-section--narrow" style={{ paddingTop: 56, paddingBottom: 80 }}>
      <div style={{ marginBottom: 34 }}>
        <div className="ttt-eyebrow">Informations légales</div>
        <h1 style={{ fontWeight: 600, fontSize: 'clamp(32px,4.5vw,48px)', margin: 0 }}>Règlement & mentions.</h1>
      </div>

      <div
        style={{
          margin: '0 0 30px',
          padding: '14px 18px',
          borderRadius: 12,
          background: 'var(--success-bg)',
          border: '1px solid var(--green)',
          fontSize: 14,
          color: 'var(--ink-soft)',
        }}
      >
        <strong>Projet étudiant fictif.</strong> Ce site est réalisé dans un cadre pédagogique. Aucun achat ni
        transaction réelle ne peut être effectué.
      </div>

      <div className="ttt-legal-grid">
        <nav style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13.5 }}>
          {SECTIONS.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              style={{
                color: i === 0 ? 'var(--green)' : 'var(--muted)',
                fontWeight: i === 0 ? 700 : 400,
                textDecoration: 'none',
                padding: '8px 12px',
                borderRadius: 9,
                background: i === 0 ? 'var(--success-bg)' : 'transparent',
              }}
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.8 }}>
          {/* ---------- MENTIONS LEGALES ---------- */}
          <h2 id="lg-mentions" style={H2}>Mentions légales</h2>

          <h3 style={H3}>Éditeur du site</h3>
          <p style={P}>
            <strong>Thé Tip Top</strong> — Société Anonyme (SA) au capital de 150 000 €.<br />
            Siège social : 18 rue Léon Frot, 75011 Paris.<br />
            Représentant légal : Eric Bourdon, Président de Thé Tip Top.<br />
            SIREN : 763 827 619 — SIRET : 763 827 619 00043.<br />
            TVA intracommunautaire : FR27763827619.<br />
            Code APE / NAF : à compléter.<br />
            Contact : contact@thetiptop.fr
          </p>

          <h3 style={H3}>Hébergeur</h3>
          <p style={P}>
            Nom de l'hébergeur : à compléter.<br />
            Adresse : à compléter.<br />
            Téléphone : à compléter.
          </p>

          <h3 style={H3}>Propriété intellectuelle</h3>
          <p style={P}>
            Le site ainsi que l'ensemble de ses contenus (textes, images, logo, design, etc.) sont protégés par le
            droit de la propriété intellectuelle. Toute reproduction, modification ou diffusion sans autorisation est
            interdite.
          </p>

          <h3 style={H3}>Responsabilité</h3>
          <p style={P}>
            L'éditeur ne pourra être tenu responsable des dommages directs ou indirects liés à l'utilisation du site.
          </p>

          <p style={{ ...P, fontSize: 13, color: 'var(--muted)', marginBottom: 28 }}>
            Dernière mise à jour des mentions légales : 16 février 2026.
          </p>

          {/* ---------- CGU ---------- */}
          <h2 id="lg-cgu" style={H2}>Conditions Générales d'Utilisation (CGU)</h2>

          <h3 style={H3}>Acceptation des CGU</h3>
          <p style={P}>
            L'accès et l'utilisation du site impliquent l'acceptation pleine et entière des présentes Conditions
            Générales d'Utilisation. Tout utilisateur qui n'accepte pas les présentes conditions est invité à ne pas
            utiliser le site ni les services proposés.
          </p>

          <h3 style={H3}>Objet</h3>
          <p style={P}>
            Les présentes Conditions Générales d'Utilisation ont pour objet de définir les modalités d'accès et
            d'utilisation du site de jeu-concours proposé par Thé Tip Top.
          </p>

          <h3 style={H3}>Accès au site</h3>
          <p style={P}>
            Le site est accessible gratuitement à tout utilisateur disposant d'un accès à Internet. Certaines
            fonctionnalités (participation au jeu, consultation des gains) nécessitent la création d'un compte.
          </p>

          <h3 style={H3}>Inscription et compte utilisateur</h3>
          <p style={P}>
            L'utilisateur peut s'inscrire soit via un formulaire d'inscription classique, soit en utilisant un compte
            Google. Il s'engage à fournir des informations exactes, complètes et à jour, et à ne pas usurper
            l'identité d'un tiers.
          </p>

          <h3 style={H3}>Obligations de l'utilisateur</h3>
          <p style={P}>
            L'utilisateur s'engage à utiliser le site conformément à sa destination et dans le respect de la
            législation en vigueur. Il garantit l'exactitude des informations fournies lors de son inscription et
            s'interdit toute utilisation frauduleuse du site ou du jeu-concours. Toute tentative de fraude, de
            contournement des règles du jeu, d'usurpation d'identité ou de perturbation du fonctionnement du site
            pourra entraîner la suspension ou la suppression du compte concerné, sans préjudice d'éventuelles
            poursuites prévues par la loi.
          </p>

          <h3 style={H3}>Droits des utilisateurs</h3>
          <p style={P}>
            Conformément au Règlement Général sur la Protection des Données (RGPD), chaque utilisateur dispose d'un
            droit d'accès, de rectification, de suppression, d'opposition, de limitation du traitement ainsi que d'un
            droit à la portabilité de ses données personnelles. Ces droits peuvent être exercés à tout moment en
            contactant Thé Tip Top via l'adresse e-mail dédiée à la gestion des données personnelles. Si l'utilisateur
            estime que ses droits ne sont pas respectés, il dispose également du droit d'introduire une réclamation
            auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL).
          </p>

          <h3 style={H3}>Responsabilité</h3>
          <p style={P}>
            Thé Tip Top ne pourra être tenu responsable des dommages résultant d'un dysfonctionnement technique, d'une
            interruption temporaire ou définitive du site, d'un cas de force majeure ou d'une utilisation frauduleuse
            du service par un tiers.
          </p>

          <h3 style={H3}>Modification des CGU</h3>
          <p style={P}>
            Thé Tip Top se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront
            informés en cas de modification.
          </p>

          <h3 style={H3}>Loi applicable et juridiction compétente</h3>
          <p style={{ ...P, marginBottom: 28 }}>
            Les présentes Conditions Générales d'Utilisation sont soumises au droit français. En cas de litige relatif
            à l'interprétation, à l'exécution ou à l'utilisation du site, les tribunaux français seront seuls
            compétents.
          </p>

          {/* ---------- REGLEMENT DU JEU ---------- */}
          <h2 id="lg-reglement" style={H2}>Règlement du jeu-concours</h2>
          <p style={P}>
            Le jeu-concours est 100 % gagnant. La participation s'effectue à l'aide d'un code unique à 10 caractères
            figurant sur un ticket de caisse ou une facture éligible. Chaque code de participation ne peut être
            utilisé qu'une seule fois.
          </p>
          <p style={P}>
            Les gains sont attribués automatiquement selon une répartition prédéfinie respectant les probabilités
            fixées par Thé Tip Top. Les codes gagnants sont générés avant le lancement du jeu-concours afin de
            garantir le respect des pourcentages de gains annoncés.
          </p>
          <p style={{ ...P, marginBottom: 28 }}>
            Un tirage au sort final est organisé à l'issue du jeu-concours afin de désigner le gagnant d'un lot
            exceptionnel supplémentaire. Toute participation implique l'acceptation du présent règlement.
          </p>

          {/* ---------- RGPD ---------- */}
          <h2 id="lg-rgpd" style={H2}>Données personnelles (RGPD)</h2>
          <p style={P}>
            Les données personnelles collectées dans le cadre du jeu-concours, telles que le nom, le prénom ou
            l'adresse e-mail, sont utilisées pour gérer les participations, attribuer les gains, contacter les
            gagnants et assurer le bon fonctionnement du service. Les utilisateurs peuvent également recevoir des
            communications commerciales uniquement s'ils ont donné leur consentement préalable.
          </p>
          <p style={{ ...P, marginBottom: 28 }}>
            Les données sont conservées pendant une durée limitée et adaptée à leur finalité. Les informations
            utilisées à des fins marketing sont conservées pendant une durée maximale de trois ans à compter du
            dernier contact avec l'utilisateur. Les autres données sont conservées conformément aux obligations
            légales et réglementaires applicables. Vous pouvez exercer vos droits directement depuis votre espace
            personnel ou à l'adresse dédiée à la gestion des données personnelles.
          </p>

          {/* ---------- COOKIES ---------- */}
          <h2 id="lg-cookies" style={H2}>Cookies</h2>
          <p style={P}>
            Le site utilise différents types de cookies afin d'assurer son bon fonctionnement, d'améliorer
            l'expérience utilisateur, de mesurer l'audience et, le cas échéant, de proposer des contenus ou
            communications adaptés aux préférences des visiteurs.
          </p>
          <p style={P}>
            Les cookies strictement nécessaires au fonctionnement du site sont déposés automatiquement. En revanche,
            les cookies de mesure d'audience, de personnalisation ou de marketing ne sont utilisés qu'après obtention
            du consentement explicite de l'utilisateur.
          </p>
          <p style={{ margin: 0 }}>
            Lors de sa première visite, l'utilisateur est informé de l'utilisation des cookies par l'intermédiaire
            d'un bandeau dédié lui permettant d'accepter, de refuser ou de personnaliser ses choix.
          </p>
        </div>
      </div>
    </section>
  );
}
