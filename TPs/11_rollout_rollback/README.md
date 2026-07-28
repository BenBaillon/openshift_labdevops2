# TP 11 - Déployer une nouvelle version avec rollout / rollback

## 1. Objectif du TP

Ce TP a pour objectif de montrer comment OpenShift gère la mise à jour d'une application grâce au mécanisme de `rollout`, puis comment revenir à une version précédente avec un `rollback`.

Dans le TP précédent, nous avons fait évoluer l'application **OpenShift Coffee Shop** en augmentant le nombre de replicas du backend.

Dans ce TP, nous allons faire évoluer l'application d'une autre manière : en publiant une nouvelle version du backend.

À la fin de ce TP, vous devez être capable de :

- comprendre ce qu'est un rollout ;
- comprendre ce qu'est un rollback ;
- comprendre qu'une modification du template d'un Deployment déclenche un nouveau rollout ;
- modifier une variable d'environnement pour simuler une version `v2` ;
- observer le remplacement des Pods ;
- consulter l'historique de rollout ;
- revenir à la version précédente ;
- vérifier la version exposée par l'application.

Ce TP utilise une approche volontairement simple : la version applicative est simulée avec la variable d'environnement `APP_VERSION`.

Il se concentre sur la phase :

```text
Backend v1
→ Modification du Deployment
→ Rollout vers backend v2
→ Observation
→ Rollback vers backend v1
```

**Situation du TP :**

```text
Demi-journée 3
Chapitre 13 - Déployer une nouvelle version
Après TP 10 - Faire évoluer l'application avec le scaling
Avant TP 12 - Diagnostiquer une mauvaise configuration frontend/backend
```

---

## 2. Concepts abordés

Ce TP introduit ou renforce les concepts suivants :

- `Deployment` ;
- template de Pod ;
- `ReplicaSet` ;
- `Pod` ;
- rollout ;
- rollback ;
- historique de déploiement ;
- variable d'environnement ;
- remplacement progressif des Pods ;
- vérification applicative ;
- retour arrière.

L'objet principal manipulé est :

```text
Deployment coffee-shop-backend
```

La variable utilisée pour simuler une nouvelle version est :

```text
APP_VERSION
```

La version initiale est :

```text
v1
```

La version cible est :

```text
v2
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
→ Scaling
→ Nouvelle version
```

Le TP 11 correspond précisément à cette étape :

```text
Déployer une nouvelle version
```

Dans le TP précédent, nous avons modifié le nombre d'instances du backend.

Dans ce TP, nous allons modifier la version du backend.

Message clé :

```text
OpenShift permet de publier une nouvelle version de manière contrôlée et de revenir en arrière si nécessaire.
```

---

## 4. Pré-requis

Avant de commencer ce TP, vous devez avoir :

- terminé le TP 01 ;
- terminé le TP 02 ;
- terminé le TP 03 ;
- terminé le TP 04 ;
- terminé le TP 05 ;
- terminé le TP 06 ;
- terminé le TP 07 ;
- terminé le TP 08 ;
- terminé le TP 09 ;
- terminé le TP 10 ;
- accès à un cluster OpenShift ;
- accès à la CLI `oc` ;
- un Project OpenShift courant ;
- l'application Coffee Shop accessible depuis un navigateur ;
- le backend en état `Running` ;
- le frontend en état `Running` ;
- la Route backend créée ;
- la Route frontend créée.

Vérifier le Project courant :

```bash
oc project
```

Résultat attendu :

```text
Using project "coffee-shop-demo"
```

Vérifier que le backend est disponible :

```bash
oc get deployment coffee-shop-backend
oc get pods -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
Deployment backend disponible
Pod backend 1/1 Running
```

Vérifier que le backend répond :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
curl $BACKEND_ROUTE/api/version
```

Résultat attendu au début du TP :

```text
version: v1
```

---

## 5. Étapes détaillées

### Étape 1 - Vérifier la version initiale du backend

Récupérer l'URL de la Route backend :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
```

Tester l'endpoint de version :

```bash
curl $BACKEND_ROUTE/api/version
```

