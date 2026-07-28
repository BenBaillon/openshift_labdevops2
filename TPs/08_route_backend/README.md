# TP 08 - Exposer le backend avec une Route

## 1. Objectif du TP

Ce TP a pour objectif d'exposer le backend de l'application **OpenShift Coffee Shop** à l'extérieur du cluster OpenShift grâce à une `Route`.

Dans le TP précédent, nous avons créé un `Service` backend. Ce Service fournit un point d'accès stable vers le Pod backend, mais uniquement à l'intérieur du cluster.

Dans ce TP, nous allons créer une Route afin de rendre le backend accessible depuis un navigateur ou depuis un client HTTP externe.

À la fin de ce TP, vous devez être capable de :

- comprendre le rôle d'une `Route` OpenShift ;
- comprendre la différence entre `Service` et `Route` ;
- créer une Route vers le Service backend ;
- récupérer l'URL publique du backend ;
- tester les endpoints backend depuis l'extérieur du cluster ;
- vérifier que la Route pointe vers le bon Service ;
- comprendre le chemin réseau utilisateur → Route → Service → Pod.

Ce TP rend le backend accessible depuis l'extérieur du cluster.

Il se concentre sur la phase :

```text
Service backend
→ Route backend
→ Accès externe
```

**Situation du TP :**

```text
Demi-journée 2
Chapitre 11 - Exposer l'application aux utilisateurs
Après TP 07 - Créer le Service backend
Avant TP 09 - Déployer et connecter le frontend
```

---

## 2. Concepts abordés

Ce TP introduit les concepts suivants :

- `Route` ;
- exposition externe ;
- Service cible ;
- port cible ;
- URL applicative ;
- accès navigateur ;
- chemin réseau applicatif ;
- test HTTP ;
- différence entre communication interne et externe.

Dans ce TP, l'objet principal est :

```text
Route
```

La Route backend s'appelle :

```text
coffee-shop-backend
```

Elle expose le Service :

```text
coffee-shop-backend
```

sur le port nommé :

```text
http
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

Le TP 08 correspond précisément à cette étape :

```text
Service
→ Route
→ Utilisateur
```

Dans le TP précédent, nous avons rendu le backend accessible à l'intérieur du cluster avec un Service.

Dans ce TP, nous allons rendre ce backend accessible depuis l'extérieur du cluster grâce à une Route.

Message clé :

```text
Le Service expose l'application à l'intérieur du cluster.
La Route expose le Service vers l'extérieur du cluster.
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
- accès à un cluster OpenShift ;
- accès à la CLI `oc` ;
- un Project OpenShift courant ;
- un Deployment backend existant ;
- un Pod backend en état `Running` et `Ready` ;
- un Service backend existant ;
- le Service backend doit avoir au moins un endpoint.

Vérifier le Project courant :

```bash
oc project
```

Résultat attendu :

```text
Using project "coffee-shop-demo"
```

Vérifier le Pod backend :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
Pod backend 1/1 Running
```

Vérifier le Service backend :

```bash
oc get svc coffee-shop-backend
oc describe svc coffee-shop-backend
```

Résultat attendu :

```text
Service coffee-shop-backend présent
Endpoints présents
```

---

## 5. Étapes détaillées

### Étape 1 - Comprendre pourquoi une Route est nécessaire

Le Service backend est de type :

```text
ClusterIP
```

Cela signifie que le Service est accessible à l'intérieur du cluster OpenShift.

Mais un utilisateur externe au cluster ne peut pas accéder directement à ce Service.

Pour rendre l'application accessible depuis l'extérieur, OpenShift utilise une Route.

Message pédagogique :

```text
Le Service est l'adresse interne.
La Route est la porte d'entrée externe.
```

---

### Étape 2 - Observer le manifest Route backend

Ouvrir le fichier :

```text
openshift/backend/route.yaml
```

Exemple de contenu attendu :

```yaml
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: coffee-shop-backend
  labels:
    app: coffee-shop
    component: backend
spec:
  to:
    kind: Service
    name: coffee-shop-backend
  port:
    targetPort: http
```

Points à identifier :

```text
kind: Route
name: coffee-shop-backend
to.kind: Service
to.name: coffee-shop-backend
targetPort: http
```

Ce manifest indique que la Route doit envoyer le trafic vers le Service backend.

---

### Étape 3 - Comprendre le lien Route → Service

Dans le manifest, repérer :

```yaml
spec:
  to:
    kind: Service
    name: coffee-shop-backend
```

Cela signifie :

```text
La Route expose le Service coffee-shop-backend.
```

Repérer également :

```yaml
port:
  targetPort: http
```

Ce champ correspond au port nommé dans le Service backend.

Dans le Service backend, on retrouve :

```yaml
ports:
  - name: http
    port: 8080
    targetPort: 8080
