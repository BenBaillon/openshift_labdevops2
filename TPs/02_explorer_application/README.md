# TP 02 - Explorer l'application OpenShift Coffee Shop

## 1. Objectif du TP

Ce TP a pour objectif de découvrir le repository applicatif **OpenShift Coffee Shop** avant de le déployer sur OpenShift.

À la fin de ce TP, vous devez être capable de :

- identifier les deux composants applicatifs : frontend et backend ;
- comprendre le rôle de chaque dossier du repository ;
- repérer les Dockerfiles ;
- repérer les manifests OpenShift ;
- repérer les scénarios pédagogiques ;
- comprendre ce qui sera construit, déployé, configuré et exposé dans les prochains TP.

Ce TP ne crée pas encore de ressource OpenShift.

Il sert à comprendre ce que nous allons déployer.

---

## 2. Concepts abordés

Ce TP introduit ou prépare les concepts suivants :

- repository Git ;
- application frontend ;
- application backend ;
- Dockerfile ;
- manifest OpenShift ;
- séparation code / configuration ;
- scénario pédagogique ;
- architecture applicative simple ;
- support applicatif de formation.

---

## 3. Position dans le fil rouge de la formation

Ce TP correspond à l'étape suivante du fil rouge :

```text
1. Nous avons du code
```

Dans le parcours complet :

```text
Code Git
→ Build
→ Image
→ Registry
→ Deployment
→ Pod
→ Service
→ Route
→ Utilisateur
```

Dans ce TP, nous sommes au tout début du parcours :

```text
Code Git
```

Message clé :

> Avant de demander à OpenShift de construire et déployer une application, il faut comprendre ce que contient le repository.

---

## 4. Pré-requis

Avant de commencer ce TP, vous devez disposer de :

- l'URL du repository Git de l'application ;
- un accès au repository depuis votre navigateur ;
- éventuellement Git installé en local si le formateur demande de cloner le repository ;
- un Project OpenShift prêt pour les prochains TP.

Le TP 01 doit avoir été réalisé :

```text
TP 01 - Découverte de l'environnement OpenShift
```

---

## 5. Repository utilisé

Le repository contient l'application pédagogique :

```text
OpenShift Coffee Shop
```

Cette application est volontairement simple et composée de deux parties :

```text
Frontend Web
Backend API
```

Architecture simplifiée :

```text
Utilisateur
   ↓
Frontend
   ↓
Backend API
```

Dans OpenShift, cette application sera progressivement représentée par :

```text
coffee-shop-frontend
coffee-shop-backend
```

---

## 6. Cloner le repository, si nécessaire

Si le formateur demande de travailler localement, cloner le repository :

```bash
git clone <URL_DU_REPOSITORY>
```

Entrer dans le dossier :

```bash
cd <NOM_DU_REPOSITORY>
```

Vérifier la branche courante :

```bash
git branch
```

Vérifier l'état du repository :

```bash
git status
```

Si le formateur ne demande pas de cloner le repository, vous pouvez simplement l'explorer depuis l'interface web GitHub ou GitLab.

---

## 7. Vue d'ensemble de l'arborescence

Le repository contient plusieurs dossiers importants :

```text
openshift_labdevops2/
│
├── README.md
├── backend/
├── frontend/
├── openshift/
├── scenarios/
└── TP/
```

Chaque dossier a un rôle précis dans la formation.

---

## 8. Lire le README principal

Ouvrir le fichier :

```text
README.md
```

Ce fichier présente :

- l'objectif pédagogique de l'application ;
- l'architecture frontend/backend ;
- les composants principaux ;
- les variables d'environnement ;
- les commandes de déploiement OpenShift ;
- les scénarios pédagogiques ;
- la roadmap du support applicatif.

Question à se poser :

```text
Quel est le rôle de cette application dans la formation OpenShift ?
```

Réponse attendue :

```text
Elle sert de support fil rouge pour apprendre à construire, déployer, exposer, faire évoluer et dépanner une application sur OpenShift.
```

---

## 9. Explorer le dossier backend

Ouvrir le dossier :

```text
backend/
```

Arborescence attendue :

```text
backend/
│
├── README.md
├── Dockerfile
├── .dockerignore
├── package.json
├── package-lock.json
└── src/
    ├── server.js
    ├── config.js
    ├── logger.js
    └── routes/
        ├── admin.js
        ├── health.js
        ├── products.js
        └── version.js
```

Le backend est une API Node.js / Express.