Résultat attendu :

```json
{
  "name": "Coffee Shop Backend",
  "version": "v1",
  "environment": "training",
  "message": "Bonjour depuis une ConfigMap OpenShift"
}
```

Message pédagogique :

```text
Avant de déployer une nouvelle version, il faut vérifier l'état actuel.
```

---

### Étape 2 - Observer le Deployment backend avant modification

Afficher le Deployment backend :

```bash
oc get deployment coffee-shop-backend
```

Résultat attendu :

```text
READY   UP-TO-DATE   AVAILABLE
1/1     1            1
```

Afficher les Pods backend :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
Un Pod backend est Running et Ready.
```

Afficher les ReplicaSets backend :

```bash
oc get rs -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
Un ReplicaSet actif est associé au Deployment backend.
```

---

### Étape 3 - Consulter l'historique de rollout initial

Afficher l'historique du Deployment :

```bash
oc rollout history deployment/coffee-shop-backend
```

Résultat possible :

```text
deployment.apps/coffee-shop-backend
REVISION  CHANGE-CAUSE
1         <none>
```

Selon les manipulations précédentes, plusieurs révisions peuvent déjà exister.

Message pédagogique :

```text
OpenShift conserve un historique des révisions du Deployment.
```

---

### Étape 4 - Déployer la version v2

Modifier la variable d'environnement `APP_VERSION` :

```bash
oc set env deployment/coffee-shop-backend APP_VERSION=v2
```

Cette commande modifie le template du Pod dans le Deployment.

Cette modification déclenche automatiquement un nouveau rollout.

Message pédagogique :

```text
Un rollout peut être déclenché par une nouvelle image, mais aussi par une modification du template du Pod.
```

---

### Étape 5 - Observer le rollout

Suivre le rollout :

```bash
oc rollout status deployment/coffee-shop-backend
```

Résultat attendu :

```text
deployment "coffee-shop-backend" successfully rolled out
```

Pendant quelques instants, OpenShift peut :

```text
créer un nouveau Pod
attendre qu'il soit Ready
supprimer l'ancien Pod
mettre à jour le ReplicaSet actif
```

---

### Étape 6 - Observer les Pods pendant ou après le rollout

Afficher les Pods backend :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Résultat attendu final :

```text
Un nouveau Pod backend est Running et Ready.
```

Pendant le rollout, il est possible de voir temporairement :

```text
ancien Pod en Terminating
nouveau Pod en Running
```

Message pédagogique :

```text
OpenShift remplace les Pods pour appliquer la nouvelle version du template.
```

---

### Étape 7 - Observer les ReplicaSets après rollout

Afficher les ReplicaSets backend :

```bash
oc get rs -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
Plusieurs ReplicaSets peuvent être visibles.
Le nouveau ReplicaSet porte la version active.
L'ancien ReplicaSet peut rester présent avec 0 replica.
```

Message pédagogique :

```text
Le Deployment garde des ReplicaSets précédents pour permettre un rollback.
```

---

### Étape 8 - Vérifier la version v2

Tester l'endpoint de version :

```bash
curl $BACKEND_ROUTE/api/version
```

Résultat attendu :

```json
{
  "name": "Coffee Shop Backend",
  "version": "v2",
  "environment": "training",
  "message": "Bonjour depuis une ConfigMap OpenShift"
}
```

Ouvrir également la Route frontend dans le navigateur.

Résultat attendu :

```text
La section Version backend affiche v2.
```

Il peut être nécessaire de rafraîchir la page.

---

### Étape 9 - Consulter l'historique après rollout

Afficher l'historique :

```bash
oc rollout history deployment/coffee-shop-backend
```

Résultat attendu :

```text
Au moins deux révisions sont visibles.
```

Exemple :

```text
REVISION  CHANGE-CAUSE
1         <none>
2         <none>
```

Selon les manipulations réalisées avant ce TP, les numéros de révision peuvent être différents.

---

### Étape 10 - Revenir à la version précédente

Effectuer un rollback :

```bash
oc rollout undo deployment/coffee-shop-backend
```

Suivre le rollback :

```bash
oc rollout status deployment/coffee-shop-backend
```

Résultat attendu :

```text
deployment "coffee-shop-backend" successfully rolled out
```

Message pédagogique :

```text
Le rollback restaure une révision précédente du Deployment.
```

---

### Étape 11 - Vérifier le retour en version v1

Tester à nouveau l'endpoint de version :

```bash
curl $BACKEND_ROUTE/api/version
```

Résultat attendu :

```json
{
  "name": "Coffee Shop Backend",
  "version": "v1",
  "environment": "training",
  "message": "Bonjour depuis une ConfigMap OpenShift"
}
```

Vérifier également dans le frontend :

```text
Version backend : v1
```

---

### Étape 12 - Vérifier l'état final du backend

Afficher le Deployment backend :

```bash
oc get deployment coffee-shop-backend
```

Afficher les Pods backend :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Afficher les ReplicaSets backend :

```bash
oc get rs -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
Deployment disponible
Pod backend 1/1 Running
Version backend revenue à v1
```

---

## 6. Commandes

Commandes principales du TP :

```bash
# Vérifier la Route backend
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')

