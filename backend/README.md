# Coffee Shop Backend

Backend API de l'application pédagogique **OpenShift Coffee Shop**.

Ce composant est utilisé dans le cadre d'une formation OpenShift débutant pour illustrer le cycle de vie d'une application backend :

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
→ Secret
→ Logs
→ Healthchecks
→ Dépannage
```

---

## 1. Rôle du backend dans la formation

Le backend représente l'API métier de l'application **OpenShift Coffee Shop**.

Il est volontairement simple afin de rester compréhensible par des personnes découvrant OpenShift. Son objectif n'est pas de démontrer une architecture applicative complexe, mais de fournir un support concret pour manipuler les objets OpenShift essentiels.

Ce composant permet d'illustrer :

- le démarrage d'une application dans un Pod ;
- l'exposition d'une API HTTP ;
- la configuration par variables d'environnement ;
- l'utilisation d'une ConfigMap ;
- l'utilisation d'un Secret ;
- les logs applicatifs ;
- les endpoints de santé ;
- les readiness probes ;
- les liveness probes ;
- le scaling ;
- le rollout et le rollback ;
- le dépannage avec `oc logs`, `oc describe` et les Events.

---

## 2. Architecture

Le backend est une application **Node.js / Express**.

Dans l'architecture globale, il est appelé par le frontend :

```text
Utilisateur
   ↓
Route frontend
   ↓
Frontend
   ↓
Route backend ou Service backend
   ↓
Backend API
```

Dans la première version pédagogique de la formation, le backend est exposé via une Route afin que les échanges entre le frontend et le backend soient visibles et faciles à comprendre.

Une évolution possible consiste à garder le backend uniquement accessible à l'intérieur du cluster, via son Service OpenShift.

---

## 3. Structure du dossier backend

```text
backend/
│
├── README.md
├── Dockerfile
├── .dockerignore
├── package.json
├── package-lock.json
│
└── src/
    ├── server.js
    ├── config.js
    ├── logger.js
    │
    └── routes/
        ├── admin.js
        ├── health.js
        ├── products.js
        └── version.js
