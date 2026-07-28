# TP 03 - Construire l'image backend avec OpenShift

## 1. Objectif du TP

Ce TP a pour objectif de demander à OpenShift de construire l'image de conteneur du backend de l'application **OpenShift Coffee Shop**.

À la fin de ce TP, vous devez être capable de :

- comprendre le rôle du `Dockerfile` backend ;
- comprendre le rôle d'un `ImageStream` ;
- comprendre le rôle d'un `BuildConfig` ;
- créer les ressources OpenShift nécessaires au build du backend ;
- lancer un build OpenShift manuellement ;
- suivre les logs du build ;
- vérifier que l'image backend a été produite ;
- comprendre que le code Git est transformé en image de conteneur par OpenShift.

Ce TP ne déploie pas encore le backend sous forme de Pod.

Il se concentre uniquement sur la phase :

```text
Code Git
→ Build
→ Image
→ ImageStream
```

**Situation du TP :**

```text
Demi-journée 2
Chapitre 6 - Transformer le code en image
Après TP 02 - Explorer l'application OpenShift Coffee Shop
Avant TP 04 - Construire l'image frontend avec OpenShift
```

---

## 2. Concepts abordés

Ce TP introduit les concepts suivants :

- Code source ;
- Dockerfile ;
- Image de conteneur ;
- Build OpenShift ;
- `BuildConfig` ;
- `Build` ;
- `ImageStream` ;
- Tag d'image ;
- Registre interne OpenShift ;
- Logs de build.

Dans ce TP, nous allons utiliser principalement deux objets OpenShift :

```text
ImageStream
BuildConfig
```

### ImageStream

L'ImageStream permet à OpenShift de suivre une image applicative.

Dans ce TP, l'ImageStream s'appelle :

```text
coffee-shop-backend
```

### BuildConfig

Le BuildConfig décrit comment construire l'image.

Il indique notamment :

- l'URL du repository Git ;
- la branche Git ;
- le sous-dossier à utiliser ;
- la stratégie de build ;
- l'image produite en sortie.

Dans ce TP, le BuildConfig s'appelle aussi :

```text
coffee-shop-backend
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

Le TP 03 correspond précisément à cette étape :

```text
Code Git
→ Build
→ Image
```

Dans le TP précédent, nous avons identifié le code backend dans le repository.

Dans ce TP, nous demandons à OpenShift de construire une image de conteneur à partir de ce code.

Message clé :

```text
OpenShift ne déploie pas directement du code source.
OpenShift construit ou utilise une image de conteneur.
```

---

## 4. Pré-requis

Avant de commencer ce TP, vous devez avoir :

- terminé le TP 01 ;
- terminé le TP 02 ;
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

Vérifier que le dossier backend existe dans le repository :

```text
backend/
```

Ce dossier doit contenir notamment :

```text
backend/
├── Dockerfile
├── package.json
├── package-lock.json
└── src/
```

---

## 5. Étapes détaillées

### Étape 1 - Observer le Dockerfile backend

Ouvrir le fichier :

```text
backend/Dockerfile
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

Ces instructions expliquent comment produire une image exécutable du backend.

Questions à se poser :

```text
Quelle image de base est utilisée ?
Quel dossier de travail est utilisé ?
Quelles dépendances sont installées ?
Quel port est exposé ?
Quelle commande démarre l'application ?
```

Réponses attendues :

```text
Le backend utilise une image Node.js.
Le backend expose le port 8080.
Le backend démarre avec npm start.
```

Message pédagogique :

```text
Le Dockerfile est la recette de fabrication de l'image backend.
```

---

### Étape 2 - Observer les manifests OpenShift du build backend

Depuis le repository, ouvrir le dossier :

```text
openshift/backend/
```

Les deux fichiers utilisés dans ce TP sont :

```text
openshift/backend/imagestream.yaml
openshift/backend/buildconfig.yaml
```

À ce stade, nous n'utilisons pas encore :

```text
configmap.yaml
secret.yaml
deployment.yaml
service.yaml
route.yaml
```

Ces fichiers seront utilisés dans les prochains TP.

---

### Étape 3 - Lire le manifest ImageStream

Ouvrir le fichier :

```text
openshift/backend/imagestream.yaml
```

Exemple de contenu attendu :

```yaml
apiVersion: image.openshift.io/v1
kind: ImageStream
metadata:
  name: coffee-shop-backend
  labels:
    app: coffee-shop
    component: backend
```

Points à identifier :

```text
kind: ImageStream
name: coffee-shop-backend
component: backend
```

Message pédagogique :

```text
L'ImageStream permet à OpenShift de référencer l'image backend produite par le build.
```

---

### Étape 4 - Lire le manifest BuildConfig

Ouvrir le fichier :

```text
openshift/backend/buildconfig.yaml
```

Repérer le type de ressource :

```yaml
kind: BuildConfig
metadata:
  name: coffee-shop-backend
```

Repérer la source Git :

```yaml
source:
  type: Git
  git:
    uri: <URL_DU_REPOSITORY>
    ref: main
  contextDir: backend
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
    name: coffee-shop-backend:latest
```

À retenir :

```text
contextDir: backend
```

signifie qu'OpenShift doit construire l'image à partir du dossier `backend` du repository.

Message clé :

```text
Le BuildConfig relie le code Git, le Dockerfile et l'image produite.
```

---

### Étape 5 - Créer l'ImageStream backend

Appliquer le manifest ImageStream :

```bash
oc apply -f openshift/backend/imagestream.yaml
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
coffee-shop-backend
```

À ce stade, l'ImageStream existe, mais aucune image backend n'a encore été construite.

