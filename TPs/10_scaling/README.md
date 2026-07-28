# TP 10 - Faire évoluer l'application avec le scaling

## 1. Objectif du TP

Ce TP a pour objectif de faire évoluer l'application **OpenShift Coffee Shop** en augmentant le nombre d'instances du backend.

Dans les TP précédents, nous avons construit et déployé l'application complète :

```text
Backend construit
Backend déployé
Backend configuré
Backend exposé
Frontend construit
Frontend déployé
Frontend configuré
Frontend exposé
Application accessible depuis un navigateur
```

Dans ce TP, nous allons modifier le nombre de replicas du backend afin de passer d'une seule instance à plusieurs instances.

À la fin de ce TP, vous devez être capable de :

- comprendre le rôle du champ `replicas` ;
- comprendre le lien entre `Deployment`, `ReplicaSet` et `Pod` ;
- scaler manuellement un Deployment ;
- observer la création de nouveaux Pods ;
- vérifier que le Service backend pointe vers plusieurs Pods ;
- comprendre que le Service reste stable même si le nombre de Pods change ;
- revenir à l'état nominal avec un seul replica.

Ce TP correspond au premier exercice de la demi-journée 3 : faire vivre l'application une fois qu'elle est déployée.

Il se concentre sur la phase :

```text
1 Pod backend
→ Scaling
→ 3 Pods backend
→ Service avec plusieurs endpoints
→ Retour à 1 Pod backend
```

**Situation du TP :**

```text
Demi-journée 3
Chapitre 12 - Faire évoluer l'application
Après TP 09 - Déployer et connecter le frontend
Avant TP 11 - Déployer une nouvelle version avec rollout / rollback
```

---

## 2. Concepts abordés

Ce TP introduit ou renforce les concepts suivants :

- `Deployment` ;
- `ReplicaSet` ;
- `Pod` ;
- replicas ;
- scaling manuel ;
- état désiré ;
- état réel ;
- `Service` ;
- endpoints ;
- disponibilité applicative ;
- observation des ressources OpenShift.

L'objet principal manipulé est :

```text
Deployment coffee-shop-backend
```

Le backend sera scalé de :

```text
1 replica
```

vers :

```text
3 replicas
```

puis ramené à :

```text
1 replica
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
```

Le TP 10 correspond précisément à cette étape :

```text
Faire évoluer l'application
```

Dans le TP précédent, l'application complète était accessible depuis un navigateur.

Dans ce TP, nous allons montrer qu'une application déployée peut évoluer en augmentant le nombre d'instances disponibles.

Message clé :

```text
Pour absorber plus de charge ou améliorer la disponibilité, OpenShift peut lancer plusieurs instances d'une même application.
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
- accès à un cluster OpenShift ;
- accès à la CLI `oc` ;
- un Project OpenShift courant ;
- l'application Coffee Shop accessible depuis un navigateur ;
- le backend en état `Running` ;
- le frontend en état `Running` ;
- les Routes backend et frontend créées.

Vérifier le Project courant :

```bash
oc project
```

Résultat attendu :

```text
Using project "coffee-shop-demo"
```

Vérifier que l'application est déployée :

```bash
oc get deployment coffee-shop-backend
oc get deployment coffee-shop-frontend
oc get pods
oc get svc
oc get route
```

Résultat attendu :

```text
Backend disponible
Frontend disponible
Pods Running
Services présents
Routes présentes
```

Vérifier que le backend répond :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
curl $BACKEND_ROUTE/health
```

Résultat attendu :

```json
{
  "status": "OK",
  "service": "Coffee Shop Backend"
}
```

---

## 5. Étapes détaillées

### Étape 1 - Observer l'état initial du backend

Afficher le Deployment backend :

```bash
oc get deployment coffee-shop-backend
```

