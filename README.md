
##  1. Création du projet


mkdir furious-duck


Créer le dossier principal du projet


cd furious-duck


Entrer dans le projet


mkdir backend frontend


Créer les dossiers backend (API) et frontend (React)

---

## ⚙️ 2. Backend (Node + Express)


cd backend


Aller dans le dossier backend


npm init -y


Initialiser le projet Node (package.json)


npm install express cors


Installer Express (serveur) et CORS (autoriser les requêtes frontend)


npm install -D nodemon


Installer nodemon pour recharger le serveur automatiquement


npm install dotenv


Permet d’utiliser les variables d’environnement (.env)


New-Item server.js


Créer le fichier principal du serveur


New-Item Dockerfile, .dockerignore


Créer les fichiers Docker pour le backend


cd ..


---

##  3. Frontend (React + Vite)


cd frontend



npm create vite@latest . -- --template react


Créer une application React avec Vite

Choisir :

* React
* JavaScript


npm install


Installer les dépendances frontend


New-Item Dockerfile, .dockerignore


Créer les fichiers Docker pour le frontend


cd ..


---

## 4. Docker


New-Item docker-compose.yml


Créer le fichier pour orchestrer backend + frontend

---

## 5. Lancer le projet


docker compose up --build


Build et démarre les conteneurs

---

## 6. Arrêter le projet


docker compose stop


Arrête les conteneurs sans les supprimer

ou :


Ctrl + C


Arrêt rapide dans le terminal

---

## 7. Redémarrer


docker compose start


Relancer les conteneurs existants

---

##  8. Vérifier

Frontend :

txt
http://localhost:5173


Backend :

txt
http://localhost:5000/api/health


---

##  9. Lancer sans Docker (mode dev)

### Backend


cd backend
npm install
npm run dev


### Frontend


cd frontend
npm install
npm run dev


---

## 10. Build production frontend


cd frontend
npm run build


Génère le dossier `dist/` optimisé pour la production

---

## Résumé

* Créer projet → `mkdir`, `npm init`, `vite`
* Installer dépendances → `npm install`
* Docker → `docker compose up`
* Stop → `docker compose stop`
* Restart → `docker compose start`

---
