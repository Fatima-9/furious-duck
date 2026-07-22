import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import Button from '../components/ui/Button';
import FaqItem from '../components/ui/FaqItem';

export default function Faq() {
  const navigate = useNavigate();

  return (
    <div>
      <section className="ttt-section ttt-section--tight" style={{ paddingTop: 60, paddingBottom: 30, textAlign: 'center' }}>
        <div className="ttt-eyebrow">Aide</div>
        <h1 style={{ fontWeight: 600, fontSize: 'clamp(34px,5vw,52px)', margin: '0 0 10px' }}>Questions fréquentes.</h1>
        <p style={{ margin: 0, fontSize: 16, color: 'var(--muted)' }}>Tout ce qu'il faut savoir avant de tourner la roue.</p>
      </section>
      <section className="ttt-section ttt-section--tight" style={{ paddingTop: 10, paddingBottom: 40 }}>
        <FaqItem question="Où puis-je trouver mon code de participation ?" defaultOpen>
          Votre code se trouve sur votre ticket de caisse en boutique, ou imprimé à l'intérieur du rabat de chaque
          boîte de thé Tip Top. Il comporte 8 caractères, au format TTT-XXXX-99.
        </FaqItem>
        <FaqItem question="Est-ce que je gagne à chaque fois ?">
          Oui — le jeu est 100 % gagnant. Chaque code valide donne droit à un lot, de l'infuseur de bienvenue jusqu'au
          grand prix « un an de thé offert ».
        </FaqItem>
        <FaqItem question="Comment récupérer mon lot ?">
          Après le tirage, un e-mail de confirmation vous est envoyé avec un code de retrait. Présentez-le en boutique
          ou optez pour la livraison à domicile. Vous avez 60 jours pour en profiter.
        </FaqItem>
        <FaqItem question="Puis-je participer plusieurs fois ?">
          Oui, autant de fois que vous avez de codes valides. Chaque code n'est utilisable qu'une seule fois.
        </FaqItem>
        <FaqItem question="Que deviennent mes données personnelles ?">
          Elles servent uniquement à gérer votre participation et l'envoi de vos lots. Conformément au RGPD, elles ne
          sont jamais revendues et vous pouvez les exporter ou les supprimer à tout moment depuis votre espace.
        </FaqItem>
        <div style={{ textAlign: 'center', marginTop: 30, padding: 26, background: 'var(--paper2)', borderRadius: 18 }}>
          <p style={{ margin: '0 0 14px', fontSize: 14.5, color: 'var(--ink-soft)' }}>Vous n'avez pas trouvé votre réponse ?</p>
          <Button variant="solid" onClick={() => navigate(ROUTES.contact)}>
            Contactez-nous
          </Button>
        </div>
      </section>
    </div>
  );
}