Résultat attendu au début du TP :

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
Un seul Pod backend est Running et Ready.
```

Exemple :

```text
NAME                                  READY   STATUS    RESTARTS   AGE
coffee-shop-backend-xxxxxxxxx-yyyyy   1/1     Running   0          10m
```

Message pédagogique :

```text
Le Deployment demande actuellement une seule instance du backend.
```

---

### Étape 2 - Observer le ReplicaSet backend

Afficher les ReplicaSets backend :

```bash
oc get rs -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
Un ReplicaSet existe avec 1 replica désiré, 1 replica courant et 1 replica prêt.
```

Exemple :

```text
NAME                            DESIRED   CURRENT   READY
coffee-shop-backend-xxxxxxxxx   1         1         1
```

Message pédagogique :

```text
Le Deployment pilote le ReplicaSet.
Le ReplicaSet maintient le nombre de Pods demandé.
```

---

### Étape 3 - Observer le Service backend avant scaling

Décrire le Service backend :

```bash
oc describe svc coffee-shop-backend
```

Observer la ligne :

```text
Endpoints: <IP_DU_POD>:8080
```

À ce stade, le Service backend pointe vers un seul Pod backend.

Message pédagogique :

```text
Le Service fournit un point d'accès stable vers le ou les Pods backend.
```

---

### Étape 4 - Scaler le backend à 3 replicas

Modifier le nombre de replicas du backend :

```bash
oc scale deployment/coffee-shop-backend --replicas=3
```

Cette commande modifie l'état désiré du Deployment.

OpenShift va créer de nouveaux Pods afin d'atteindre l'état demandé.

Message pédagogique :

```text
Nous ne créons pas les Pods manuellement.
Nous demandons au Deployment d'avoir 3 replicas.
OpenShift crée les Pods nécessaires.
```

---

### Étape 5 - Observer le Deployment pendant le scaling

Afficher le Deployment :

```bash
oc get deployment coffee-shop-backend
```

Résultats possibles pendant quelques secondes :

```text
READY
1/3
2/3
3/3
```

Résultat attendu final :

```text
READY   UP-TO-DATE   AVAILABLE
3/3     3            3
```

Message pédagogique :

```text
OpenShift converge progressivement vers l'état désiré.
```

---

### Étape 6 - Observer les Pods backend après scaling

Afficher les Pods backend :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
Trois Pods backend sont Running et Ready.
```

Exemple :

```text
NAME                                  READY   STATUS    RESTARTS   AGE
coffee-shop-backend-xxxxxxxxx-aaaaa   1/1     Running   0          1m
coffee-shop-backend-xxxxxxxxx-bbbbb   1/1     Running   0          1m
coffee-shop-backend-xxxxxxxxx-ccccc   1/1     Running   0          1m
```

Message pédagogique :

```text
Les trois Pods exécutent la même application backend.
```

---

### Étape 7 - Observer le ReplicaSet après scaling

Afficher les ReplicaSets backend :

```bash
oc get rs -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
Le ReplicaSet indique 3 replicas désirés, 3 courants et 3 prêts.
```

Exemple :

```text
NAME                            DESIRED   CURRENT   READY
coffee-shop-backend-xxxxxxxxx   3         3         3
```

Message pédagogique :

```text
Le ReplicaSet maintient le nombre de Pods demandé par le Deployment.
```

---

### Étape 8 - Observer le Service backend après scaling

Décrire le Service backend :

```bash
oc describe svc coffee-shop-backend
```

Observer la ligne :

```text
Endpoints: <IP_POD_1>:8080,<IP_POD_2>:8080,<IP_POD_3>:8080
```

Le Service backend pointe maintenant vers plusieurs Pods.

Message pédagogique :

```text
Le Service reste le même, mais ses endpoints changent pour inclure les nouveaux Pods.
```

---

### Étape 9 - Tester l'application après scaling

