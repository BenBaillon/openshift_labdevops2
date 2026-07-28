# Coffee Shop Frontend

Frontend web de l'application pédagogique **OpenShift Coffee Shop**.

Ce composant est utilisé dans le cadre d'une formation OpenShift débutant pour illustrer le cycle de vie d'une application frontend :

```text
Code Git
→ Dockerfile
→ Build OpenShift
→ Image
→ Deployment
→ Pod
→ Service
→ Route
→ ConfigMap
→ Communication avec un backend
→ Diagnostic navigateur
```

---

## 1. Rôle du frontend dans la formation

Le frontend représente l'interface utilisateur de l'application **OpenShift Coffee Shop**.

Il est volontairement simple afin de rester compréhensible pour des personnes découvrant OpenShift. Son objectif est de fournir un rendu visuel clair et de montrer comment une application web peut être déployée, exposée et configurée sur OpenShift.

Ce composant permet d'illustrer :

- le démarrage d'une application web dans un Pod ;
- l'exposition d'une application avec une Route ;
- la configuration via variable d'environnement ;
- l'utilisation d'une ConfigMap ;
- la communication avec un backend ;
- la distinction entre frontend et backend ;
- le diagnostic via navigateur et DevTools ;
- le scaling d'un composant frontend ;
- le rollout d'une nouvelle version du frontend ;
- le dépannage d'une mauvaise configuration backend.

---

## 2. Architecture

Le frontend est une application web simple servie par un serveur **Node.js / Express**.

Dans l'architecture globale, le frontend est le point d'entrée utilisateur :

```text
Utilisateur
   ↓
Route frontend
   ↓
Service frontend
   ↓
Pod frontend
   ↓
Backend API
```

Dans la première version pédagogique, le frontend appelle directement le backend via l'URL configurée dans la variable d'environnement :

```text
BACKEND_URL
```

Cette approche est volontairement simple pour rendre la communication frontend/backend visible dans les DevTools du navigateur.

Une évolution possible consiste à faire passer les appels backend par le serveur frontend, afin de garder le backend uniquement accessible dans le cluster via un Service interne OpenShift.

---

## 3. Structure du dossier frontend

```text
frontend/
│
├── README.md
├── Dockerfile
├── .dockerignore
├── package.json
├── package-lock.json
│
├── src/
│   └── server.js
│
└── public/
    ├── index.html
    ├── style.css
    └── app.js
```

---

## 4. Description des fichiers principaux

### `src/server.js`

Point d'entrée du frontend.

Responsabilités :

- démarrer le serveur Express ;
- servir les fichiers statiques du dossier `public/` ;
- exposer l'endpoint `/config` ;
- exposer les endpoints `/health` et `/ready` ;
- lire les variables d'environnement injectées localement ou par OpenShift.

---

### `public/index.html`

Page principale de l'application web.

Elle affiche :

- le titre de l'application ;
- la version du frontend ;
- l'environnement courant ;
- l'URL du backend configurée ;
- le statut du backend ;
- la version du backend ;
- le message retourné par le backend ;
- la liste des produits du Coffee Shop.

---

### `public/app.js`

Script JavaScript exécuté côté navigateur.

Responsabilités :

- charger la configuration du frontend via `/config` ;
- appeler le backend avec `BACKEND_URL` ;
- récupérer le statut du backend ;
- récupérer la version du backend ;
- récupérer la liste des produits ;
- afficher les erreurs de communication avec le backend.

---

### `public/style.css`

Feuille de style de l'application.

Elle fournit un rendu simple, lisible et agréable pour les démonstrations en formation.

---

## 5. Endpoints disponibles côté frontend

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Page principale du frontend |
| `GET` | `/config` | Configuration consommée par le navigateur |
| `GET` | `/health` | Vérifie si le frontend est vivant |
| `GET` | `/ready` | Vérifie si le frontend est prêt |

---

## 6. Appels réalisés vers le backend

Le frontend appelle les endpoints backend suivants :

```text
GET <BACKEND_URL>/health
GET <BACKEND_URL>/api/version
GET <BACKEND_URL>/api/products
```

Exemple en local :

```text
GET http://localhost:8080/health
GET http://localhost:8080/api/version
GET http://localhost:8080/api/products
```

Exemple dans OpenShift :

```text
GET http://<route-backend>/health
GET http://<route-backend>/api/version
GET http://<route-backend>/api/products
```

---

## 7. Variables d'environnement

| Variable | Description | Valeur par défaut |
|---|---|---|
| `PORT` | Port d'écoute HTTP du frontend | `3000` |
| `FRONTEND_VERSION` | Version affichée du frontend | `v1` |
| `APP_ENV` | Environnement d'exécution | `dev` |
| `BACKEND_URL` | URL utilisée pour joindre le backend | `http://localhost:8080` |

---

## 8. Exécution locale

### 8.1 Prérequis

Installer Node.js et npm.

Vérifier l'installation :

```bash
node -v
npm -v
```

---

### 8.2 Démarrer le backend

Le frontend dépend du backend. Il faut donc d'abord démarrer le backend.

Depuis le dossier `backend` :

```bash
cd backend
npm install
npm start
```

Le backend doit être accessible sur :

```text
http://localhost:8080
```

