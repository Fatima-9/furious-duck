const SECTIONS = [
  { id: 'lg-reglement', label: 'Règlement du jeu' },
  { id: 'lg-mentions', label: 'Mentions légales' },
  { id: 'lg-rgpd', label: 'Confidentialité (RGPD)' },
  { id: 'lg-cookies', label: 'Cookies' },
];

export default function Legal() {
  return (
    <section className="ttt-section ttt-section--narrow" style={{ paddingTop: 56, paddingBottom: 80 }}>
      <div style={{ marginBottom: 34 }}>
        <div className="ttt-eyebrow">Informations légales</div>
        <h1 style={{ fontWeight: 600, fontSize: 'clamp(32px,4.5vw,48px)', margin: 0 }}>Règlement & mentions.</h1>
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
          <h2 id="lg-reglement" style={{ fontWeight: 600, fontSize: 26, margin: '0 0 12px', scrollMarginTop: 90 }}>
            Règlement du jeu
          </h2>
          <p style={{ margin: '0 0 14px' }}>
            Le jeu-concours « Thé Tip Top » est organisé du 1ᵉʳ mars au 30 septembre 2026, sans obligation d'achat. Il
            est ouvert à toute personne physique majeure résidant en France métropolitaine, à l'exclusion du
            personnel de la société organisatrice.
          </p>
          <p style={{ margin: '0 0 14px' }}>
            Chaque code de participation, valable une seule fois, donne droit à un lot déterminé par tirage
            instantané. La dotation comprend cinq catégories de lots, de l'infuseur à l'année de thé offerte. Les
            lots ne sont ni échangeables ni remboursables.
          </p>
          <p style={{ margin: '0 0 28px' }}>
            Le règlement complet est déposé et disponible sur simple demande. La participation implique l'acceptation
            pleine et entière du présent règlement.
          </p>

          <h2 id="lg-mentions" style={{ fontWeight: 600, fontSize: 26, margin: '0 0 12px', scrollMarginTop: 90 }}>
            Mentions légales
          </h2>
          <p style={{ margin: '0 0 14px' }}>
            Site édité par Thé Tip Top SAS, au capital de 50 000 €, dont le siège social est situé 18 rue des
            Jardins, 75011 Paris. RCS Paris 000 000 000. Directeur de la publication : la Direction. Hébergement :
            prestataire certifié, Union européenne.
          </p>
          <p style={{ margin: '0 0 28px' }}>
            L'ensemble des contenus (textes, visuels, marques) est protégé par le droit de la propriété
            intellectuelle et demeure la propriété exclusive de Thé Tip Top SAS.
          </p>

          <h2 id="lg-rgpd" style={{ fontWeight: 600, fontSize: 26, margin: '0 0 12px', scrollMarginTop: 90 }}>
            Confidentialité (RGPD)
          </h2>
          <p style={{ margin: '0 0 14px' }}>
            Les données collectées (identité, e-mail, historique de participation) sont traitées pour la seule
            gestion du jeu et l'attribution des lots. Elles sont conservées le temps de l'opération, puis archivées
            conformément aux obligations légales.
          </p>
          <p style={{ margin: '0 0 28px' }}>
            Vous disposez d'un droit d'accès, de rectification, de portabilité et de suppression, exerçable
            directement depuis votre espace ou à l'adresse rgpd@thetiptop.fr. Aucune donnée n'est cédée à des tiers à
            des fins commerciales.
          </p>

          <h2 id="lg-cookies" style={{ fontWeight: 600, fontSize: 26, margin: '0 0 12px', scrollMarginTop: 90 }}>
            Cookies
          </h2>
          <p style={{ margin: 0 }}>
            Le site utilise des cookies strictement nécessaires à son fonctionnement et, sous réserve de votre
            consentement, des cookies de mesure d'audience. Vous pouvez modifier vos préférences à tout moment.
            Aucun cookie publicitaire tiers n'est déposé.
          </p>
        </div>
      </div>
    </section>
  );
}
