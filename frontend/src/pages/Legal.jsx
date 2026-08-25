import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { openCookiePreferences } from '../components/cookies/cookieConsent';

const SECTIONS = [
  { id: 'lg-mentions', label: 'Mentions légales' },
  { id: 'lg-cgu', label: "Conditions d'utilisation" },
  { id: 'lg-reglement', label: 'Règlement du jeu' },
  { id: 'lg-rgpd', label: 'Confidentialité' },
  { id: 'lg-cookies', label: 'Cookies & Analytics' },
];

const PRIZES = [
  ['60 %', 'Un infuseur à thé'],
  ['20 %', 'Une boîte de 100 g de thé détox ou d’infusion'],
  ['10 %', 'Une boîte de 100 g de thé signature'],
  ['6 %', 'Un coffret découverte d’une valeur de 39 €'],
  ['4 %', 'Un coffret découverte d’une valeur de 69 €'],
];

export default function Legal() {
  const { hash } = useLocation();
  const [activeSection, setActiveSection] = useState(hash.slice(1) || SECTIONS[0].id);

  useEffect(() => {
    document.title = 'Règlement du jeu, mentions légales et confidentialité | Thé Tip Top';
    const description =
      'Consultez le règlement du jeu-concours Thé Tip Top, les mentions légales, les CGU et les informations RGPD et cookies.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;
  }, []);

  useEffect(() => {
    const targetId = hash.slice(1);
    if (!targetId || !SECTIONS.some(({ id }) => id === targetId)) return;
    window.requestAnimationFrame(() => {
      setActiveSection(targetId);
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [hash]);

  useEffect(() => {
    const sections = SECTIONS.map(({ id }) => document.getElementById(id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: '-18% 0px -68% 0px', threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="ttt-section ttt-section--narrow ttt-legal-page">
      <header className="ttt-legal-header">
        <div className="ttt-eyebrow">Informations légales et transparence</div>
        <h1>Règlement & mentions</h1>
        <p>
          Retrouvez les règles du jeu-concours Thé Tip Top, les conditions d’utilisation du service et les
          informations relatives à vos données personnelles.
        </p>
      </header>

      <aside className="ttt-legal-notice" aria-label="Information importante">
        <strong>Projet étudiant fictif.</strong> Ce site est réalisé dans un cadre pédagogique. Aucun achat ni aucune
        transaction réelle ne peut être effectué.
      </aside>

      <div className="ttt-legal-grid">
        <nav className="ttt-legal-nav" aria-label="Sommaire des informations légales">
          <span className="ttt-legal-nav-title">Sur cette page</span>
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={activeSection === section.id ? 'is-active' : ''}
              aria-current={activeSection === section.id ? 'location' : undefined}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </a>
          ))}
        </nav>

        <article className="ttt-legal-content">
          <section aria-labelledby="lg-mentions">
            <h2 id="lg-mentions">Mentions légales</h2>
            <h3>Éditeur du site</h3>
            <address className="ttt-legal-details">
              <strong>Thé Tip Top</strong>, Société Anonyme (SA) au capital social de 150 000 €<br />
              Siège social : 18 rue Léon Frot, 75011 Paris<br />
              Représentant légal : Eric Bourdon, Président<br />
              SIREN : 763 827 619 · SIRET : 763 827 619 00043<br />
              TVA intracommunautaire : FR27763827619<br />
              Code APE / NAF : information à compléter avant la mise en production<br />
              Contact : <a href="mailto:contact@thetiptop.fr">contact@thetiptop.fr</a>
            </address>

            <h3>Conception et hébergement</h3>
            <p>
              Le site est conçu dans un cadre pédagogique par l’agence étudiante Furious Ducks pour Thé Tip Top. Les
              coordonnées définitives de l’hébergeur (dénomination, adresse et téléphone) seront publiées ici avant
              toute mise en ligne publique.
            </p>

            <h3>Propriété intellectuelle</h3>
            <p>
              La structure du site et ses contenus, notamment les textes, illustrations, photographies, éléments
              graphiques, logos et signes distinctifs, sont protégés par le droit de la propriété intellectuelle.
              Toute reproduction, représentation, adaptation ou diffusion, totale ou partielle, est interdite sans
              autorisation écrite préalable de leur titulaire, hors exceptions prévues par la loi.
            </p>

            <h3>Responsabilité et disponibilité</h3>
            <p>
              Thé Tip Top met en œuvre les moyens raisonnables pour fournir des informations exactes et maintenir
              l’accès au service. Sa responsabilité ne saurait toutefois être engagée en cas d’interruption, d’erreur,
              de force majeure, d’usage frauduleux ou de dommage indirect lié à l’utilisation du site.
            </p>
            <p className="ttt-legal-updated">Dernière mise à jour : 23 août 2026.</p>
          </section>

          <section aria-labelledby="lg-cgu">
            <h2 id="lg-cgu">Conditions Générales d’Utilisation</h2>
            <h3>Objet et acceptation</h3>
            <p>
              Les présentes conditions encadrent l’accès et l’utilisation du site de jeu-concours Thé Tip Top.
              L’utilisation du site implique leur acceptation. Le service est accessible gratuitement à toute
              personne disposant d’un accès à Internet ; la participation et la consultation des gains nécessitent un
              compte.
            </p>

            <h3>Compte utilisateur</h3>
            <p>
              L’utilisateur peut s’inscrire par formulaire ou au moyen d’un compte Google lorsque cette option est
              disponible. Il s’engage à transmettre des informations exactes et à protéger ses identifiants. Toute
              fraude, usurpation d’identité, tentative de contournement ou perturbation du service peut entraîner la
              suspension ou la suppression du compte, sans préjudice des recours applicables.
            </p>

            <h3>Évolution du service et droit applicable</h3>
            <p>
              Thé Tip Top peut faire évoluer le service et les présentes conditions. Toute modification importante
              sera portée à la connaissance des utilisateurs. Ces conditions sont soumises au droit français. En cas
              de différend, les parties rechercheront d’abord une solution amiable avant de saisir la juridiction
              compétente.
            </p>
          </section>

          <section aria-labelledby="lg-reglement">
            <h2 id="lg-reglement">Règlement du jeu-concours</h2>
            <div className="ttt-legal-keyfacts" aria-label="Informations essentielles du jeu">
              <div><strong>Durée</strong><span>Du 1er au 30 août 2026</span></div>
              <div><strong>Participation</strong><span>Un code unique par ticket éligible</span></div>
              <div><strong>Retrait des gains</strong><span>Jusqu’au 29 septembre 2026</span></div>
            </div>

            <h3>Organisation et conditions de participation</h3>
            <p>
              Thé Tip Top organise un jeu-concours dans le cadre de l’ouverture de sa 10e boutique à Nice. Il est
              ouvert aux personnes disposant d’un ticket remis pour un achat éligible supérieur à 49 € dans une
              boutique participante. La participation nécessite un compte et la saisie du code unique à 10 caractères
              figurant sur le ticket de caisse ou la facture. Un code ne peut être utilisé qu’une seule fois.
            </p>

            <h3>Attribution des gains</h3>
            <p>
              Le jeu est 100 % gagnant, dans la limite de 500 000 tickets. Les codes sont générés avant le lancement
              afin de respecter la répartition annoncée :
            </p>
            <ul className="ttt-legal-prizes">
              {PRIZES.map(([percentage, prize]) => (
                <li key={percentage}><strong>{percentage}</strong><span>{prize}</span></li>
              ))}
            </ul>

            <h3>Réclamation et remise des gains</h3>
            <p>
              Le résultat est affiché après validation du code et enregistré dans l’espace personnel. Le participant
              dispose de 30 jours après la fin du jeu pour retirer son gain, selon les modalités communiquées par Thé
              Tip Top. Toute demande doit être adressée à <a href="mailto:contact@thetiptop.fr">contact@thetiptop.fr</a>
              avec les éléments permettant d’identifier le compte et le ticket, sans communiquer de mot de passe.
            </p>

            <h3>Tirage au sort final</h3>
            <p>
              À l’issue du jeu, un tirage au sort désigne le gagnant d’un an de thé, d’une valeur de 360 €. Chaque
              participant éligible dispose des mêmes chances, indépendamment de son nombre de participations. Le
              gagnant sera contacté avec les modalités de remise du lot.
            </p>

            <h3>Fraude, annulation et responsabilité</h3>
            <p>
              Tout code falsifié, déjà utilisé ou obtenu frauduleusement est refusé. L’organisateur peut écarter une
              participation irrégulière et adapter, reporter ou annuler le jeu si des circonstances indépendantes de
              sa volonté l’exigent, en informant les participants par un moyen approprié.
            </p>
          </section>

          <section aria-labelledby="lg-rgpd">
            <h2 id="lg-rgpd">Données personnelles et confidentialité</h2>
            <h3>Responsable, données et finalités</h3>
            <p>
              Thé Tip Top est responsable des traitements liés au site. Les données de compte et de participation
              (nom, prénom, adresse e-mail, date de naissance lorsque renseignée, identifiants techniques, tickets,
              gains et historique) servent à créer et sécuriser le compte, administrer le jeu, attribuer et remettre
              les gains, répondre aux demandes et prévenir la fraude. Les communications commerciales ne sont
              envoyées qu’avec un consentement préalable.
            </p>

            <h3>Bases légales, destinataires et conservation</h3>
            <p>
              Les traitements reposent, selon leur finalité, sur l’exécution du service demandé, le respect
              d’obligations légales, l’intérêt légitime de sécurisation ou le consentement. Les données sont réservées
              aux personnes habilitées de Thé Tip Top et à ses prestataires techniques strictement nécessaires. Elles
              sont conservées pendant la durée utile au jeu et aux obligations applicables ; les données de
              prospection sont conservées au maximum trois ans après le dernier contact.
            </p>

            <h3>Vos droits</h3>
            <p>
              Vous pouvez demander l’accès, la rectification, l’effacement ou la portabilité de vos données, ainsi que
              la limitation d’un traitement ou vous y opposer. Vous pouvez retirer votre consentement à tout moment,
              sans remettre en cause les traitements déjà réalisés. Exercez ces droits depuis votre espace personnel
              ou à <a href="mailto:contact@thetiptop.fr">contact@thetiptop.fr</a>. Une preuve d’identité peut être
              demandée en cas de doute raisonnable. Vous pouvez également saisir la{' '}
              <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noreferrer">CNIL</a>.
            </p>
          </section>

          <section aria-labelledby="lg-cookies">
            <h2 id="lg-cookies">Cookies et mesure d’audience</h2>
            <h3>Choix proposés</h3>
            <p>
              Les éléments strictement nécessaires au fonctionnement, à la sécurité et à la mémorisation de vos choix
              sont actifs sans consentement. Les catégories facultatives « mesure d’audience » et « marketing » sont
              désactivées par défaut. Vous pouvez les accepter, les refuser ou les sélectionner séparément ; refuser
              n’empêche pas d’accéder au site.
            </p>

            <h3>Google Analytics</h3>
            <p>
              Le site utilise Google Analytics 4, un service fourni par Google, pour produire des statistiques de
              fréquentation, comprendre les parcours de navigation et améliorer les performances du service. Google
              traite les données techniques nécessaires au fonctionnement de cet outil selon ses propres garanties et
              règles de confidentialité. Le service Analytics reste bloqué tant que vous n’avez pas accepté la
              catégorie « mesure d’audience ».
            </p>
            <p>
              Google Analytics peut notamment traiter un identifiant de navigateur, les pages consultées, la durée de
              session, le type d’appareil et une localisation approximative. Les cookies <code>_ga</code> et
              <code> _ga_&lt;identifiant&gt;</code> peuvent être conservés jusqu’à deux ans. Pour connaître la manière dont
              Google protège et utilise les données, consultez les{' '}
              <a href="https://support.google.com/analytics/answer/6004245?hl=fr" target="_blank" rel="noreferrer">
                informations de confidentialité de Google Analytics
              </a>{' '}
              et la{' '}
              <a href="https://policies.google.com/privacy?hl=fr" target="_blank" rel="noreferrer">
                politique de confidentialité de Google
              </a>.
            </p>

            <h3>Durée et modification du consentement</h3>
            <p>
              Votre choix est mémorisé dans le stockage local du navigateur pendant six mois au maximum, puis il vous
              est demandé à nouveau. Vous pouvez le modifier ou le retirer à tout moment, avec la même simplicité que
              lors de votre premier choix.
            </p>
            <button type="button" className="btn btn-sm btn-outline-green" onClick={openCookiePreferences}>
              Modifier mes choix de cookies
            </button>
          </section>
        </article>
      </div>
    </section>
  );
}