```

Message pédagogique :

```text
La Route ne pointe pas directement vers un Pod.
La Route pointe vers un Service.
Le Service pointe vers les Pods.
```

---

### Étape 4 - Créer la Route backend

Appliquer le manifest :

```bash
oc apply -f openshift/backend/route.yaml
```

OpenShift crée alors une Route backend.

Cette Route va fournir une URL accessible depuis l'extérieur du cluster.

---

### Étape 5 - Vérifier la création de la Route

Afficher les Routes :

```bash
oc get route
```

ou :

```bash
oc get routes
```

Résultat attendu :

```text
coffee-shop-backend
```

Afficher uniquement la Route backend :

```bash
oc get route coffee-shop-backend
```

La colonne `HOST/PORT` contient l'URL de la Route.

---

### Étape 6 - Récupérer l'URL de la Route backend

Récupérer l'URL HTTP de la Route :

```bash
oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}{"\n"}'
```

Vous devez obtenir une URL du type :

```text
http://coffee-shop-backend-<project>.<apps-domain>
```

Stocker l'URL dans une variable :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
```

Vérifier la variable :

```bash
echo $BACKEND_ROUTE
```

---

### Étape 7 - Tester l'endpoint /health

Tester l'endpoint de santé du backend :

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

Ce test confirme que le backend est accessible depuis l'extérieur du cluster.

---

### Étape 8 - Tester l'endpoint /ready

Tester l'endpoint readiness :

```bash
curl $BACKEND_ROUTE/ready
```

Résultat attendu :

```json
{
  "status": "READY",
  "service": "Coffee Shop Backend"
}
```

---

### Étape 9 - Tester l'API produits

Tester l'API produits :

```bash
curl $BACKEND_ROUTE/api/products
```

Résultat attendu :

```text
Une réponse JSON contenant la liste des produits Coffee Shop.
```

Exemple de produits attendus :

```text
Espresso
Latte
Cappuccino
Mocha
```

---

### Étape 10 - Tester l'API version

Tester l'API version :

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

Cet endpoint permet de vérifier que le backend est bien configuré.

---

### Étape 11 - Tester l'endpoint de configuration

Tester l'endpoint d'administration :

```bash
curl $BACKEND_ROUTE/admin/config
```

Résultat attendu :

```json
{
  "appName": "Coffee Shop Backend",
  "appVersion": "v1",
  "appEnvironment": "training",
  "appMessage": "Bonjour depuis une ConfigMap OpenShift",
  "failMode": false,
  "secretConfigured": true
}
```

Point important :

```text
La valeur du Secret n'est pas affichée.
L'application indique seulement si le Secret est configuré.
```

---

### Étape 12 - Tester depuis un navigateur

Copier l'URL de la Route backend :

```bash
oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}{"\n"}'
```

Ouvrir dans un navigateur :

```text
http://<route-backend>/health
```

Puis tester :

```text
http://<route-backend>/api/products
http://<route-backend>/api/version
http://<route-backend>/admin/config
```

Le navigateur doit afficher des réponses JSON.

---

## 6. Commandes

Commandes principales du TP :

```bash
# Vérifier le projet courant
oc project

# Vérifier le Service backend
oc get svc coffee-shop-backend
oc describe svc coffee-shop-backend

# Créer la Route backend
oc apply -f openshift/backend/route.yaml

# Afficher les Routes
oc get route

# Afficher la Route backend
oc get route coffee-shop-backend

# Récupérer l'URL de la Route backend
oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}{"\n"}'

# Stocker l'URL dans une variable
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')

# Tester le backend
curl $BACKEND_ROUTE/health
curl $BACKEND_ROUTE/ready
curl $BACKEND_ROUTE/api/products
curl $BACKEND_ROUTE/api/version
curl $BACKEND_ROUTE/admin/config
```

Commandes d'observation complémentaires :

```bash
# Décrire la Route
oc describe route coffee-shop-backend

# Afficher la Route en YAML
oc get route coffee-shop-backend -o yaml

# Vérifier le Service ciblé
oc describe svc coffee-shop-backend

# Vérifier les Pods backend
oc get pods -l app=coffee-shop,component=backend

# Afficher les logs backend
oc logs deployment/coffee-shop-backend
```

---

## 7. Vérifications

### Vérifier que la Route existe

```bash
oc get route coffee-shop-backend
```

Résultat attendu :

```text
coffee-shop-backend   <host>
```

---

### Vérifier que la Route pointe vers le Service backend

```bash
oc describe route coffee-shop-backend
```

Résultat attendu :

```text
Service: coffee-shop-backend
```

ou une information équivalente indiquant que la cible de la Route est le Service backend.

---

### Vérifier que le Service possède des endpoints

```bash
oc describe svc coffee-shop-backend
```

Résultat attendu :

```text
Endpoints: <IP_DU_POD>:8080
```

Si les endpoints sont absents, la Route ne pourra pas atteindre le backend.

---