Tester le backend via la Route :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
curl $BACKEND_ROUTE/health
curl $BACKEND_ROUTE/api/products
curl $BACKEND_ROUTE/api/version
```

Résultat attendu :

```text
L'application continue de répondre normalement.
```

Ouvrir également la Route frontend dans un navigateur.

Résultat attendu :

```text
Le frontend reste accessible.
Le statut backend reste OK.
Les produits sont toujours affichés.
```

Message pédagogique :

```text
Même si le nombre de Pods change, l'utilisateur continue d'utiliser la même Route.
```

---

### Étape 10 - Observer les logs avec plusieurs Pods

Afficher les Pods backend :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Afficher les logs d'un Pod précis :

```bash
oc logs <pod-name>
```

Ou afficher les logs via le Deployment :

```bash
oc logs deployment/coffee-shop-backend
```

Message pédagogique :

```text
Quand une application tourne sur plusieurs Pods, il faut parfois regarder les logs d'une instance précise.
```

---

### Étape 11 - Revenir à 1 replica

Revenir à l'état nominal :

```bash
oc scale deployment/coffee-shop-backend --replicas=1
```

Observer le Deployment :

```bash
oc get deployment coffee-shop-backend
```

Observer les Pods :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
OpenShift supprime les Pods en trop.
Il ne reste qu'un seul Pod backend Running et Ready.
```

---

### Étape 12 - Vérifier le Service après retour à 1 replica

Décrire le Service backend :

```bash
oc describe svc coffee-shop-backend
```

Résultat attendu :

```text
Endpoints: <IP_DU_POD>:8080
```

Tester le backend :

```bash
curl $BACKEND_ROUTE/health
```

Résultat attendu :

```json
{
  "status": "OK",
  "service": "Coffee Shop Backend"
}
```

---

## 6. Commandes

Commandes principales du TP :

```bash
# Vérifier le projet courant
oc project

# Observer l'état initial
oc get deployment coffee-shop-backend
oc get pods -l app=coffee-shop,component=backend
oc get rs -l app=coffee-shop,component=backend
oc describe svc coffee-shop-backend

# Scaler le backend à 3 replicas
oc scale deployment/coffee-shop-backend --replicas=3

# Observer le scaling
oc get deployment coffee-shop-backend
oc get pods -l app=coffee-shop,component=backend
oc get rs -l app=coffee-shop,component=backend
oc describe svc coffee-shop-backend

# Tester l'application
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
curl $BACKEND_ROUTE/health
curl $BACKEND_ROUTE/api/products

# Revenir à 1 replica
oc scale deployment/coffee-shop-backend --replicas=1

# Vérifier le retour nominal
oc get deployment coffee-shop-backend
oc get pods -l app=coffee-shop,component=backend
oc describe svc coffee-shop-backend
```

Commandes d'observation complémentaires :

```bash
# Décrire le Deployment
oc describe deployment coffee-shop-backend

# Afficher le Deployment en YAML
oc get deployment coffee-shop-backend -o yaml

# Voir les logs d'un Pod précis
oc logs <pod-name>

# Voir les Events récents
oc get events --sort-by=.lastTimestamp
```

---

## 7. Vérifications

### Vérifier le Deployment après scaling

```bash
oc get deployment coffee-shop-backend
```

Résultat attendu après scaling :

```text
READY   UP-TO-DATE   AVAILABLE
3/3     3            3
```

---

### Vérifier les Pods après scaling

```bash
oc get pods -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
Trois Pods backend sont Running et Ready.
```

---

### Vérifier le ReplicaSet

```bash
oc get rs -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
DESIRED   CURRENT   READY
3         3         3
```

---

### Vérifier les endpoints du Service

```bash
oc describe svc coffee-shop-backend
```

Résultat attendu après scaling :

```text
Endpoints: <IP_POD_1>:8080,<IP_POD_2>:8080,<IP_POD_3>:8080
```

---

### Vérifier l'application

```bash
curl $BACKEND_ROUTE/health
```

Résultat attendu :

```text
status OK
```

Le frontend doit également continuer à afficher :

```text
Statut backend : OK
Produits affichés
```

---

### Vérifier le retour à 1 replica

```bash
oc scale deployment/coffee-shop-backend --replicas=1
oc get deployment coffee-shop-backend
oc get pods -l app=coffee-shop,component=backend
oc describe svc coffee-shop-backend
```

Résultat attendu :

```text
Deployment 1/1
Un seul Pod backend Running
Un seul endpoint backend dans le Service
```

---

### Erreurs fréquentes à vérifier

#### Les Pods ne passent pas en Running

