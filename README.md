# OpenShift Coffee Shop

Application pédagogique utilisée comme support pour une formation **OpenShift débutant**.

Cette application sert de fil rouge pour illustrer le parcours complet :

```text
Code Git
→ Build
→ Image
→ Registry
→ Deployment
→ Pod
→ Service
→ Route
→ Scaling
→ Rollout
→ Dépannage
```

---

## 1. Objectif pédagogique

Ce repository fournit une application simple, stable et compréhensible pour illustrer les concepts essentiels d'OpenShift.

L'application permet de manipuler concrètement :

- les Dockerfiles ;
- les builds OpenShift ;
- les images ;
- les ImageStreams ;
- le registre interne OpenShift ;
- les Deployments ;
- les Pods ;
- les Services ;
- les Routes ;
- les variables d'environnement ;
- les ConfigMaps ;
- les Secrets ;
- le scaling ;
- les rollouts et rollbacks ;
- les logs ;
- le dépannage applicatif.

Cette application n'a pas vocation à représenter une architecture de production complète. Elle est volontairement simple afin de rester adaptée à un public découvrant OpenShift.

---

## 2. Architecture applicative

L'application est composée de deux composants séparés :

```text
Frontend Web
    ↓
Backend API
```

Dans OpenShift, l'architecture pédagogique cible est la suivante :

```text
Utilisateur
   │
   ├── Route frontend
   │       ↓
   │    Service frontend
   │       ↓
   │    Pod frontend
   │
   └── Route backend
           ↓
        Service backend
           ↓
        Pod backend
```

Dans cette première version pédagogique, le backend est exposé avec une Route afin de rendre les échanges frontend/backend visibles et faciles à comprendre dans le navigateur.


---

## 3. Structure du repository

```text
openshift_labdevops2/
│
├── README.md
├── .gitignore
│
├── backend/
│
├── frontend/
│
├── openshift/
│
├── scenarios/
│
└── TPs/

```

---

## 4. Composants applicatifs

### 4.1 Backend

Le backend est une API **Node.js / Express**.

Il expose plusieurs endpoints simples permettant d'illustrer les concepts OpenShift.

Endpoints disponibles :

```text
GET /
GET /health
GET /ready
GET /api/products
GET /api/version
GET /admin/config
```

### Rôle pédagogique du backend

Le backend permet d'illustrer :

- le démarrage d'une application dans un Pod ;
- les logs applicatifs ;
- les healthchecks ;
- les readiness checks ;
- les variables d'environnement ;
- les ConfigMaps ;
- les Secrets ;
- le rollout d'une nouvelle version ;
- le dépannage applicatif.

---

### 4.2 Frontend

Le frontend est une application web simple servie par un serveur **Node.js / Express**.

Il affiche :

- la version du frontend ;
- l'environnement courant ;
- l'URL du backend configurée ;
- le statut du backend ;
- la version du backend ;
- le message retourné par le backend ;
- la liste des produits retournée par l'API backend.

### Rôle pédagogique du frontend

Le frontend permet d'illustrer :

- l'exposition d'une application avec une Route ;
- la configuration d'une application avec une variable d'environnement ;
- la communication avec une API backend ;
- les erreurs de configuration frontend/backend ;
- le diagnostic via le navigateur et les DevTools.

---

## 5. Ports utilisés

| Composant | Port applicatif |
|---|---:|
| Frontend | `3000` |
| Backend | `8080` |

---

## 6. Variables d'environnement

### 6.1 Backend

| Variable | Description | Valeur par défaut |
|---|---|---|
| `PORT` | Port d'écoute du backend | `8080` |
| `APP_NAME` | Nom du service backend | `Coffee Shop Backend` |
| `APP_VERSION` | Version applicative du backend | `v1` |
| `APP_ENV` | Environnement d'exécution | `dev` |
| `APP_MESSAGE` | Message affiché par le backend | `Hello from Coffee Shop Backend` |
| `FAIL_MODE` | Active un mode erreur volontaire | `false` |
| `SECRET_API_KEY` | Secret simulé côté backend | non défini |

Exemple d'exécution locale avec variables :

```bash
APP_VERSION=v2 APP_ENV=formation APP_MESSAGE="Bonjour depuis OpenShift" SECRET_API_KEY=demo-secret npm start
```

Sous PowerShell :

```powershell
$env:APP_VERSION="v2"
$env:APP_ENV="formation"
$env:APP_MESSAGE="Bonjour depuis OpenShift"
$env:SECRET_API_KEY="demo-secret"
npm start
```