# Vérifier la version initiale
curl $BACKEND_ROUTE/api/version

# Observer l'état initial
oc get deployment coffee-shop-backend
oc get pods -l app=coffee-shop,component=backend
oc get rs -l app=coffee-shop,component=backend
oc rollout history deployment/coffee-shop-backend

# Passer en version v2
oc set env deployment/coffee-shop-backend APP_VERSION=v2

# Suivre le rollout
oc rollout status deployment/coffee-shop-backend

# Observer les ressources
oc get pods -l app=coffee-shop,component=backend
oc get rs -l app=coffee-shop,component=backend

# Vérifier la version v2
curl $BACKEND_ROUTE/api/version

# Voir l'historique
oc rollout history deployment/coffee-shop-backend

# Revenir en arrière
oc rollout undo deployment/coffee-shop-backend
oc rollout status deployment/coffee-shop-backend

# Vérifier le retour en v1
curl $BACKEND_ROUTE/api/version
```

Commandes d'observation complémentaires :

```bash
# Décrire le Deployment
oc describe deployment coffee-shop-backend

# Voir les logs backend
oc logs deployment/coffee-shop-backend

# Afficher le Deployment en YAML
oc get deployment coffee-shop-backend -o yaml

# Voir les Events récents
oc get events --sort-by=.lastTimestamp
```

---

## 7. Vérifications

### Vérifier la version initiale

```bash
curl $BACKEND_ROUTE/api/version
```

Résultat attendu avant modification :

```text
version: v1
```

---

### Vérifier le rollout vers v2

```bash
oc set env deployment/coffee-shop-backend APP_VERSION=v2
oc rollout status deployment/coffee-shop-backend
```

Résultat attendu :

```text
Rollout terminé avec succès
```

---

### Vérifier la version v2

```bash
curl $BACKEND_ROUTE/api/version
```

Résultat attendu :

```text
version: v2
```

---

### Vérifier l'historique

```bash
oc rollout history deployment/coffee-shop-backend
```

Résultat attendu :

```text
Plusieurs révisions sont visibles.
```

---

### Vérifier le rollback

```bash
oc rollout undo deployment/coffee-shop-backend
oc rollout status deployment/coffee-shop-backend
```

Résultat attendu :

```text
Rollback terminé avec succès
```

---

### Vérifier le retour en v1

```bash
curl $BACKEND_ROUTE/api/version
```

Résultat attendu :

```text
version: v1
```

---

### Erreurs fréquentes à vérifier

#### La version ne change pas dans le frontend

Causes possibles :

```text
Page navigateur non rafraîchie
Cache navigateur
Frontend appelle une mauvaise URL backend
Rollout backend pas terminé
```

Commandes utiles :

```bash
curl $BACKEND_ROUTE/api/version
oc rollout status deployment/coffee-shop-backend
oc get configmap coffee-shop-frontend-config -o yaml
```

---

#### Le rollout ne se termine pas

Commandes utiles :

```bash
oc get pods -l app=coffee-shop,component=backend
oc describe pod <pod-name>
oc logs deployment/coffee-shop-backend
oc get events --sort-by=.lastTimestamp
```

---

#### Le rollback ne revient pas à la version attendue

Vérifier l'historique :

```bash
oc rollout history deployment/coffee-shop-backend
```

Revenir explicitement à l'état souhaité :

```bash
oc set env deployment/coffee-shop-backend APP_VERSION=v1
oc rollout status deployment/coffee-shop-backend
```

---

## 8. Questions de compréhension

### Question 1

Quel objet OpenShift gère le rollout d'une application ?

<details>
<summary>Réponse</summary>

```text
Deployment
```

</details>

---

### Question 2

Quelle commande permet de suivre l'état d'un rollout ?

<details>
<summary>Réponse</summary>

```bash
oc rollout status deployment/coffee-shop-backend
```

</details>

---

### Question 3

Quelle commande permet d'afficher l'historique des révisions ?

<details>
<summary>Réponse</summary>

```bash
oc rollout history deployment/coffee-shop-backend
```

</details>

---

### Question 4

Quelle commande permet de revenir à la version précédente ?

<details>
<summary>Réponse</summary>

```bash
oc rollout undo deployment/coffee-shop-backend
```

</details>

---

### Question 5

Dans ce TP, avons-nous reconstruit une nouvelle image ?

<details>
<summary>Réponse</summary>

Non.

Dans ce TP, nous avons modifié une variable d'environnement dans le Deployment. Cette modification du template du Pod déclenche un rollout, mais elle ne reconstruit pas une nouvelle image.

</details>

---

## 9. Résultat attendu

À la fin de ce TP :

- le backend a été observé en version `v1` ;
- le backend a été passé en version `v2` ;
- un rollout a été déclenché ;
- un nouveau Pod backend a été créé ;
- l'historique de rollout a été consulté ;
- un rollback a été effectué ;
- le backend est revenu en version `v1` ;
- l'application reste accessible et fonctionnelle.

Vérification rapide :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
curl $BACKEND_ROUTE/api/version
oc get deployment coffee-shop-backend
oc get pods -l app=coffee-shop,component=backend
oc rollout history deployment/coffee-shop-backend
```

