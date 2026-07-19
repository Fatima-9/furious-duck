# Furious Duck

Application web composee de deux services :

- **Backend** : API Node.js avec Express
- **Frontend** : application React avec Vite

Le projet peut etre lance avec Docker Compose ou directement avec npm en mode developpement.

## Sommaire

- [Prerequis](#prerequis)
- [Structure du projet](#structure-du-projet)
- [Configuration](#configuration)
- [Lancement avec Docker](#lancement-avec-docker)
- [Lancement sans Docker](#lancement-sans-docker)
- [URLs de test](#urls-de-test)
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

Le backend utilise une variable d'environnement pour se connecter a PostgreSQL.

Creer un fichier `backend/.env` avec le contenu suivant :

```env
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

Le fichier `.env` ne doit pas etre versionne. Il contient des informations sensibles.

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
