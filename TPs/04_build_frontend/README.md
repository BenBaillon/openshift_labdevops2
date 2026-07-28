# TP 04 - Construire l'image frontend avec OpenShift

## 1. Objectif du TP

Ce TP a pour objectif de demander à OpenShift de construire l'image de conteneur du frontend de l'application **OpenShift Coffee Shop**.

Dans le TP précédent, nous avons construit l'image du backend. Nous allons maintenant appliquer la même logique au frontend.

À la fin de ce TP, vous devez être capable de :

- comprendre le rôle du `Dockerfile` frontend ;
- comprendre que le frontend possède sa propre image ;
- créer l'`ImageStream` du frontend ;
- créer le `BuildConfig` du frontend ;
- lancer un build OpenShift pour le frontend ;
- suivre les logs du build ;
- vérifier que l'image frontend a été produite ;
- comprendre que chaque composant applicatif peut avoir son propre cycle de build.

Ce TP ne déploie pas encore le frontend sous forme de Pod.

Il se concentre uniquement sur la phase :

```text
Code Git frontend
→ Build frontend
→ Image frontend
→ ImageStream frontend
```

**Situation du TP :**

```text
Demi-journée 2
Chapitre 6 - Transformer le code en image
Chapitre 7 - Stocker l'image
Après TP 03 - Construire l'image backend avec OpenShift
Avant TP 05 - Déployer le backend
```

---

## 2. Concepts abordés

Ce TP reprend et renforce les concepts vus dans le TP précédent :

- Code source ;
- Dockerfile ;
- Image de conteneur ;
- Build OpenShift ;
- `BuildConfig` ;
- `Build` ;
- `ImageStream` ;
- Tag d'image ;
- Registre interne OpenShift ;
- Logs de build ;
- séparation frontend / backend.

Dans ce TP, nous allons utiliser deux objets OpenShift principaux :

```text
ImageStream
BuildConfig
```

### ImageStream

L'ImageStream permet à OpenShift de suivre l'image frontend produite par le build.

Dans ce TP, l'ImageStream s'appelle :

```text
coffee-shop-frontend
```

### BuildConfig

Le BuildConfig décrit comment construire l'image frontend à partir du repository Git.

Dans ce TP, le BuildConfig s'appelle aussi :

```text
coffee-shop-frontend
```

---

## 3. Position dans le fil rouge

Ce TP se situe dans le fil rouge global :

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

Le TP 04 correspond précisément à cette étape pour le frontend :

```text
Code Git frontend
→ Build frontend
→ Image frontend
```

Dans le TP 03, nous avons construit l'image backend.

Dans ce TP, nous construisons l'image frontend.

À la fin des TP 03 et TP 04, les deux images applicatives seront disponibles dans OpenShift :

```text
coffee-shop-backend:latest
coffee-shop-frontend:latest
```

Message clé :

```text
Chaque composant applicatif possède sa propre image.
```

---

## 4. Pré-requis

Avant de commencer ce TP, vous devez avoir :

- terminé le TP 01 ;
- terminé le TP 02 ;
- terminé le TP 03 ;
- accès à un cluster OpenShift ;
- accès à la CLI `oc` ;
- un Project OpenShift courant ;
- accès au repository Git de l'application ;
- les manifests OpenShift présents dans le repository.

Vérifier le Project courant :

```bash
oc project
```

Résultat attendu :

```text
Using project "coffee-shop-demo"
```

Si nécessaire, sélectionner le Project :

```bash
oc project coffee-shop-demo
```

Vérifier que le dossier frontend existe dans le repository :

```text
frontend/
```

Ce dossier doit contenir notamment :

```text
frontend/
├── Dockerfile
├── package.json
├── package-lock.json
├── src/
└── public/
```

---

## 5. Étapes détaillées

### Étape 1 - Observer le Dockerfile frontend

Ouvrir le fichier :

```text
frontend/Dockerfile
```

Repérer les instructions principales :

```dockerfile
FROM
WORKDIR
COPY
RUN
ENV
EXPOSE
CMD
```

Ces instructions expliquent comment produire une image exécutable du frontend.

Questions à se poser :

```text
Quelle image de base est utilisée ?
Quel dossier de travail est utilisé ?
Quels fichiers statiques sont copiés ?
Quel port est exposé ?
Quelle commande démarre l'application ?
Quelle variable permet d'indiquer l'URL du backend ?
```

Réponses attendues :

```text
Le frontend utilise une image Node.js.
Le frontend expose le port 3000.
Le frontend démarre avec npm start.
La variable BACKEND_URL permet de configurer l'URL du backend.
```

Message pédagogique :

```text
Le Dockerfile est la recette de fabrication de l'image frontend.
```

---

### Étape 2 - Observer les manifests OpenShift du build frontend

Depuis le repository, ouvrir le dossier :

```text
openshift/frontend/
```

Les deux fichiers utilisés dans ce TP sont :

```text
openshift/frontend/imagestream.yaml
openshift/frontend/buildconfig.yaml
```

