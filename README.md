# Furious Duck - The Tip Top

Application web du jeu-concours The Tip Top.

Le projet contient :

- un frontend React / Vite ;
- un backend Node.js / Express ;
- une base PostgreSQL externe ;
- une configuration Docker ;
- Traefik pour le HTTPS et le reverse proxy ;
- Jenkins pour la CI/CD ;
- Prometheus et Grafana pour la supervision.

## Prerequis

- Node.js 22
- npm
- Docker
- Docker Compose
- Acces a une base PostgreSQL

## Structure principale

```text
furious-duck/
|-- backend/
|-- frontend/
|-- monitoring/
|-- docker-compose.yml
|-- docker-compose.dev.yml
|-- docker-compose.dev.live.yml
|-- docker-compose.ci.yml
|-- docker-compose.jenkins.yml
|-- docker-compose.monitoring.yml
|-- docker-compose.traefik.yml
|-- Jenkinsfile
`-- README.md
```

## Variables d'environnement

### Backend

Creer `backend/.env` :

```env
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
RESET_TOKEN_EXPIRES_IN_MINUTES=60
DEFAULT_USER_ROLE_ID=1
DEFAULT_BOUTIQUE_ID=1
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
FACEBOOK_APP_ID=your-facebook-app-id
APP_URL=http://localhost:5173
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=The Tip Top <no-reply@thetiptop.fr>
TURNSTILE_SECRET_KEY=cloudflare-turnstile-secret-key
```

Variables importantes :

- `DATABASE_URL` : connexion PostgreSQL.
- `JWT_SECRET` : cle de signature des tokens de connexion.
- `APP_URL` : URL publique du frontend, utilisee dans les emails de reset password.
- `SMTP_*` : configuration d'envoi des emails.
- `TURNSTILE_SECRET_KEY` : cle secrete Cloudflare Turnstile verifiee par le backend.

### Frontend

Creer `frontend/.env` :

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_FACEBOOK_APP_ID=your-facebook-app-id
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_TURNSTILE_SITE_KEY=cloudflare-turnstile-site-key
```

Variables importantes :

- `VITE_API_URL` : URL de l'API. En deploiement derriere Traefik, elle peut rester vide pour utiliser `/api`.
- `VITE_GA_MEASUREMENT_ID` : identifiant Google Analytics.
- `VITE_TURNSTILE_SITE_KEY` : cle publique Cloudflare Turnstile affichee dans le navigateur.

## Base de donnees

Le schema est dans :

```text
backend/database/schema.sql
```

Pour l'appliquer :

```bash
psql "postgresql://USER:PASSWORD@HOST/DATABASE" -f backend/database/schema.sql
```

Le script utilise `CREATE TABLE IF NOT EXISTS` et `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, donc il peut etre rejoue sans supprimer les donnees.

## Lancement local sans Docker

Backend :

```bash
cd backend
npm install
npm run dev
```

Frontend :

```bash
cd frontend
npm install
npm run dev
```

URLs locales :

```text
http://localhost:5173
http://localhost:5000/api/health
http://localhost:5000/api/db/health
```

## Lancement Docker local

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Arret :

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

Arret avec suppression des volumes :

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

## Deploiement live DEV / PREPROD

Le deploiement public utilise :

- Traefik en reverse proxy HTTPS ;
- le backend sur le port interne `5000` ;
- le frontend servi en statique par Nginx dans `frontend/Dockerfile.live` ;
- Prometheus et Grafana via `docker-compose.monitoring.yml`.

Commande type :

```bash
docker compose -p furious-duck-preprod-live \
  -f docker-compose.yml \
  -f docker-compose.dev.live.yml \
  -f docker-compose.monitoring.yml \
  up -d --build --scale backend=2 --scale frontend=2