Il expose notamment :

```text
GET /health
GET /ready
GET /api/products
GET /api/version
GET /admin/config
```

---

## 10. Comprendre le rôle du backend

Le backend représente l'API métier de l'application Coffee Shop.

Il permet d'illustrer :

- une application déployée dans un Pod ;
- des endpoints HTTP ;
- des logs applicatifs ;
- des healthchecks ;
- des readiness checks ;
- de la configuration via ConfigMap ;
- une donnée sensible via Secret ;
- des scénarios de dépannage.

Message clé :

> Le backend est le composant qui fournit les données et les endpoints techniques de l'application.

---

## 11. Identifier le Dockerfile backend

Ouvrir le fichier :

```text
backend/Dockerfile
```

Repérer les principales étapes :

```dockerfile
FROM
WORKDIR
COPY
RUN
ENV
EXPOSE
CMD
```

Questions à se poser :

```text
Quelle image de base est utilisée ?
Quel port est exposé ?
Quelle commande démarre l'application ?
```

Réponses attendues :

```text
Le backend utilise une image Node.js.
Le backend expose le port 8080.
Le backend démarre avec npm start.
```

Message clé :

> Le Dockerfile décrit comment construire l'image du backend.

---

## 12. Explorer le dossier frontend

Ouvrir le dossier :

```text
frontend/
```

Arborescence attendue :

```text
frontend/
│
├── README.md
├── Dockerfile
├── .dockerignore
├── package.json
├── package-lock.json
├── src/
│   └── server.js
└── public/
    ├── index.html
    ├── style.css
    └── app.js
```

Le frontend est une application web simple servie par Node.js / Express.

Il affiche :

- la version frontend ;
- l'environnement ;
- l'URL du backend ;
- le statut du backend ;
- la version backend ;
- la liste des produits.

---

## 13. Comprendre le rôle du frontend

Le frontend représente l'interface utilisateur de l'application.

Il permet d'illustrer :

- une application web accessible depuis un navigateur ;
- une Route OpenShift ;
- une configuration frontend via `BACKEND_URL` ;
- la communication avec une API backend ;
- le diagnostic avec les DevTools du navigateur.

Message clé :

> Le frontend est le composant visible par l'utilisateur.

---

## 14. Identifier le Dockerfile frontend

Ouvrir le fichier :

```text
frontend/Dockerfile
```

Repérer les principales étapes :

```dockerfile
FROM
WORKDIR
COPY
RUN
ENV
EXPOSE
CMD
```

Questions à se poser :

```text
Quel port le frontend expose-t-il ?
Quelle variable permet de configurer l'URL du backend ?
```

Réponses attendues :

```text
Le frontend expose le port 3000.
La variable BACKEND_URL permet de configurer l'URL du backend.
```

Message clé :

> Le Dockerfile décrit comment construire l'image du frontend.

---

## 15. Explorer le dossier openshift

Ouvrir le dossier :

```text
openshift/
```

Arborescence attendue :

```text
openshift/
├── backend/
└── frontend/
```

Le dossier backend contient les manifests du backend :

```text
openshift/backend/
├── imagestream.yaml
├── buildconfig.yaml
├── configmap.yaml
├── secret.yaml
├── deployment.yaml
├── service.yaml
└── route.yaml
```

Le dossier frontend contient les manifests du frontend :

```text
openshift/frontend/
├── imagestream.yaml
├── buildconfig.yaml
├── configmap.yaml
├── deployment.yaml
├── service.yaml
└── route.yaml
```

---

## 16. Comprendre le rôle des manifests OpenShift

Les manifests YAML décrivent les ressources OpenShift à créer.

Ils permettent de passer d'une approche manuelle à une approche déclarative.

Exemples :

```text
ImageStream   → représente l'image applicative dans OpenShift
BuildConfig   → décrit comment construire l'image depuis Git
ConfigMap     → contient la configuration non sensible
Secret        → contient la configuration sensible
Deployment    → décrit comment exécuter l'application
Service       → fournit un point d'accès stable vers les Pods
Route         → expose l'application à l'extérieur du cluster
```

Message clé :

> Les manifests décrivent l'état attendu de l'application dans OpenShift.

---

## 17. Explorer le dossier scenarios

Ouvrir le dossier :

```text
scenarios/
```

Scénarios disponibles :

```text
01-v2-rollout/
02-broken-backend-url/
03-broken-healthcheck/
04-broken-service-selector/
05-broken-secret/
06-scaling/
```