---

### Étape 6 - Créer le BuildConfig backend

Appliquer le manifest BuildConfig :

```bash
oc apply -f openshift/backend/buildconfig.yaml
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
coffee-shop-backend
```

---

### Étape 7 - Lancer le build backend

Lancer le build :

```bash
oc start-build coffee-shop-backend --follow
```

L'option `--follow` permet de suivre les logs du build en direct.

Pendant le build, OpenShift va :

```text
récupérer le code Git
se placer dans le dossier backend
lire le Dockerfile
installer les dépendances
copier le code applicatif
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
EXPOSE 8080
CMD npm start
Pushing image
Push successful
```

Message important :

```text
Un build n'est pas magique : les logs montrent les étapes de fabrication de l'image.
```

---

## 6. Commandes

Commandes principales du TP :

```bash
# Vérifier le projet courant
oc project

# Créer l'ImageStream backend
oc apply -f openshift/backend/imagestream.yaml

# Créer le BuildConfig backend
oc apply -f openshift/backend/buildconfig.yaml

# Vérifier les ressources de build
oc get is
oc get bc

# Lancer le build backend
oc start-build coffee-shop-backend --follow
```

Commandes d'observation complémentaires :

```bash
# Vérifier le statut du build
oc get builds

# Consulter les logs du build après coup
oc logs build/coffee-shop-backend-1

# Vérifier l'image produite
oc describe is coffee-shop-backend

# Afficher la configuration du BuildConfig
oc get bc coffee-shop-backend -o yaml
```

---

## 7. Vérifications

### Vérifier l'ImageStream

```bash
oc get is
```

Résultat attendu :

```text
coffee-shop-backend
```

---

### Vérifier le BuildConfig

```bash
oc get bc
```

Résultat attendu :

```text
coffee-shop-backend
```

---

### Vérifier le build

```bash
oc get builds
```

Résultat attendu :

```text
coffee-shop-backend-1   Complete
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
oc describe is coffee-shop-backend
```

Résultat attendu :

```text
Tags:
  latest
```

Cela signifie qu'une image backend a été produite et associée au tag :

```text
coffee-shop-backend:latest
```

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
BuildConfig coffee-shop-backend existe
Build coffee-shop-backend-1 est Complete
ImageStream coffee-shop-backend existe
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
oc get bc coffee-shop-backend -o yaml
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
contextDir: backend
```

Le Dockerfile doit se trouver ici :

```text
backend/Dockerfile
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
backend/package.json
backend/package-lock.json
```

Consulter les logs :

```bash
oc logs build/coffee-shop-backend-1
```

---

## 8. Questions de compréhension

### Question 1

Quel objet OpenShift décrit comment construire l'image ?

<details>
<summary>Réponse</summary>

```text
BuildConfig
```

</details>

---

### Question 2

Quel objet OpenShift suit l'image produite ?

<details>
<summary>Réponse</summary>

```text
ImageStream
```

</details>

---

### Question 3

À quoi sert `contextDir: backend` dans le BuildConfig ?

<details>
<summary>Réponse</summary>

Il indique à OpenShift que le build doit utiliser le sous-dossier `backend` du repository Git.

</details>

---

### Question 4

Quelle commande permet de lancer manuellement un build ?

<details>
<summary>Réponse</summary>

```bash
oc start-build coffee-shop-backend --follow
```

</details>

---

### Question 5

Le backend est-il déjà déployé après ce TP ?

<details>
<summary>Réponse</summary>

Non.

À ce stade, seule l'image backend est construite. Le déploiement du backend sera réalisé dans un prochain TP.

</details>

---

## 9. Résultat attendu

À la fin de ce TP :

- l'ImageStream `coffee-shop-backend` existe ;
- le BuildConfig `coffee-shop-backend` existe ;
- un build backend a été lancé ;
- le build est en statut `Complete` ;
- l'image `coffee-shop-backend:latest` est disponible dans OpenShift ;
- aucun Pod backend n'a encore été déployé dans ce TP.

Vérification rapide :

```bash
oc get bc
oc get builds
oc get is
```

Résultat attendu :

```text
BuildConfig coffee-shop-backend présent
Build coffee-shop-backend-1 Complete
ImageStream coffee-shop-backend présent avec un tag latest
```

---

## 10. Nettoyage

Aucun nettoyage n'est nécessaire à la fin de ce TP.

Les ressources créées seront utilisées dans les TP suivants.

Ne supprimez pas :

```text
BuildConfig coffee-shop-backend
ImageStream coffee-shop-backend
```

Si le formateur demande de supprimer uniquement les ressources de build backend :

```bash
oc delete -f openshift/backend/buildconfig.yaml
oc delete -f openshift/backend/imagestream.yaml
```

Attention : la suppression de l'ImageStream supprime la référence OpenShift à l'image construite.

---

## 11. Message clé

```text
Le build transforme le code backend en image de conteneur.
```

Phrase de synthèse :

```text
Je pars du code Git.
OpenShift lit le Dockerfile du backend.
OpenShift construit une image.
OpenShift stocke cette image dans un ImageStream.
Cette image servira ensuite à déployer le backend.
```

---

## 12. Transition vers le TP suivant

Dans le TP suivant, nous allons répéter la même logique pour le frontend.

Nous passerons de :

```text
Code frontend
→ Dockerfile frontend
→ BuildConfig frontend
→ Build OpenShift
→ ImageStream frontend
```

Après les TP 03 et TP 04, nous aurons les deux images nécessaires pour déployer l'application complète :

```text
coffee-shop-backend:latest
coffee-shop-frontend:latest
```
