# TP 05 - Déployer le backend sur OpenShift

## 1. Objectif du TP

Ce TP a pour objectif de déployer le backend de l'application **OpenShift Coffee Shop** à partir de l'image construite dans les TP précédents.

Dans les TP 03 et TP 04, nous avons demandé à OpenShift de construire les images suivantes :

```text
coffee-shop-backend:latest
coffee-shop-frontend:latest
```

Dans ce TP, nous allons utiliser l'image backend pour créer un `Deployment` et faire démarrer le premier Pod backend.

À la fin de ce TP, vous devez être capable de :

- comprendre le rôle d'un `Deployment` ;
- comprendre le lien entre `Deployment`, `ReplicaSet` et `Pod` ;
- déployer le backend à partir d'une image OpenShift ;
- observer la création d'un Pod ;
- vérifier l'état du Pod backend ;
- consulter les logs du backend ;
- comprendre que le Pod est l'endroit où l'application s'exécute réellement.

Ce TP ne crée pas encore de `Service` ni de `Route`.

Il se concentre sur la phase :

```text
Image backend
→ Deployment backend
→ Pod backend
```

**Situation du TP :**

```text
Demi-journée 2
Chapitre 8 - Déployer l'application
Après TP 04 - Construire l'image frontend avec OpenShift
Avant TP 06 - Configurer le backend avec ConfigMap et Secret
```

---

## 2. Concepts abordés

Ce TP introduit les concepts suivants :

- `Deployment` ;
- `ReplicaSet` ;
- `Pod` ;
- image applicative ;
- template de Pod ;
- état désiré ;
- état réel ;
- logs applicatifs ;
- probes applicatives ;
- cycle de vie d'une application.

Dans ce TP, l'objet principal est :

```text
Deployment
```

Le Deployment backend s'appelle :

```text
coffee-shop-backend
```

Le Deployment va créer un Pod backend à partir de l'image :

```text
coffee-shop-backend:latest
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

Le TP 05 correspond précisément à cette étape :

```text
Image
→ Deployment
→ Pod
```

Dans les TP précédents, nous avons construit les images backend et frontend.

Dans ce TP, nous commençons à exécuter l'application dans OpenShift.

Message clé :

```text
Le Pod exécute l'application.
Le Deployment pilote le cycle de vie des Pods.
```

---

## 4. Pré-requis

Avant de commencer ce TP, vous devez avoir :

- terminé le TP 01 ;
- terminé le TP 02 ;
- terminé le TP 03 ;
- terminé le TP 04 ;
- accès à un cluster OpenShift ;
- accès à la CLI `oc` ;
- un Project OpenShift courant ;
- l'ImageStream `coffee-shop-backend` disponible ;
- un build backend en statut `Complete`.

Vérifier le Project courant :

```bash
oc project
```

Résultat attendu :

```text
Using project "coffee-shop-demo"
```

Vérifier que l'image backend est disponible :

```bash
oc get is coffee-shop-backend
```

Vérifier les builds :

```bash
oc get builds
```

Résultat attendu :

```text
coffee-shop-backend-1   Complete
```

---

## 5. Étapes détaillées

### Étape 1 - Observer le manifest Deployment backend

Ouvrir le fichier :

```text
openshift/backend/deployment.yaml
```

Repérer le type de ressource :

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: coffee-shop-backend
```

Ce fichier décrit comment OpenShift doit exécuter le backend.

---

### Étape 2 - Comprendre le nombre de replicas

Dans le manifest, repérer :

```yaml
spec:
  replicas: 1
```

Cela signifie :

```text
Je veux une instance du backend.
```

OpenShift va donc chercher à maintenir un Pod backend disponible.

Message pédagogique :

```text
Le Deployment décrit l'état désiré.
OpenShift essaie en permanence de faire correspondre l'état réel à cet état désiré.
```

---

### Étape 3 - Comprendre le selector du Deployment

Repérer la section :

```yaml
selector:
  matchLabels:
    app: coffee-shop
    component: backend
```

Le Deployment utilise ces labels pour identifier les Pods qu'il pilote.

Repérer également les labels du template de Pod :

```yaml
template:
  metadata:
    labels:
      app: coffee-shop
      component: backend
```

Les labels du Pod doivent correspondre au selector du Deployment.

---

### Étape 4 - Comprendre le conteneur backend