Commandes utiles :

```bash
oc get pods
oc describe pod <pod-name>
oc logs <pod-name>
oc get events --sort-by=.lastTimestamp
```

---

#### Le Service n'affiche pas 3 endpoints

Vérifier les labels des Pods :

```bash
oc get pods -l app=coffee-shop,component=backend --show-labels
```

Vérifier le selector du Service :

```bash
oc describe svc coffee-shop-backend
```

---

#### L'application ne répond plus après scaling

Vérifier :

```bash
oc get pods -l app=coffee-shop,component=backend
oc describe svc coffee-shop-backend
oc get route coffee-shop-backend
curl $BACKEND_ROUTE/health
```

---

## 8. Questions de compréhension

### Question 1

Quel objet OpenShift modifie-t-on pour changer le nombre d'instances du backend ?

<details>
<summary>Réponse</summary>

```text
Deployment
```

</details>

---

### Question 2

Quelle commande permet de passer le backend à 3 replicas ?

<details>
<summary>Réponse</summary>

```bash
oc scale deployment/coffee-shop-backend --replicas=3
```

</details>

---

### Question 3

Quel objet maintient réellement le nombre de Pods demandé ?

<details>
<summary>Réponse</summary>

```text
ReplicaSet
```

</details>

---

### Question 4

Le Service change-t-il de nom lorsque le nombre de Pods change ?

<details>
<summary>Réponse</summary>

Non.

Le Service reste le même. Ce sont ses endpoints qui changent.

</details>

---

### Question 5

Comment vérifier que le Service pointe vers plusieurs Pods ?

<details>
<summary>Réponse</summary>

Avec la commande :

```bash
oc describe svc coffee-shop-backend
```

Il faut observer la ligne `Endpoints`.

</details>

---

## 9. Résultat attendu

À la fin de ce TP :

- le backend a été scalé à 3 replicas ;
- trois Pods backend ont été créés ;
- le ReplicaSet backend indique 3 Pods désirés et prêts ;
- le Service backend possède plusieurs endpoints ;
- l'application continue de répondre ;
- le backend a ensuite été ramené à 1 replica ;
- l'application reste fonctionnelle après retour à l'état nominal.

Vérification rapide après scaling :

```bash
oc get deployment coffee-shop-backend
oc get pods -l app=coffee-shop,component=backend
oc get rs -l app=coffee-shop,component=backend
oc describe svc coffee-shop-backend
```

Résultat attendu :

```text
Deployment 3/3
Trois Pods Running
ReplicaSet 3/3
Service avec trois endpoints
```

Vérification après retour nominal :

```text
Deployment 1/1
Un seul Pod Running
Service avec un endpoint
```

---

## 10. Nettoyage

Le nettoyage consiste à revenir à l'état nominal avec un seul backend.

Exécuter :

```bash
oc scale deployment/coffee-shop-backend --replicas=1
```

Vérifier :

```bash
oc get deployment coffee-shop-backend
oc get pods -l app=coffee-shop,component=backend
oc describe svc coffee-shop-backend
```

Résultat attendu :

```text
Deployment 1/1
Un seul Pod backend Running
Un seul endpoint backend
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
Scaler une application consiste à modifier le nombre de replicas souhaités.
```

Phrase de synthèse :

```text
Je demande 3 replicas au Deployment.
OpenShift crée 3 Pods backend.
Le ReplicaSet maintient ces Pods.
Le Service conserve une adresse stable.
Les endpoints du Service évoluent automatiquement.
Je peux revenir à 1 replica à tout moment.
```

---

## 12. Transition vers le TP suivant

Dans ce TP, nous avons fait évoluer l'application en augmentant le nombre d'instances du backend.

Dans le TP suivant, nous allons faire évoluer l'application d'une autre manière : en publiant une nouvelle version.

Nous passerons de :

```text
Backend v1
→ Rollout vers backend v2
→ Observation du rollout
→ Rollback vers v1
```

Le prochain objectif sera donc :

```text
Déployer une nouvelle version de l'application et revenir en arrière si nécessaire.
```