À ce stade, nous n'utilisons pas encore :

```text
configmap.yaml
deployment.yaml
service.yaml
route.yaml
```

Ces fichiers seront utilisés dans les prochains TP.

---

### Étape 3 - Lire le manifest ImageStream

Ouvrir le fichier :

```text
openshift/frontend/imagestream.yaml
```

Exemple de contenu attendu :

```yaml
apiVersion: image.openshift.io/v1
kind: ImageStream
metadata:
  name: coffee-shop-frontend
  labels:
    app: coffee-shop
    component: frontend
```

Points à identifier :

```text
kind: ImageStream
name: coffee-shop-frontend
component: frontend
```

Message pédagogique :

```text
L'ImageStream permet à OpenShift de référencer l'image frontend produite par le build.
```

---

### Étape 4 - Lire le manifest BuildConfig

Ouvrir le fichier :

```text
openshift/frontend/buildconfig.yaml
```

Repérer le type de ressource :

```yaml
kind: BuildConfig
metadata:
  name: coffee-shop-frontend
```

Repérer la source Git :

```yaml
source:
  type: Git
  git:
    uri: <URL_DU_REPOSITORY>
    ref: main
  contextDir: frontend
```

Repérer la stratégie de build :

```yaml
strategy:
  type: Docker
  dockerStrategy:
    dockerfilePath: Dockerfile
```

Repérer la sortie du build :

```yaml
output:
  to:
    kind: ImageStreamTag
    name: coffee-shop-frontend:latest
```

À retenir :

```text
contextDir: frontend
```

signifie qu'OpenShift doit construire l'image à partir du dossier `frontend` du repository.

Message clé :

```text
Le BuildConfig frontend relie le code Git, le Dockerfile frontend et l'image frontend produite.
```

---

### Étape 5 - Créer l'ImageStream frontend

Appliquer le manifest ImageStream :

```bash
oc apply -f openshift/frontend/imagestream.yaml
```

Vérifier la création :

```bash
oc get imagestream
```

ou avec le raccourci :

```bash
oc get is
```

Résultat attendu :

```text
coffee-shop-frontend
```

À ce stade, l'ImageStream existe, mais aucune image frontend n'a encore été construite.

---

### Étape 6 - Créer le BuildConfig frontend

Appliquer le manifest BuildConfig :

```bash
oc apply -f openshift/frontend/buildconfig.yaml
```

Vérifier la création :

```bash
oc get buildconfig
```

ou avec le raccourci :

```bash
oc get bc
```

Résultat attendu :

```text
coffee-shop-frontend
```

---

### Étape 7 - Lancer le build frontend

Lancer le build :

```bash
oc start-build coffee-shop-frontend --follow
```

L'option `--follow` permet de suivre les logs du build en direct.

Pendant le build, OpenShift va :

```text
récupérer le code Git
se placer dans le dossier frontend
lire le Dockerfile
installer les dépendances
copier le serveur frontend
copier les fichiers statiques
construire l'image
pousser l'image dans l'ImageStream
```

---

### Étape 8 - Observer les logs du build

Pendant le build, repérer les étapes importantes :

```text
Cloning repository
STEP 1/... FROM ...
COPY package.json package-lock.json
RUN npm ci ou npm install
COPY src
COPY public
EXPOSE 3000
CMD npm start
Pushing image
Push successful
```

Message important :

```text
Les logs de build permettent de vérifier que le frontend est bien construit à partir du dossier frontend.
```

---

## 6. Commandes

Commandes principales du TP :

```bash
# Vérifier le projet courant
oc project

# Créer l'ImageStream frontend
oc apply -f openshift/frontend/imagestream.yaml

# Créer le BuildConfig frontend
oc apply -f openshift/frontend/buildconfig.yaml

# Vérifier les ressources de build
oc get is
oc get bc

# Lancer le build frontend
oc start-build coffee-shop-frontend --follow
```

Commandes d'observation complémentaires :

```bash
# Vérifier le statut du build
oc get builds

# Consulter les logs du build après coup
oc logs build/coffee-shop-frontend-1

# Vérifier l'image produite
oc describe is coffee-shop-frontend

# Afficher la configuration du BuildConfig
oc get bc coffee-shop-frontend -o yaml
```

---

## 7. Vérifications

### Vérifier l'ImageStream

```bash
oc get is
```

Résultat attendu :

```text
coffee-shop-frontend
```

---

### Vérifier le BuildConfig

```bash
oc get bc
```

Résultat attendu :

```text
coffee-shop-frontend
```

---

### Vérifier le build

```bash
oc get builds
```

Résultat attendu :

```text
coffee-shop-frontend-1   Complete
```

Si le build est encore en cours :

```text
Running
```

Si le build échoue :

```text
Failed
```

---

### Vérifier l'image produite

```bash
oc describe is coffee-shop-frontend
```

Résultat attendu :

```text
Tags:
  latest
```

Cela signifie qu'une image frontend a été produite et associée au tag :