Tester rapidement :

```bash
curl http://localhost:8080/health
```

---

### 8.3 Installer les dépendances frontend

Dans un second terminal, depuis le dossier `frontend` :

```bash
cd frontend
npm install
```

---

### 8.4 Démarrer le frontend

```bash
npm start
```

Le frontend démarre par défaut sur :

```text
http://localhost:3000
```

Ouvrir dans le navigateur :

```text
http://localhost:3000
```

---

## 9. Exécution locale avec variables d'environnement

### Bash / Linux / macOS / Git Bash

```bash
BACKEND_URL=http://localhost:8080 \
FRONTEND_VERSION=v1 \
APP_ENV=local \
npm start
```

### PowerShell

```powershell
$env:BACKEND_URL="http://localhost:8080"
$env:FRONTEND_VERSION="v1"
$env:APP_ENV="local"
npm start
```

---

## 10. Vérification dans le navigateur

Une fois le frontend démarré, ouvrir :

```text
http://localhost:3000
```

La page doit afficher :

```text
Frontend : v1
Environnement : local ou dev
Backend URL : http://localhost:8080
Statut backend : OK
Version backend : v1
Produits : Espresso, Latte, Cappuccino, Mocha
```

---

## 11. Diagnostic avec DevTools

Le frontend est volontairement conçu pour être observable depuis les DevTools du navigateur.

Dans l'onglet **Network**, les appels suivants doivent être visibles :

```text
/config
http://localhost:8080/health
http://localhost:8080/api/version
http://localhost:8080/api/products
```

Dans OpenShift, les appels backend pointeront vers la Route backend configurée dans `BACKEND_URL`.

Exemples de problèmes observables :

- backend inaccessible ;
- mauvaise URL backend ;
- erreur CORS ;
- erreur HTTP côté backend ;
- route backend incorrecte ;
- backend en mode panne.

---

## 12. Dockerfile

Le frontend contient un `Dockerfile` permettant à OpenShift de construire une image depuis le code source.

Le Dockerfile réalise les étapes suivantes :

```text
Image de base Node.js
→ Création du répertoire de travail
→ Copie des fichiers package.json / package-lock.json
→ Installation des dépendances
→ Copie du code serveur
→ Copie des fichiers statiques
→ Définition des variables par défaut
→ Exposition du port 3000
→ Démarrage de l'application
```

Le build de l'image est principalement réalisé par OpenShift dans le cadre de la formation.

---

## 13. Déploiement OpenShift du frontend

Le frontend est déployé via les manifests situés dans :

```text
openshift/frontend/
```

Les objets OpenShift associés sont :

```text
ImageStream
BuildConfig
ConfigMap
Deployment
Service
Route
```

---

### 13.1 Appliquer les manifests

Depuis la racine du repository :

```bash
oc apply -f openshift/frontend/imagestream.yaml
oc apply -f openshift/frontend/configmap.yaml
oc apply -f openshift/frontend/buildconfig.yaml
oc apply -f openshift/frontend/deployment.yaml
oc apply -f openshift/frontend/service.yaml
oc apply -f openshift/frontend/route.yaml
```

---

### 13.2 Lancer le build

```bash
oc start-build coffee-shop-frontend --follow
```

---

### 13.3 Configurer l'URL du backend

Récupérer la Route backend :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
```

Mettre à jour la ConfigMap frontend :

```bash
oc patch configmap coffee-shop-frontend-config \
  --type merge \
  -p "{\"data\":{\"BACKEND_URL\":\"$BACKEND_ROUTE\"}}"
```

Redémarrer le frontend pour reprendre la variable d'environnement :

```bash
oc rollout restart deployment/coffee-shop-frontend
oc rollout status deployment/coffee-shop-frontend
```

---

### 13.4 Variante PowerShell

```powershell
$BACKEND_ROUTE = oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}'
oc patch configmap coffee-shop-frontend-config --type merge -p "{`"data`":{`"BACKEND_URL`":`"$BACKEND_ROUTE`"}}"
oc rollout restart deployment/coffee-shop-frontend
oc rollout status deployment/coffee-shop-frontend
```

---

### 13.5 Vérifier les objets créés

```bash
oc get builds
oc get is
oc get deployment
oc get pods
oc get svc
oc get route
```

---

### 13.6 Tester la Route frontend

Récupérer l'URL :

```bash
oc get route coffee-shop-frontend -o jsonpath='{"http://"}{.spec.host}{"\n"}'
```

Ouvrir l'URL dans un navigateur.

Résultat attendu :

```text
Frontend v1
Environnement training
Backend URL configurée
Statut backend OK
Version backend v1
Produits affichés
```

---

## 14. Commandes OpenShift utiles

Afficher les logs :

```bash
oc logs deployment/coffee-shop-frontend
```

Suivre les logs :

```bash
oc logs -f deployment/coffee-shop-frontend
```

Décrire le Deployment :

```bash
oc describe deployment coffee-shop-frontend
```

Décrire un Pod :

```bash
oc describe pod <pod-name>
```

Lister les variables d'environnement injectées :

```bash
oc set env deployment/coffee-shop-frontend --list
```

Afficher les Events :

```bash
oc get events --sort-by=.lastTimestamp
```

---