Dans le manifest, repérer le conteneur :

```yaml
containers:
  - name: coffee-shop-backend
    image: coffee-shop-backend:latest
```

Cela indique que le Pod backend doit exécuter un conteneur basé sur l'image backend construite précédemment.

Repérer également le port exposé par le conteneur :

```yaml
ports:
  - containerPort: 8080
```

Le backend écoute sur le port :

```text
8080
```

---

### Étape 5 - Observer les probes

Dans le manifest, repérer les probes :

```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8080

livenessProbe:
  httpGet:
    path: /health
    port: 8080
```

La readiness probe permet à OpenShift de savoir si l'application est prête à recevoir du trafic.

La liveness probe permet à OpenShift de savoir si l'application est encore vivante.

Message pédagogique :

```text
OpenShift ne se contente pas de démarrer un conteneur.
OpenShift vérifie aussi que l'application fonctionne correctement.
```

---

### Étape 6 - Appliquer le Deployment backend

Appliquer le manifest :

```bash
oc apply -f openshift/backend/deployment.yaml
```

OpenShift crée alors un Deployment backend.

Ce Deployment va créer un ReplicaSet, puis un Pod.

---

### Étape 7 - Observer le Deployment

Afficher le Deployment :

```bash
oc get deployment coffee-shop-backend
```

Résultat attendu après quelques instants :

```text
READY   UP-TO-DATE   AVAILABLE
1/1     1            1
```

Si le Pod est encore en cours de démarrage, vous pouvez voir temporairement :

```text
0/1
```

---

### Étape 8 - Observer le Pod backend

Afficher les Pods backend :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
Un Pod backend est Running et Ready.
```

Exemple :

```text
NAME                                  READY   STATUS    RESTARTS   AGE
coffee-shop-backend-xxxxxxxxx-yyyyy   1/1     Running   0          1m
```

Message pédagogique :

```text
Le Pod est l'unité qui exécute réellement l'application.
```

---

### Étape 9 - Observer le ReplicaSet

Afficher les ReplicaSets backend :

```bash
oc get rs -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
Un ReplicaSet associé au Deployment backend existe.
```

Exemple :

```text
NAME                            DESIRED   CURRENT   READY
coffee-shop-backend-xxxxxxxxx   1         1         1
```

Message pédagogique :

```text
Le Deployment pilote un ReplicaSet.
Le ReplicaSet maintient le nombre de Pods demandé.
```

---

### Étape 10 - Consulter les logs du backend

Afficher les logs du backend :

```bash
oc logs deployment/coffee-shop-backend
```

Résultat attendu :

```text
Le backend indique qu'il a démarré sur le port 8080.
```

Les logs peuvent être au format JSON.

Message pédagogique :

```text
Les logs permettent de vérifier ce que l'application fait réellement dans le Pod.
```

---

## 6. Commandes

Commandes principales du TP :

```bash
# Vérifier le projet courant
oc project

# Vérifier l'image backend
oc get is coffee-shop-backend

# Appliquer le Deployment backend
oc apply -f openshift/backend/deployment.yaml

# Observer le Deployment
oc get deployment coffee-shop-backend

# Observer les Pods backend
oc get pods -l app=coffee-shop,component=backend

# Observer les ReplicaSets backend
oc get rs -l app=coffee-shop,component=backend

# Consulter les logs backend
oc logs deployment/coffee-shop-backend
```

Commandes d'observation complémentaires :

```bash
# Décrire le Deployment
oc describe deployment coffee-shop-backend

# Décrire un Pod
oc describe pod <pod-name>

# Afficher le Deployment en YAML
oc get deployment coffee-shop-backend -o yaml