```text
coffee-shop-frontend:latest
```

---

### Vérifier les deux images applicatives

À la fin de ce TP, les deux ImageStreams doivent exister :

```bash
oc get is
```

Résultat attendu :

```text
coffee-shop-backend
coffee-shop-frontend
```

Cela signifie que les images des deux composants applicatifs sont disponibles dans OpenShift.

---

### Vérifier dans la console OpenShift

Dans la console web OpenShift, repérer les sections liées aux builds :

```text
Builds
BuildConfigs
ImageStreams
```

Vérifier que :

```text
BuildConfig coffee-shop-frontend existe
Build coffee-shop-frontend-1 est Complete
ImageStream coffee-shop-frontend existe
```

---

### Erreurs fréquentes à vérifier

#### Mauvais repository Git

Symptôme possible :

```text
repository not found
```

Commande utile :

```bash
oc get bc coffee-shop-frontend -o yaml
```

Contrôler la valeur :

```yaml
source:
  git:
    uri:
```

---

#### Mauvais contextDir

Symptôme possible :

```text
Dockerfile not found
```

Vérifier dans le BuildConfig :

```yaml
contextDir: frontend
```

Le Dockerfile doit se trouver ici :

```text
frontend/Dockerfile
```

---

#### Erreur npm

Symptôme possible :

```text
npm ci failed
npm install failed
```

Vérifier :

```text
frontend/package.json
frontend/package-lock.json
```

Consulter les logs :

```bash
oc logs build/coffee-shop-frontend-1
```

---

## 8. Questions de compréhension

### Question 1

Pourquoi le frontend possède-t-il son propre BuildConfig ?

<details>
<summary>Réponse</summary>

Parce que le frontend est un composant applicatif séparé, avec son propre code, son propre Dockerfile et sa propre image.

</details>

---

### Question 2

Quel dossier du repository est utilisé pour construire l'image frontend ?

<details>
<summary>Réponse</summary>

```text
frontend/
```

Ce dossier est indiqué dans le BuildConfig avec :

```yaml
contextDir: frontend
```

</details>

---

### Question 3

Quel objet OpenShift suit l'image frontend produite ?

<details>
<summary>Réponse</summary>

```text
ImageStream coffee-shop-frontend
```

</details>

---

### Question 4

Quelle commande permet de lancer manuellement le build frontend ?

<details>
<summary>Réponse</summary>

```bash
oc start-build coffee-shop-frontend --follow
```

</details>

---

### Question 5

Le frontend est-il déjà accessible dans un navigateur après ce TP ?

<details>
<summary>Réponse</summary>

Non.

À ce stade, seule l'image frontend est construite. Le déploiement et la Route frontend seront réalisés dans des TP suivants.

</details>

---

## 9. Résultat attendu

À la fin de ce TP :

- l'ImageStream `coffee-shop-frontend` existe ;
- le BuildConfig `coffee-shop-frontend` existe ;
- un build frontend a été lancé ;
- le build est en statut `Complete` ;
- l'image `coffee-shop-frontend:latest` est disponible dans OpenShift ;
- les deux images applicatives existent maintenant dans OpenShift ;
- aucun Pod frontend n'a encore été déployé dans ce TP.

Vérification rapide :

```bash
oc get bc
oc get builds
oc get is
```

Résultat attendu :

```text
BuildConfig coffee-shop-backend présent
BuildConfig coffee-shop-frontend présent
Build coffee-shop-backend-1 Complete
Build coffee-shop-frontend-1 Complete
ImageStream coffee-shop-backend présent
ImageStream coffee-shop-frontend présent
```

---

## 10. Nettoyage

Aucun nettoyage n'est nécessaire à la fin de ce TP.

Les ressources créées seront utilisées dans les TP suivants.

Ne supprimez pas :

```text
BuildConfig coffee-shop-frontend
ImageStream coffee-shop-frontend
```

Si le formateur demande de supprimer uniquement les ressources de build frontend :

```bash
oc delete -f openshift/frontend/buildconfig.yaml
oc delete -f openshift/frontend/imagestream.yaml
```

Attention : la suppression de l'ImageStream supprime la référence OpenShift à l'image construite.

---

## 11. Message clé

```text
Chaque composant applicatif possède son propre build et sa propre image.
```

Phrase de synthèse :

```text
Nous avons construit l'image du backend.
Nous avons maintenant construit l'image du frontend.
OpenShift connaît les deux images grâce aux ImageStreams.
Ces images serviront ensuite à déployer les composants de l'application.
```

---

## 12. Transition vers le TP suivant

Dans les TP 03 et TP 04, nous avons construit les images :

```text
coffee-shop-backend:latest
coffee-shop-frontend:latest
```

Dans le TP suivant, nous allons commencer à exécuter l'application dans OpenShift.

Nous commencerons par le backend :

```text
Image backend
→ Deployment backend
→ Pod backend
```

Le prochain objectif sera donc :

```text
Déployer le backend à partir de l'image construite.
```