```

## URLs utiles

DEV :

```text
https://dev.dsp5-archi-o24a-g2.fr
https://dev.dsp5-archi-o24a-g2.com
https://dev.dsp5-archi-o24a-g2.fr/api/health
https://dev.dsp5-archi-o24a-g2.fr/jenkins/
https://dev.dsp5-archi-o24a-g2.fr/prometheus/
https://dev.dsp5-archi-o24a-g2.fr/grafana/
https://dev.dsp5-archi-o24a-g2.fr/traefik/dashboard/
```

PREPROD :

```text
https://preprod.dsp5-archi-o24a-g2.fr
https://preprod.dsp5-archi-o24a-g2.com
https://preprod.dsp5-archi-o24a-g2.fr/api/health
https://preprod.dsp5-archi-o24a-g2.fr/jenkins/
https://preprod.dsp5-archi-o24a-g2.fr/prometheus/
https://preprod.dsp5-archi-o24a-g2.fr/grafana/
https://preprod.dsp5-archi-o24a-g2.fr/traefik/dashboard/
```

## Fonctionnalites principales

### Authentification

- Creation de compte.
- Connexion email / mot de passe.
- Connexion Google.
- Connexion Facebook.
- Mot de passe oublie.
- Reset password par lien email.

Le lien de reset password est construit avec `APP_URL`. Il pointe vers :

```text
/reset-password?token=...
```

### Captcha Turnstile

Cloudflare Turnstile est present sur :

- connexion ;
- creation de compte ;
- contact.

Le frontend affiche le widget avec `VITE_TURNSTILE_SITE_KEY`.
Le backend verifie le token avec `TURNSTILE_SECRET_KEY`.

Turnstile ne demande pas toujours un defi visible. Il analyse plusieurs signaux automatiquement. Le domaine autorise dans Cloudflare sert seulement a proteger la cle du widget, ce n'est pas le seul controle anti-bot.

### Age minimum

La creation de compte impose un age minimum de 18 ans.

Le controle est fait cote backend pour eviter le contournement depuis le navigateur.

### Profil utilisateur

L'utilisateur connecte peut :

- consulter son profil ;
- modifier ses informations ;
- changer son mot de passe ;
- supprimer son compte.

La suppression du compte est definitive en base. Avant la suppression, les tickets lies a l'utilisateur sont detaches pour eviter les erreurs de contrainte SQL.

Un compte admin ne peut pas etre supprime.

### Jeu concours

Le jeu concours :

- commence le 1 septembre 2026 ;
- dure 30 jours ;
- laisse 30 jours supplementaires pour reclamer un lot ;
- est 100 % gagnant ;
- inclut un gros lot : 1 an de the, valeur 360 euros ;
- concerne 10 boutiques.

Les regles du jeu sont integrees dans la page Concept.

### Newsletter

La newsletter permet a un visiteur de laisser son email depuis le footer.

Concretement :

1. le frontend envoie l'email a l'API `/api/newsletter` ;
2. le backend valide le format de l'email ;
3. le backend envoie un email de notification a l'adresse configuree dans `SMTP_FROM` ;
4. l'utilisateur voit un message de confirmation.

Actuellement, la newsletter ne stocke pas encore les emails en base. Elle sert de formulaire d'inscription/notification par email. Si on veut faire une vraie liste marketing exploitable, il faudra ajouter une table `newsletter_subscribers` ou brancher un outil externe.

### Contact

Le formulaire contact :

- valide les champs ;
- exige Turnstile ;
- envoie une notification email via SMTP.

### SEO

Ajouts :

- `robots.txt` ;
- `sitemap.xml` ;
- page Plan du site ;
- page 404 ;
- page 500 ;
- favicon ;
- title et meta descriptions.

## Tests et coverage

Commandes :

```bash
npm --prefix backend test
```

```bash
COVERAGE_MIN=60 npm --prefix backend run test:coverage
COVERAGE_MIN=80 npm --prefix backend run test:coverage
COVERAGE_MIN=100 npm --prefix backend run test:coverage
```

Etat actuel :

- 36 suites de tests passent ;
- 200 tests passent ;
- coverage lignes backend : 100 %.

La pipeline controle actuellement la couverture des lignes.

Seuils Jenkins :

- DEV : validation a partir de 60 % ;
- PREPROD : validation a partir de 80 % ;
- PROD / main : validation a partir de 100 %.

## Jenkins

La pipeline est dans :

```text
Jenkinsfile
```

Ordre de la pipeline :

1. checkout du code ;
2. detection de l'environnement selon la branche ;
3. installation des dependances backend et frontend ;
4. controles qualite ;
5. tests et coverage ;
6. build frontend ;
7. build des images Docker ;
8. sauvegarde des images Docker avec `docker save` ;
9. tests fonctionnels Docker Compose ;
10. deploiement DEV ou PREPROD.

Credentials Jenkins necessaires :

```text
furious-duck-database-url
furious-duck-jwt-secret
furious-duck-turnstile-site-key
furious-duck-turnstile-secret-key
```

## Monitoring

Prometheus :

```text
/prometheus/
```

Grafana :

```text
/grafana/
```

Traefik dashboard :

```text
/traefik/dashboard/
```

## Fichiers importants

- `docker-compose.yml` : base commune backend/frontend.
- `docker-compose.dev.yml` : mode developpement local.
- `docker-compose.dev.live.yml` : mode live DEV/PREPROD derriere Traefik.
- `docker-compose.ci.yml` : configuration utilisee par Jenkins pour les tests fonctionnels.
- `docker-compose.jenkins.yml` : lancement Jenkins.
- `docker-compose.monitoring.yml` : Prometheus et Grafana.
- `docker-compose.traefik.yml` : reverse proxy HTTPS Traefik.
- `backend/Dockerfile.live` : image backend de deploiement.
- `frontend/Dockerfile.live` : build frontend puis service statique via Nginx.
- `frontend/nginx.conf` : configuration Nginx pour l'application React.
- `monitoring/prometheus/prometheus.yml` : configuration des targets Prometheus.
- `Jenkinsfile` : pipeline CI/CD.

## Depannage

### Page introuvable apres reset password

Verifier `APP_URL` dans `backend/.env`.

Les deux formats sont acceptes :

```env
APP_URL=http://localhost:5173
APP_URL=http://localhost:5173/
```

Le backend normalise le lien pour eviter `//reset-password`.

### Turnstile ne s'affiche pas en local

Dans Cloudflare Turnstile, ajouter les domaines :

```text
localhost
127.0.0.1
dev.dsp5-archi-o24a-g2.fr
dev.dsp5-archi-o24a-g2.com
preprod.dsp5-archi-o24a-g2.fr
preprod.dsp5-archi-o24a-g2.com
```

### DATABASE_URL is not configured

Verifier :

- `backend/.env` existe ;
- `DATABASE_URL` est renseignee ;
- Jenkins contient le credential `furious-duck-database-url`.

### Prometheus affiche une page blanche

Verifier que le conteneur Prometheus a bien acces a :

```text
monitoring/prometheus/prometheus.yml
```

Verifier aussi :

```bash
curl -s https://preprod.dsp5-archi-o24a-g2.fr/prometheus/-/ready
```

Reponse attendue :

```text
Prometheus Server is Ready.
```
