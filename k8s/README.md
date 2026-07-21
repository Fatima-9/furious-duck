# Kubernetes

Ce dossier contient une premiere configuration Kubernetes pour lancer le projet
Furious Duck avec deux services :

- `backend` : API Express sur le port 5000
- `frontend` : application React/Vite sur le port 5173

La base PostgreSQL Neon reste externe a Kubernetes. On donne donc son URL au
backend avec un Secret Kubernetes.

## 1. Preparer les images Docker

Kubernetes ne construit pas le code tout seul. Il lance des images Docker.

Avant de lancer Kubernetes, active-le dans Docker Desktop :

1. Ouvre Docker Desktop.
2. Va dans `Settings`.
3. Va dans `Kubernetes`.
4. Coche `Enable Kubernetes`.
5. Clique sur `Apply & Restart`.
6. Attends que Docker indique que Kubernetes est pret.

Tu peux verifier avec :

```bash
kubectl config get-contexts
kubectl config use-context docker-desktop
kubectl get nodes
```

Ensuite, en local, avec Docker Desktop Kubernetes, construis les images :

```bash
docker build -t furious-duck-backend:local ./backend
docker build -t furious-duck-frontend:local ./frontend
```

Ces noms correspondent aux images utilisees dans les fichiers Kubernetes.

## 2. Creer le secret local

Copie le fichier d'exemple :

PowerShell :

```powershell
Copy-Item k8s/secret.example.yaml k8s/secret.yaml
```

Bash :

```bash
cp k8s/secret.example.yaml k8s/secret.yaml
```

Puis remplace les valeurs dans `k8s/secret.yaml`.

Important : `k8s/secret.yaml` ne doit pas etre envoye sur GitHub.

## 3. Lancer Kubernetes

Depuis la racine du projet :

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
```

Tu peux aussi tout relancer apres modification avec les memes commandes.

## 4. Verifier que tout tourne

```bash
kubectl get pods -n furious-duck
kubectl get services -n furious-duck
```

Les pods doivent etre en statut `Running`.

## 5. Ouvrir le projet en local

Le plus simple en local est d'utiliser `port-forward`.

Backend :

```bash
kubectl port-forward -n furious-duck service/backend-service 5000:5000
```

Puis tester :

```text
http://localhost:5000/api/health
http://localhost:5000/api/db/health
```

Frontend, dans un deuxieme terminal :

```bash
kubectl port-forward -n furious-duck service/frontend-service 5173:5173
```

Puis ouvrir :

```text
http://localhost:5173
```

## 6. Relancer apres modification du code

Si tu modifies le code, reconstruis les images :

```bash
docker build -t furious-duck-backend:local ./backend
docker build -t furious-duck-frontend:local ./frontend
```

Puis redemarre les deployments :

```bash
kubectl rollout restart deployment/backend -n furious-duck
kubectl rollout restart deployment/frontend -n furious-duck
```

## 7. Supprimer l'environnement Kubernetes

```bash
kubectl delete namespace furious-duck
```

Cela supprime les pods, services et secrets du projet dans Kubernetes.

## Notes importantes

- Cette configuration est faite pour apprendre et tester en local.
- En production, les images devraient etre poussees dans un registry Docker.
- En production, il faudrait aussi adapter les Dockerfiles pour ne pas lancer
  `npm run dev`, mais des commandes plus adaptees a la production.
- Le fichier `secret.yaml` est ignore par Git et doit rester local.