# Afficher les Events récents
oc get events --sort-by=.lastTimestamp
```

---

## 7. Vérifications

### Vérifier le Deployment

```bash
oc get deployment coffee-shop-backend
```

Résultat attendu :

```text
coffee-shop-backend   1/1
```

---

### Vérifier le Pod

```bash
oc get pods -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
READY   STATUS
1/1     Running
```

---

### Vérifier le ReplicaSet

```bash
oc get rs -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
DESIRED   CURRENT   READY
1         1         1
```

---

### Vérifier les logs

```bash
oc logs deployment/coffee-shop-backend
```

Résultat attendu :

```text
Le backend démarre correctement.
Le port utilisé est 8080.
```

---

### Vérifier dans la console OpenShift

Dans la console web OpenShift, vérifier :

```text
Workloads
→ Deployments
→ coffee-shop-backend
```

Puis vérifier :

```text
Pods
→ Pod backend Running
```

Dans la vue Topology, le composant backend peut apparaître.

À ce stade, le backend n'est pas encore accessible depuis l'extérieur car aucun Service ni Route n'a encore été créé dans ce TP.

---

### Erreurs fréquentes à vérifier

#### Image introuvable

Symptôme possible :

```text
ImagePullBackOff
ErrImagePull
```

À vérifier :

```bash
oc get is coffee-shop-backend
oc describe pod <pod-name>
```

Cause possible :

```text
Le build backend n'a pas été réalisé ou l'image n'a pas été produite.
```

---

#### Pod non Ready

Symptôme possible :

```text
READY 0/1
```

À vérifier :

```bash
oc describe pod <pod-name>
oc logs deployment/coffee-shop-backend
```

Cause possible :

```text
Probes en erreur
Application non démarrée
Configuration manquante
```

---

#### Deployment absent

Symptôme possible :

```text
deployments.apps "coffee-shop-backend" not found
```

Correction :

```bash
oc apply -f openshift/backend/deployment.yaml
```

---

## 8. Questions de compréhension

### Question 1

Quel objet OpenShift pilote le cycle de vie des Pods backend ?

<details>
<summary>Réponse</summary>

```text
Deployment
```

</details>

---

### Question 2

Quel objet exécute réellement l'application backend ?

<details>
<summary>Réponse</summary>

```text
Pod
```

</details>

---

### Question 3

Quel est le rôle du ReplicaSet ?

<details>
<summary>Réponse</summary>

Le ReplicaSet maintient le nombre de Pods demandé par le Deployment.

</details>

---

### Question 4

Le backend est-il accessible depuis un navigateur à la fin de ce TP ?

<details>
<summary>Réponse</summary>

Non.

À ce stade, le backend tourne dans un Pod, mais aucun Service ni Route n'a encore été créé dans ce TP.

</details>

---

### Question 5

Quelle commande permet de voir les logs du backend ?

<details>
<summary>Réponse</summary>

```bash
oc logs deployment/coffee-shop-backend
```

</details>

---

## 9. Résultat attendu

À la fin de ce TP :

- le Deployment `coffee-shop-backend` existe ;
- un ReplicaSet backend existe ;
- un Pod backend est créé ;
- le Pod backend est en état `Running` ;
- le Pod backend est `Ready` ;
- les logs indiquent que le backend a démarré ;
- le backend n'est pas encore exposé par un Service ou une Route.

Vérification rapide :

```bash
oc get deployment coffee-shop-backend
oc get rs -l app=coffee-shop,component=backend
oc get pods -l app=coffee-shop,component=backend
oc logs deployment/coffee-shop-backend
```

Résultat attendu :

```text
Deployment disponible
ReplicaSet disponible
Pod 1/1 Running
Logs backend visibles
```

---

## 10. Nettoyage

Aucun nettoyage n'est nécessaire à la fin de ce TP.

Les ressources créées seront utilisées dans les TP suivants.

Ne supprimez pas :

```text
Deployment coffee-shop-backend
Pod backend
ReplicaSet backend
```

Si le formateur demande de supprimer uniquement le Deployment backend :

```bash
oc delete -f openshift/backend/deployment.yaml
```

Attention : supprimer le Deployment supprime également les Pods pilotés par ce Deployment.

---

## 11. Message clé

```text
Le Pod exécute l'application.
Le Deployment pilote le cycle de vie des Pods.
```

Phrase de synthèse :

```text
Nous avions une image backend.
Nous avons créé un Deployment.
OpenShift a créé un ReplicaSet.
Le ReplicaSet a créé un Pod.
Le Pod exécute le backend.
```

---

## 12. Transition vers le TP suivant

Dans ce TP, nous avons déployé le backend sous forme de Pod.

Mais pour l'instant, le backend utilise seulement la configuration fournie par défaut dans l'image ou dans le Deployment.

Dans le TP suivant, nous allons introduire la configuration applicative :

```text
ConfigMap
Secret
Variables d'environnement
```

Le prochain objectif sera donc :

```text
Configurer le backend sans modifier son code.
```
