# Furious Duck

Application web composee de deux services :

- **Backend** : API Node.js avec Express
- **Frontend** : application React avec Vite

Le projet peut etre lance avec Docker Compose ou directement avec npm en mode developpement.

## Sommaire

- [Prerequis](#prerequis)
- [Structure du projet](#structure-du-projet)
- [Configuration](#configuration)
- [Base de donnees](#base-de-donnees)
- [Lancement avec Docker](#lancement-avec-docker)
- [Lancement sans Docker](#lancement-sans-docker)
- [URLs de test](#urls-de-test)
- [API Authentification](#api-authentification)
- [API Profil](#api-profil)
- [Commandes utiles](#commandes-utiles)
- [Depannage](#depannage)

## Prerequis

Avant de lancer le projet, installer :

- Node.js
- npm
- Docker Desktop

Verifier que Docker Desktop est demarre avant d'utiliser les commandes Docker Compose.

## Structure du projet

```text
furious-duck/
|-- backend/
|   |-- server.js
|   |-- package.json
|   |-- Dockerfile
|   `-- .env
|-- frontend/
|   |-- src/
|   |-- package.json
|   `-- Dockerfile
|-- docker-compose.yml
|-- docker-compose.dev.yml
|-- docker-compose.preprod.yml
|-- docker-compose.prod.yml
`-- README.md
```

## Configuration

Le backend utilise des variables d'environnement pour se connecter a PostgreSQL et pour signer les jetons d'authentification.

Creer un fichier `backend/.env` avec le contenu suivant :

```env
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
RESET_TOKEN_EXPIRES_IN_MINUTES=60
```

Detail des variables :

- `JWT_SECRET` : cle utilisee pour signer les jetons. Sans elle, l'API renvoie une erreur 500 sur toutes les routes d'authentification.
- `JWT_EXPIRES_IN` : duree de validite d'un jeton de connexion. Valeur par defaut `1d`.
- `RESET_TOKEN_EXPIRES_IN_MINUTES` : duree de validite d'un lien de reinitialisation de mot de passe. Valeur par defaut `60`.

Le fichier `.env` ne doit pas etre versionne. Il contient des informations sensibles.

Le fichier `backend/.env.example` liste les variables attendues et peut servir de modele.

## Base de donnees

Le fichier `backend/database/schema.sql` contient toutes les tables du projet.

Il doit etre rejoue apres avoir recupere la fonctionnalite de reinitialisation de mot de passe : celle-ci ajoute deux colonnes a la table `utilisateurs`.

```bash
psql "postgresql://USER:PASSWORD@HOST/DATABASE" -f backend/database/schema.sql
```

Le script utilise `CREATE TABLE IF NOT EXISTS` et `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Il peut donc etre rejoue sur une base existante sans supprimer de donnees.

Si cette etape est oubliee, l'API repond avec une erreur du type :

```text
column "reset_token_hash" does not exist
```

## Lancement avec Docker

Depuis la racine du projet :

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Cette commande :

- construit les images Docker du backend et du frontend ;
- installe les dependances dans les conteneurs ;
- lance le backend en mode developpement avec `nodemon` ;
- lance le frontend Vite en mode developpement ;
- expose le backend sur le port `5000` ;
- expose le frontend sur le port `5173`.

Pour arreter les conteneurs :

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

Pour arreter les conteneurs et supprimer les volumes Docker, notamment les volumes `node_modules` :

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

Cette commande est utile si Docker garde d'anciennes dependances.

## Lancement sans Docker

### Backend

Depuis le dossier `backend` :

```bash
npm install
npm run dev
```

Le backend demarre sur :

```text
http://localhost:5000
```

### Frontend

Depuis le dossier `frontend` :

```bash
npm install
npm run dev
```

Le frontend demarre sur :

```text
http://localhost:5173
```

## URLs de test

### Backend

Verifier que l'API repond :

```text
http://localhost:5000/api/health
```

Reponse attendue :

```json
{
  "status": "ok"
}
```

### Base de donnees

Verifier la connexion PostgreSQL :

```text
http://localhost:5000/api/db/health
```

Reponse attendue si la base de donnees est accessible :

```json
{
  "status": "ok",
  "databaseTime": "2026-06-27T..."
}
```

### Frontend

Ouvrir l'application :

```text
http://localhost:5173
```

## API Authentification

Base : `/api/auth`. Ces routes sont publiques, elles ne demandent pas de jeton.

### Creer un compte

```text
POST /api/auth/register
```

```json
{
  "nom": "Dupont",
  "prenom": "Marie",
  "email": "marie@example.com",
  "mot_de_passe": "motdepasse123",
  "role_id": 1,
  "boutique_id": 1
}
```

Renvoie l'utilisateur cree et un jeton JWT. Le mot de passe doit contenir au moins 8 caracteres.

### Se connecter

```text
POST /api/auth/login
```

```json
{
  "email": "marie@example.com",
  "mot_de_passe": "motdepasse123"
}
```

Renvoie l'utilisateur et un jeton JWT.

### Demander une reinitialisation de mot de passe

```text
POST /api/auth/forgot-password
```

```json
{
  "email": "marie@example.com"
}
```

La reponse est toujours la meme, que le compte existe ou non. C'est volontaire : cela empeche de decouvrir quelles adresses sont inscrites en les testant une par une.

```json
{
  "status": "success",
  "message": "if the account exists, a reset link has been sent"
}
```

L'envoi d'email n'est pas encore branche. En dehors de la production, le jeton est affiche dans les logs du serveur backend :

```text
[reset] token for marie@example.com: 3f2a9c...
```

### Reinitialiser le mot de passe

```text
POST /api/auth/reset-password
```

```json
{
  "token": "3f2a9c...",
  "mot_de_passe": "nouveaumotdepasse"
}
```

Le jeton est valable pendant la duree definie par `RESET_TOKEN_EXPIRES_IN_MINUTES` et ne peut servir qu'une seule fois : il est efface des que le mot de passe change.

Seule l'empreinte du jeton est stockee en base, jamais le jeton lui-meme.

## API Profil

Base : `/api/users`. Toutes ces routes exigent un jeton valide dans l'en-tete :

```text
Authorization: Bearer VOTRE_JETON
```

L'utilisateur modifie est toujours celui du jeton. Aucun identifiant n'est lu depuis le corps de la requete.

### Consulter son profil

```text
GET /api/users/me
```

Renvoie l'utilisateur connecte, sans son mot de passe.

### Modifier son profil

```text
PATCH /api/users/me
```

```json
{
  "nom": "Dupont",
  "prenom": "Marie",
  "email": "marie.dupont@example.com",
  "date_de_naissance": "1999-05-12",
  "sexe": "F"
}
```

Tous les champs sont optionnels : seuls ceux envoyes sont modifies.

Seuls ces cinq champs sont modifiables. `role_id`, `boutique_id` et `statut` sont volontairement exclus, pour qu'un utilisateur ne puisse pas changer lui-meme ses droits. Envoyer un champ non autorise renvoie une erreur 400 :

```json
{
  "status": "error",
  "message": "these fields cannot be updated: role_id"
}
```

Si l'email est deja utilise par un autre compte, l'API renvoie une erreur 409.

### Changer son mot de passe

```text
PATCH /api/users/me/password
```

```json
{
  "mot_de_passe_actuel": "motdepasse123",
  "mot_de_passe": "nouveaumotdepasse"
}
```

Le mot de passe actuel est exige en plus du jeton. Un jeton vole ne suffit donc pas pour prendre le controle d'un compte.

## Commandes utiles

### Docker

Lancer le projet en developpement :

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Arreter le projet :

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

Arreter le projet et supprimer les volumes :

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

Afficher la configuration Docker Compose finale :

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml config
```

### Backend

```bash
cd backend
npm install
npm run dev
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
npm run build
npm run lint
```

## CI/CD Jenkins

Le depot contient un `Jenkinsfile` a la racine pour lancer une premiere pipeline CI compatible avec l'organisation actuelle du projet.

Jenkins est lance avec Docker via une image personnalisee qui contient :

- Node.js et npm ;
- Git ;
- Docker CLI ;
- Docker Compose.

### Lancer Jenkins avec Docker

Depuis la racine du projet :

```bash
docker compose -f docker-compose.jenkins.yml up -d --build
```

Ouvrir ensuite :

```text
http://localhost:8080
```

Recuperer le mot de passe initial :

```bash
docker compose -f docker-compose.jenkins.yml exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Installer les plugins suggeres, puis creer le compte administrateur Jenkins.

Si un ancien conteneur Jenkins existe deja avec le nom `jenkins`, l'arreter avant d'utiliser cette configuration :

```bash
docker stop jenkins
docker rm jenkins
```

### Verifier Jenkins et Docker

Verifier que Jenkins tourne :

```bash
docker compose -f docker-compose.jenkins.yml ps
```

Verifier que Jenkins a acces aux outils necessaires :

```bash
docker compose -f docker-compose.jenkins.yml exec jenkins sh -lc "node --version && npm --version && docker --version && docker compose version"
```

Si ces commandes affichent les versions, Jenkins peut lancer la pipeline du projet.

### Pipeline

La pipeline execute :

- installation des dependances backend avec `npm ci` ;
- verification syntaxique des fichiers JavaScript backend ;
- installation des dependances frontend avec `npm ci` ;
- lint frontend ;
- build frontend ;
- build des images Docker backend et frontend ;
- health checks Docker Compose optionnels.

Les health checks Docker Compose utilisent les fichiers existants :

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Comme PostgreSQL n'est pas lance par Docker Compose, Jenkins doit recevoir la connexion a la base via ses credentials.

Creer ces credentials Jenkins de type `Secret text` :

```text
furious-duck-database-url
furious-duck-jwt-secret
```

La variable `JWT_EXPIRES_IN` est definie a `1d` dans la pipeline.

Par defaut, les health checks Docker Compose se lancent sur les branches `DEV` et `main`. Sur une branche de fonctionnalite, ils peuvent etre lances manuellement en cochant le parametre Jenkins :

```text
RUN_DOCKER_COMPOSE_TESTS
```

Convention de branches recommandee :

```text
feature/nom-fonctionnalite -> DEV -> main
```

Pour arreter Jenkins :

```bash
docker compose -f docker-compose.jenkins.yml down
```

## Depannage

### `Cannot find module 'dotenv'`

Ce probleme arrive si les dependances du backend ne sont pas installees ou si Docker reutilise un ancien volume `node_modules`.

Solution avec Docker :

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Solution sans Docker :

```bash
cd backend
npm install
npm run dev
```

### `Cannot GET /api/db/health`

Cette erreur signifie que la route n'est pas exposee par le backend en cours d'execution.

Verifier que :

- le fichier `backend/server.js` contient bien la route `/api/db/health` ;
- le serveur backend a ete redemarre ;
- le navigateur pointe vers `http://localhost:5000/api/db/health`.

### `DATABASE_URL is not configured`

Cette erreur signifie que le backend ne trouve pas la variable `DATABASE_URL`.

Verifier que :

- le fichier `backend/.env` existe ;
- `DATABASE_URL` est bien renseignee ;
- Docker utilise bien `docker-compose.dev.yml`, qui charge `backend/.env`.

### Probleme d'acces Docker sur Windows

Si Docker affiche une erreur du type :

```text
Access is denied
```

Verifier que :

- Docker Desktop est demarre ;
- le terminal a les droits necessaires ;
- le fichier de configuration Docker dans le profil utilisateur est accessible.

## Production

Le fichier `docker-compose.prod.yml` est prevu pour une configuration de production, mais il doit etre complete selon l'environnement cible :

- variables d'environnement ;
- build frontend ;
- reverse proxy eventuel ;
- gestion des secrets ;
- strategie de deploiement.
