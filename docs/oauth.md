# Authentification Google/Facebook

Cette branche ajoute une route backend commune pour l'inscription et la connexion avec Google ou Facebook :

```text
POST /api/auth/oauth
```

Le frontend doit recuperer un token chez Google ou Facebook, puis l'envoyer au backend :

```json
{
  "provider": "google",
  "token": "token-google-ou-facebook"
}
```

Pour Google, le token attendu est un `id_token`.

Pour Facebook, le token attendu est un `access_token`.

## Variables backend

Dans `backend/.env`, ajouter :

```env
DEFAULT_USER_ROLE_ID=1
DEFAULT_BOUTIQUE_ID=1
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
FACEBOOK_APP_ID=your-facebook-app-id
```

`DEFAULT_USER_ROLE_ID` et `DEFAULT_BOUTIQUE_ID` doivent correspondre a des lignes existantes dans la base de donnees.

## Variables frontend

Dans `frontend/.env`, ajouter :

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_FACEBOOK_APP_ID=your-facebook-app-id
```

## Base de donnees

Rejouer le fichier SQL apres avoir recupere cette branche :

```bash
psql "postgresql://USER:PASSWORD@HOST/DATABASE" -f backend/database/schema.sql
```

Cela ajoute les colonnes `oauth_provider` et `oauth_subject` sur `utilisateurs`.

## Docker

Docker utilise les variables de `backend/.env` avec :

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

## Kubernetes local

Copier `k8s/secret.example.yaml` vers `k8s/secret.yaml`, remplir les valeurs, puis appliquer les fichiers Kubernetes comme indique dans `k8s/README.md`.