---

### 6.2 Frontend

| Variable | Description | Valeur par défaut |
|---|---|---|
| `PORT` | Port d'écoute du frontend | `3000` |
| `FRONTEND_VERSION` | Version du frontend | `v1` |
| `APP_ENV` | Environnement d'exécution | `dev` |
| `BACKEND_URL` | URL publique du backend | `http://localhost:8080` |

Exemple d'exécution locale avec variables :

```bash
BACKEND_URL=http://localhost:8080 FRONTEND_VERSION=v1 APP_ENV=local npm start
```

Sous PowerShell :

```powershell
$env:BACKEND_URL="http://localhost:8080"
$env:FRONTEND_VERSION="v1"
$env:APP_ENV="local"
npm start
```

---

## 7. Exécution locale

### 7.1 Prérequis

Installer Node.js et npm.

Vérifier l'installation :

```bash
node -v
npm -v
```

---

### 7.2 Lancer le backend

Depuis le dossier `backend` :

```bash
cd backend
npm install
npm start
```

Le backend démarre sur :

```text
http://localhost:8080
```

Tester les endpoints :

```bash
curl http://localhost:8080/health
curl http://localhost:8080/ready
curl http://localhost:8080/api/products
curl http://localhost:8080/api/version
curl http://localhost:8080/admin/config
```

---

### 7.3 Lancer le frontend

Dans un second terminal :

```bash
cd frontend
npm install
npm start
```

Le frontend démarre sur :

```text
http://localhost:3000
```

Ouvrir dans le navigateur :

```text
http://localhost:3000
```

---

## 8. Build et déploiement avec OpenShift

> Cette application est principalement destinée à être construite par OpenShift directement depuis Git.

### 8.1 Créer un projet OpenShift

```bash
oc new-project coffee-shop-demo
```

---

### 8.2 Déployer le backend

```bash
oc new-app https://github.com/<user>/<repo>.git \
  --context-dir=backend \
  --name=coffee-shop-backend \
  --strategy=docker
```

Suivre le build :

```bash
oc logs -f build/coffee-shop-backend-1
```

Vérifier les objets créés :

```bash
oc get builds
oc get is
oc get deployment
oc get pods
oc get svc
```

---

### 8.3 Exposer le backend

```bash
oc expose svc/coffee-shop-backend
```

Récupérer l'URL du backend :

```bash
oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}{"\n"}'
```

Tester depuis un navigateur :

```text
http://<route-backend>/health
http://<route-backend>/api/products
http://<route-backend>/api/version
```

---

### 8.4 Déployer le frontend

```bash
oc new-app https://github.com/<user>/<repo>.git \
  --context-dir=frontend \
  --name=coffee-shop-frontend \
  --strategy=docker
```

Suivre le build :

```bash
oc logs -f build/coffee-shop-frontend-1
```

---

### 8.5 Configurer le frontend avec l'URL du backend

Récupérer la Route backend :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
```

Configurer le frontend :

```bash
oc set env deployment/coffee-shop-frontend BACKEND_URL=$BACKEND_ROUTE
```

Vérifier le rollout :

```bash
oc rollout status deployment/coffee-shop-frontend
```

Sous PowerShell :

```powershell
$BACKEND_ROUTE = oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}'
oc set env deployment/coffee-shop-frontend BACKEND_URL=$BACKEND_ROUTE
oc rollout status deployment/coffee-shop-frontend
```

---

### 8.6 Exposer le frontend

```bash
oc expose svc/coffee-shop-frontend
```

Récupérer l'URL du frontend :

```bash
oc get route coffee-shop-frontend -o jsonpath='{"http://"}{.spec.host}{"\n"}'
```

Ouvrir l'URL dans un navigateur.

---

## 9. Vérifications utiles

Afficher toutes les ressources :

```bash
oc get all
```

Afficher les routes :

```bash
oc get route
```

Afficher les logs backend :

```bash
oc logs deployment/coffee-shop-backend
```

Afficher les logs frontend :

```bash
oc logs deployment/coffee-shop-frontend
```

Lister les variables d'environnement du backend :

```bash
oc set env deployment/coffee-shop-backend --list
```

Lister les variables d'environnement du frontend :

```bash
oc set env deployment/coffee-shop-frontend --list
```

Décrire un Pod :

```bash
oc describe pod <pod-name>
```

Consulter les événements :

```bash
oc get events --sort-by=.lastTimestamp
```

---