```

---

## 4. Description des fichiers principaux

### `src/server.js`

Point d'entrée de l'application backend.

Responsabilités :

- démarrer le serveur Express ;
- exposer les routes HTTP ;
- charger la configuration ;
- activer le middleware JSON ;
- activer le middleware CORS ;
- produire des logs simples pour chaque requête.

---

### `src/config.js`

Centralise la configuration de l'application.

Ce fichier lit les variables d'environnement injectées localement ou par OpenShift.

Il permet d'illustrer le principe suivant :

> La configuration ne doit pas être codée en dur dans l'application.

---

### `src/logger.js`

Fournit un logger simple au format JSON.

Les logs sont lisibles avec :

```bash
oc logs deployment/coffee-shop-backend
```

---

### `src/routes/products.js`

Expose l'API métier simple :

```text
GET /api/products
```

Cette route retourne une liste de produits fictifs du Coffee Shop.

---

### `src/routes/version.js`

Expose les informations de version :

```text
GET /api/version
```

Cette route est utile pour les chapitres sur :

- le rollout ;
- le rollback ;
- la configuration applicative ;
- la différence entre version de code et configuration runtime.

---

### `src/routes/health.js`

Expose les endpoints techniques :

```text
GET /health
GET /ready
```

Ces endpoints sont utilisés par OpenShift pour les probes :

- `livenessProbe` ;
- `readinessProbe`.

---

### `src/routes/admin.js`

Expose une route de diagnostic :

```text
GET /admin/config
```

Cette route permet de vérifier la configuration réellement reçue par l'application.

La valeur du Secret n'est jamais affichée. L'API indique uniquement si un Secret est configuré ou non.

---

## 5. Endpoints disponibles

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Informations générales sur le backend |
| `GET` | `/health` | Vérifie si l'application est vivante |
| `GET` | `/ready` | Vérifie si l'application est prête à recevoir du trafic |
| `GET` | `/api/products` | Retourne la liste des produits |
| `GET` | `/api/version` | Retourne la version et le message applicatif |
| `GET` | `/admin/config` | Affiche la configuration effective, sans exposer le Secret |

---

## 6. Variables d'environnement

| Variable | Description | Valeur par défaut |
|---|---|---|
| `PORT` | Port d'écoute HTTP du backend | `8080` |
| `APP_NAME` | Nom affiché du backend | `Coffee Shop Backend` |
| `APP_VERSION` | Version applicative du backend | `v1` |
| `APP_ENV` | Environnement d'exécution | `dev` |
| `APP_MESSAGE` | Message retourné par l'API version | `Hello from Coffee Shop Backend` |
| `FAIL_MODE` | Active un mode erreur volontaire | `false` |
| `SECRET_API_KEY` | Secret simulé côté backend | non défini |

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

### 7.2 Installer les dépendances

Depuis le dossier `backend` :

```bash
npm install
```

---

### 7.3 Démarrer le backend

```bash
npm start
```

Le backend démarre par défaut sur :

```text
http://localhost:8080
```

---

### 7.4 Tester les endpoints

```bash
curl http://localhost:8080/
curl http://localhost:8080/health
curl http://localhost:8080/ready
curl http://localhost:8080/api/products
curl http://localhost:8080/api/version
curl http://localhost:8080/admin/config
```

---

## 8. Exécution locale avec variables d'environnement

### Bash / Linux / macOS / Git Bash

```bash
APP_VERSION=v2 \
APP_ENV=formation \
APP_MESSAGE="Bonjour depuis une variable d'environnement" \
SECRET_API_KEY=local-secret \
npm start
```

### PowerShell

```powershell
$env:APP_VERSION="v2"
$env:APP_ENV="formation"
$env:APP_MESSAGE="Bonjour depuis une variable d'environnement"
$env:SECRET_API_KEY="local-secret"
npm start
```

Tester ensuite :

```bash
curl http://localhost:8080/api/version
curl http://localhost:8080/admin/config
```

Résultat attendu :

- `/api/version` doit afficher la version et le message configurés ;
- `/admin/config` doit indiquer que le Secret est configuré ;
- la valeur du Secret ne doit pas être affichée.

---

## 9. Mode erreur volontaire

Le backend peut simuler une panne grâce à la variable :

```text
FAIL_MODE=true
```

### Bash / Linux / macOS / Git Bash

```bash
FAIL_MODE=true npm start
```

### PowerShell

```powershell
$env:FAIL_MODE="true"
npm start
```

Effets attendus :

```text
GET /health → HTTP 500
GET /ready  → HTTP 503
```

Ce mode est utile pour les exercices de dépannage et pour expliquer les probes OpenShift.

---

## 10. Dockerfile

Le backend contient un `Dockerfile` permettant à OpenShift de construire une image depuis le code source.

Le Dockerfile réalise les étapes suivantes :

```text
Image de base Node.js
→ Création du répertoire de travail
→ Copie des fichiers package.json / package-lock.json
→ Installation des dépendances
→ Copie du code source
→ Définition des variables par défaut
→ Exposition du port 8080
→ Démarrage de l'application
```

Le build de l'image est principalement réalisé par OpenShift dans le cadre de la formation.

---

## 11. Déploiement OpenShift du backend

Le backend est déployé via les manifests situés dans :

```text
openshift/backend/
```

Les objets OpenShift associés sont :

```text
ImageStream
BuildConfig
ConfigMap
Secret
Deployment
Service
Route
```

---

### 11.1 Appliquer les manifests

Depuis la racine du repository :

```bash
oc apply -f openshift/backend/imagestream.yaml
oc apply -f openshift/backend/configmap.yaml
oc apply -f openshift/backend/secret.yaml
oc apply -f openshift/backend/buildconfig.yaml
oc apply -f openshift/backend/deployment.yaml
oc apply -f openshift/backend/service.yaml
oc apply -f openshift/backend/route.yaml
```

---

### 11.2 Lancer le build

```bash
oc start-build coffee-shop-backend --follow
```

---

### 11.3 Vérifier les objets créés

```bash
oc get builds
oc get is
oc get deployment
oc get pods
oc get svc
oc get route
```

---

### 11.4 Tester la Route backend

Récupérer l'URL :

```bash
oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}{"\n"}'
```

Tester dans un navigateur :

```text
http://<route-backend>/health
http://<route-backend>/ready
http://<route-backend>/api/products
http://<route-backend>/api/version
http://<route-backend>/admin/config
```

---

## 12. Commandes OpenShift utiles

Afficher les logs :

```bash
oc logs deployment/coffee-shop-backend
```

Suivre les logs :

```bash
oc logs -f deployment/coffee-shop-backend
```

Décrire le Deployment :

```bash
oc describe deployment coffee-shop-backend
```

Décrire un Pod :

```bash
oc describe pod <pod-name>
```

Lister les variables d'environnement injectées :

```bash
oc set env deployment/coffee-shop-backend --list
```

Afficher les Events :

```bash
oc get events --sort-by=.lastTimestamp
```

---