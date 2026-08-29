const nodemailer = require("nodemailer");

const APP_URL = process.env.APP_URL || "http://localhost:5173";
const FROM = process.env.SMTP_FROM || "The Tip Top <no-reply@thetiptop.fr>";

let transporter = null;

// Cree (une seule fois) le transport SMTP a partir des variables d'environnement.
// Si SMTP_HOST n'est pas defini, on renvoie null : on est alors en mode
// developpement et les emails sont simplement affiches dans les logs.
function getTransporter() {
  if (!process.env.SMTP_HOST) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }

  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const tx = getTransporter();

  if (!tx) {
    // Mode dev : pas de SMTP configure. On logue au lieu d'envoyer, pour que
    // la fonctionnalite reste utilisable sans compte email.
    console.log(`[email:dev] To: ${to} | Sujet: ${subject}\n${text}`);
    return { sent: false, dev: true };
  }

  await tx.sendMail({ from: FROM, to, subject, text, html });
  return { sent: true, dev: false };
}

// --- Generateurs de contenu (purs, donc facilement testables) ---

function buildAppLink(path) {
  return `${APP_URL.replace(/\/+$/, "")}${path}`;
}

function buildPasswordResetContent(resetToken) {
  const link = buildAppLink(`/reset-password?token=${encodeURIComponent(resetToken)}`);
  const subject = "Reinitialisation de votre mot de passe";
  const text = `Bonjour,

Vous avez demande la reinitialisation de votre mot de passe The Tip Top.
Cliquez sur ce lien pour choisir un nouveau mot de passe :

${link}

Ce lien est valable une heure et ne peut servir qu'une seule fois.
Si vous n'etes pas a l'origine de cette demande, ignorez cet email.

L'equipe The Tip Top`;
  const html = `<p>Bonjour,</p>
<p>Vous avez demande la reinitialisation de votre mot de passe The Tip Top.</p>
<p><a href="${link}">Choisir un nouveau mot de passe</a></p>
<p>Ce lien est valable une heure et ne peut servir qu'une seule fois. Si vous n'etes pas a l'origine de cette demande, ignorez cet email.</p>
<p>L'equipe The Tip Top</p>`;

  return { subject, text, html, link };
}

function buildPasswordChangedContent() {
  const subject = "Votre mot de passe a ete modifie";
  const text = `Bonjour,

Nous vous confirmons que le mot de passe de votre compte The Tip Top vient d'etre modifie.

Si vous n'etes pas a l'origine de ce changement, contactez-nous immediatement et securisez votre compte.

L'equipe The Tip Top`;
  const html = `<p>Bonjour,</p>
<p>Nous vous confirmons que le mot de passe de votre compte The Tip Top vient d'etre modifie.</p>
<p>Si vous n'etes pas a l'origine de ce changement, contactez-nous immediatement et securisez votre compte.</p>
<p>L'equipe The Tip Top</p>`;

  return { subject, text, html };
}

// --- Envois de haut niveau ---

async function sendPasswordResetEmail(to, resetToken) {
  const { subject, text, html } = buildPasswordResetContent(resetToken);
  return sendMail({ to, subject, text, html });
}

async function sendPasswordChangedEmail(to) {
  const { subject, text, html } = buildPasswordChangedContent();
  return sendMail({ to, subject, text, html });
}

module.exports = {
  sendMail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  buildPasswordResetContent,
  buildPasswordChangedContent,
  buildAppLink,
};