Ces scénarios seront utilisés après le déploiement de l'application.

Ils permettent d'illustrer :

- le scaling ;
- le rollout ;
- le rollback ;
- une mauvaise configuration ;
- un Service sans endpoints ;
- une healthcheck en erreur ;
- un Secret manquant.

Message clé :

> Les scénarios servent à faire vivre, évoluer ou dépanner l'application une fois qu'elle est déployée.

---

## 18. Explorer le dossier TP

Ouvrir le dossier :

```text
TP/
```

Ce dossier contient les travaux pratiques guidés.

Les TP servent à construire progressivement l'application sur OpenShift.

Différence importante :

```text
TP        → parcours guidé pour construire l'application
Scénario  → situation ciblée pour faire évoluer ou dépanner l'application
```

Message clé :

> Les TP construisent le chemin nominal. Les scénarios permettent d'apprendre à réagir à des situations particulières.

---

## 19. Identifier les deux composants à déployer

Les deux composants applicatifs sont :

```text
coffee-shop-backend
coffee-shop-frontend
```

Le backend sera construit depuis :

```text
backend/
```

Le frontend sera construit depuis :

```text
frontend/
```

Chaque composant possède :

```text
son code
son Dockerfile
son ImageStream
son BuildConfig
son Deployment
son Service
sa Route
```

Le backend possède en plus :

```text
une ConfigMap
un Secret
```

Le frontend possède :

```text
une ConfigMap contenant BACKEND_URL
```

---

## 20. Schéma synthétique de l'application

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

Dans cette version pédagogique, le backend est exposé avec une Route pour que les appels soient visibles depuis le navigateur.

---

## 21. Questions de compréhension

### Question 1

Quels sont les deux composants principaux de l'application OpenShift Coffee Shop ?

<details>
<summary>Réponse</summary>

```text
coffee-shop-frontend
coffee-shop-backend
```

</details>

---

### Question 2

Dans quel dossier se trouve le code du backend ?

<details>
<summary>Réponse</summary>

```text
backend/
```

</details>

---

### Question 3

Dans quel dossier se trouve le code du frontend ?

<details>
<summary>Réponse</summary>

```text
frontend/
```

</details>

---

### Question 4

Quel fichier décrit comment construire l'image du backend ?

<details>
<summary>Réponse</summary>

```text
backend/Dockerfile
```

</details>

---

### Question 5

Quel fichier décrit comment construire l'image du frontend ?

<details>
<summary>Réponse</summary>

```text
frontend/Dockerfile
```

</details>

---

### Question 6

Quel dossier contient les manifests OpenShift ?

<details>
<summary>Réponse</summary>

```text
openshift/
```

</details>

---

### Question 7

Quel dossier contient les situations de panne ou d'évolution de l'application ?

<details>
<summary>Réponse</summary>

```text
scenarios/
```

</details>

---

## 22. Résultat attendu du TP

À la fin de ce TP, vous devez avoir compris :

- que l'application est composée d'un frontend et d'un backend ;
- que chaque composant possède son propre Dockerfile ;
- que les manifests OpenShift sont dans le dossier `openshift/` ;
- que les scénarios pédagogiques sont dans le dossier `scenarios/` ;
- que les TP guident la construction progressive de l'application ;
- que les prochains TP utiliseront ces fichiers pour créer les ressources OpenShift.

---

## 23. Nettoyage

Aucun nettoyage n'est nécessaire à la fin de ce TP.

Ce TP ne crée aucune ressource OpenShift.

---

## 24. Message clé à retenir

```text
L'application OpenShift Coffee Shop est notre support fil rouge.
Elle contient un frontend, un backend, des Dockerfiles, des manifests OpenShift et des scénarios pédagogiques.
```

Phrase de synthèse :

```text
Je comprends ce que contient le repository.
Je sais où se trouvent le frontend et le backend.
Je sais où se trouvent les Dockerfiles.
Je sais où se trouvent les manifests OpenShift.
Je suis prêt à construire les images avec OpenShift.
```

---

## 25. Transition vers le TP suivant

Dans le TP suivant, nous allons demander à OpenShift de construire la première image applicative.

Nous commencerons par le backend :

```text
Code backend
→ Dockerfile backend
→ BuildConfig backend
→ Build OpenShift
→ ImageStream backend
```

Le prochain objectif sera donc :

```text
Transformer le code backend en image de conteneur avec OpenShift.
```