Résultat attendu final :

```text
Backend version v1
Deployment disponible
Pod backend 1/1 Running
Historique de rollout visible
```

---

## 10. Nettoyage

Le nettoyage consiste à s'assurer que le backend est revenu en version `v1`.

Exécuter :

```bash
oc set env deployment/coffee-shop-backend APP_VERSION=v1
oc rollout status deployment/coffee-shop-backend
```

Vérifier :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
curl $BACKEND_ROUTE/api/version
```

Résultat attendu :

```text
version: v1
```

Ne supprimez pas les ressources suivantes :

```text
Deployment coffee-shop-backend
Service coffee-shop-backend
Route coffee-shop-backend
Deployment coffee-shop-frontend
Service coffee-shop-frontend
Route coffee-shop-frontend
```

Elles seront utilisées dans les TP suivants.

---

## 11. Message clé

```text
OpenShift permet de publier une nouvelle version et de revenir en arrière.
```

Phrase de synthèse :

```text
Je modifie le Deployment.
OpenShift crée une nouvelle révision.
OpenShift remplace les Pods.
Je vérifie la nouvelle version.
Si nécessaire, je déclenche un rollback.
L'application revient à la version précédente.
```

---

## 12. Transition vers le TP suivant

Dans ce TP, nous avons fait évoluer l'application en publiant une nouvelle version du backend.

Dans le TP suivant, nous allons commencer la partie dépannage.

Nous allons créer une panne volontaire de configuration entre le frontend et le backend.

Nous passerons de :

```text
Application fonctionnelle
→ Mauvaise configuration BACKEND_URL
→ Frontend accessible mais backend inaccessible
→ Diagnostic
→ Correction
```

Le prochain objectif sera donc :

```text
Diagnostiquer et corriger une mauvaise configuration frontend/backend.
```