### Vérifier l'accès HTTP au backend

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
curl $BACKEND_ROUTE/health
```

Résultat attendu :

```text
status OK
```

---

### Vérifier dans la console OpenShift

Dans la console web OpenShift, vérifier :

```text
Networking
→ Routes
→ coffee-shop-backend
```

Observer :

```text
l'URL de la Route
le Service ciblé
le port exposé
```

Vous pouvez également vérifier la vue Topology pour voir si un lien externe est associé au backend.

---

### Erreurs fréquentes à vérifier

#### Route absente

Symptôme possible :

```text
routes.route.openshift.io "coffee-shop-backend" not found
```

Correction :

```bash
oc apply -f openshift/backend/route.yaml
```

---

#### Service absent

Symptôme possible :

```text
Route créée mais backend inaccessible
```

Vérifier :

```bash
oc get svc coffee-shop-backend
```

Si le Service est absent, revenir au TP 07.

---

#### Service sans endpoint

Symptôme possible :

```text
503 Service Unavailable
```

Vérifier :

```bash
oc describe svc coffee-shop-backend
```

Si le résultat contient :

```text
Endpoints: <none>
```

alors le Service ne pointe vers aucun Pod.

Vérifier les Pods et les labels :

```bash
oc get pods -l app=coffee-shop,component=backend
oc get pods --show-labels
```

---

#### Pod backend non Ready

Symptôme possible :

```text
Route inaccessible ou réponse en erreur
```

Vérifier :

```bash
oc get pods -l app=coffee-shop,component=backend
oc describe pod <pod-name>
oc logs deployment/coffee-shop-backend
```

---

## 8. Questions de compréhension

### Question 1

Quel objet OpenShift permet d'exposer une application vers l'extérieur du cluster ?

<details>
<summary>Réponse</summary>

```text
Route
```

</details>

---

### Question 2

Une Route pointe-t-elle directement vers un Pod ?

<details>
<summary>Réponse</summary>

Non.

Une Route pointe vers un Service. Le Service pointe ensuite vers les Pods via ses selectors et ses endpoints.

</details>

---

### Question 3

Quelle est la différence entre un Service et une Route ?

<details>
<summary>Réponse</summary>

Le Service fournit un point d'accès stable à l'intérieur du cluster.

La Route expose ce Service vers l'extérieur du cluster.

</details>

---

### Question 4

Que devez-vous vérifier si la Route existe mais retourne une erreur 503 ?

<details>
<summary>Réponse</summary>

Il faut vérifier que le Service ciblé existe et possède des endpoints.

Commande utile :

```bash
oc describe svc coffee-shop-backend
```

</details>

---

### Question 5

Le backend est-il accessible depuis un navigateur à la fin de ce TP ?

<details>
<summary>Réponse</summary>

Oui.

Le backend est accessible via sa Route OpenShift.

</details>

---

## 9. Résultat attendu

À la fin de ce TP :

- la Route `coffee-shop-backend` existe ;
- la Route pointe vers le Service `coffee-shop-backend` ;
- le Service backend possède des endpoints ;
- le backend est accessible depuis l'extérieur du cluster ;
- les endpoints `/health`, `/ready`, `/api/products`, `/api/version` et `/admin/config` répondent ;
- le backend peut être testé depuis un navigateur ou avec `curl`.

Vérification rapide :

```bash
oc get route coffee-shop-backend
oc describe route coffee-shop-backend
oc describe svc coffee-shop-backend

BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
curl $BACKEND_ROUTE/health
curl $BACKEND_ROUTE/api/products
curl $BACKEND_ROUTE/api/version
```

Résultat attendu :

```text
Route présente
Service ciblé correctement
Endpoints présents
Backend accessible en HTTP
```

---

## 10. Nettoyage

Aucun nettoyage n'est nécessaire à la fin de ce TP.

La Route backend sera utilisée dans les TP suivants, notamment pour connecter le frontend au backend.

Ne supprimez pas :

```text
Route coffee-shop-backend
Service coffee-shop-backend
Deployment coffee-shop-backend
Pod backend
```

Si le formateur demande de supprimer uniquement la Route backend :

```bash
oc delete -f openshift/backend/route.yaml
```

Attention : supprimer la Route n'arrête pas le backend, mais rend le backend inaccessible depuis l'extérieur du cluster.

---

## 11. Message clé

```text
La Route est la porte d'entrée externe vers l'application.
```

Phrase de synthèse :

```text
Le Pod exécute le backend.
Le Service fournit un point d'accès stable vers le Pod.
La Route expose ce Service vers l'extérieur du cluster.
L'utilisateur peut maintenant appeler le backend depuis un navigateur.
```

---

## 12. Transition vers le TP suivant

Dans ce TP, nous avons exposé le backend avec une Route.

Le backend est maintenant accessible depuis l'extérieur du cluster.

Dans le TP suivant, nous allons déployer le frontend et le configurer pour qu'il appelle le backend.

Nous passerons de :

```text
Backend exposé
→ Frontend déployé
→ Frontend configuré avec BACKEND_URL
→ Application complète accessible
```

Le prochain objectif sera donc :

```text
Déployer le frontend et connecter l'application complète.
```
