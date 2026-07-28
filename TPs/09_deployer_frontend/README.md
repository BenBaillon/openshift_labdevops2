# TP 09 - Déployer et connecter le frontend

## 1. Objectif du TP

Ce TP a pour objectif de déployer le frontend de l'application **OpenShift Coffee Shop**, de l'exposer avec une Route, puis de le connecter au backend déjà déployé.

Dans les TP précédents, nous avons :

```text
construit l'image backend
construit l'image frontend
déployé le backend
configuré le backend
créé le Service backend
exposé le backend avec une Route
```

Dans ce TP, nous allons finaliser le parcours applicatif complet en déployant le frontend.

À la fin de ce TP, vous devez être capable de :

- déployer le frontend avec un `Deployment` ;
- créer la `ConfigMap` frontend ;
- configurer le frontend avec l'URL du backend ;
- créer le `Service` frontend ;
- créer la `Route` frontend ;
- accéder à l'application complète depuis un navigateur ;
- vérifier que le frontend communique correctement avec le backend ;
- comprendre le chemin utilisateur vers l'application complète.

Ce TP correspond au jalon principal de la demi-journée 2 :

```text
L'application Coffee Shop est accessible depuis un navigateur.
```

**Situation du TP :**

```text
Demi-journée 2
Chapitres 8 à 11 - Déployer, configurer, communiquer et exposer
Après TP 08 - Exposer le backend avec une Route
Avant TP 10 - Faire évoluer l'application avec le scaling
```

---

## 2. Concepts abordés

Ce TP mobilise plusieurs concepts déjà vus dans les TP précédents :

- `Deployment` ;
- `Pod` ;
- `ConfigMap` ;
- variable d'environnement ;
- `Service` ;
- `Route` ;
- communication frontend/backend ;
- exposition externe ;
- vérification applicative depuis un navigateur ;
- diagnostic avec DevTools.

Dans ce TP, nous allons utiliser les ressources frontend suivantes :

```text
ConfigMap
Deployment
Service
Route
```

La ConfigMap frontend contient notamment :

```text
FRONTEND_VERSION
APP_ENV
BACKEND_URL
```

La variable la plus importante est :

```text
BACKEND_URL
```

Cette variable indique au frontend l'URL à utiliser pour appeler le backend.

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

Avec ce TP, nous finalisons le premier parcours complet :

```text
Backend déployé
→ Backend exposé
→ Frontend déployé
→ Frontend configuré
→ Frontend exposé
→ Application accessible
```

Dans l'architecture cible de ce TP :

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

Message clé :

```text
Le frontend est le point d'entrée utilisateur, mais il dépend de la configuration BACKEND_URL pour communiquer avec le backend.
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
- accès à un cluster OpenShift ;
- accès à la CLI `oc` ;
- un Project OpenShift courant ;
- l'image frontend construite ;
- l'image backend construite ;
- le backend déployé ;
- le Service backend créé ;
- la Route backend créée ;
- le backend accessible via sa Route.

Vérifier le Project courant :

```bash
oc project
```

Résultat attendu :

```text
Using project "coffee-shop-demo"
```

Vérifier que le backend est accessible :

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

Vérifier que l'image frontend existe :

```bash
oc get is coffee-shop-frontend
```

---

## 5. Étapes détaillées

### Étape 1 - Observer le manifest ConfigMap frontend

Ouvrir le fichier :

```text
openshift/frontend/configmap.yaml
```

Exemple de contenu attendu :

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: coffee-shop-frontend-config
data:
  FRONTEND_VERSION: "v1"
  APP_ENV: "training"
  BACKEND_URL: "http://CHANGE_ME_BACKEND_ROUTE"
```

Cette ConfigMap contient la configuration non sensible du frontend.

Le point le plus important est :

```text
BACKEND_URL
```

Cette valeur devra être remplacée par la vraie Route backend.

Message pédagogique :

```text
Le frontend ne contient pas directement l'adresse du backend dans son code.
Cette adresse est fournie par la configuration.
```

---

### Étape 2 - Créer la ConfigMap frontend

Appliquer le manifest :

```bash
oc apply -f openshift/frontend/configmap.yaml
```

Vérifier la création :

```bash
oc get configmap coffee-shop-frontend-config
```

Afficher le contenu :

```bash
oc get configmap coffee-shop-frontend-config -o yaml
```

Résultat attendu :

```text
La ConfigMap coffee-shop-frontend-config existe.
Elle contient FRONTEND_VERSION, APP_ENV et BACKEND_URL.
```

À ce stade, `BACKEND_URL` peut encore contenir une valeur temporaire.

---

### Étape 3 - Récupérer la Route backend

Récupérer l'URL de la Route backend :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
```

Afficher la valeur :

```bash
echo $BACKEND_ROUTE
```

Résultat attendu :

```text
http://coffee-shop-backend-<project>.<apps-domain>
```

Cette URL sera utilisée par le frontend pour appeler le backend.

---

### Étape 4 - Mettre à jour BACKEND_URL dans la ConfigMap frontend

Mettre à jour la ConfigMap frontend :

```bash
oc patch configmap coffee-shop-frontend-config \
  --type merge \
  -p "{\"data\":{\"BACKEND_URL\":\"$BACKEND_ROUTE\"}}"
```

Vérifier la nouvelle valeur :

```bash
oc get configmap coffee-shop-frontend-config -o yaml
```

Résultat attendu :

```yaml
data:
  BACKEND_URL: http://coffee-shop-backend-<project>.<apps-domain>
```

Message pédagogique :

```text
La ConfigMap permet de modifier l'adresse du backend sans modifier le code du frontend.
```

---

### Étape 5 - Observer le manifest Deployment frontend

Ouvrir le fichier :

```text
openshift/frontend/deployment.yaml
```

Repérer le type de ressource :

```yaml
kind: Deployment
metadata:
  name: coffee-shop-frontend
```

Repérer l'image utilisée :

```yaml
containers:
  - name: coffee-shop-frontend
    image: coffee-shop-frontend:latest
```

Repérer le port exposé par le conteneur :

```yaml
ports:
  - containerPort: 3000
```

Repérer la configuration injectée :

```yaml
envFrom:
  - configMapRef:
      name: coffee-shop-frontend-config
```

Message pédagogique :

```text
Le Deployment frontend injecte la ConfigMap dans le Pod frontend.
```

---

### Étape 6 - Déployer le frontend

Appliquer le manifest Deployment :

```bash
oc apply -f openshift/frontend/deployment.yaml
```

Observer le Deployment :

```bash
oc get deployment coffee-shop-frontend
```

Observer le Pod frontend :

```bash
oc get pods -l app=coffee-shop,component=frontend
```

Résultat attendu :

```text
Un Pod frontend est créé et passe en 1/1 Running.
```

---

### Étape 7 - Créer le Service frontend

Appliquer le manifest Service :

```bash
oc apply -f openshift/frontend/service.yaml
```

Vérifier la création :

```bash
oc get svc coffee-shop-frontend
```

Décrire le Service :

```bash
oc describe svc coffee-shop-frontend
```

Résultat attendu :

```text
Le Service frontend existe.
Il possède un endpoint vers le Pod frontend sur le port 3000.
```

Message pédagogique :

```text
Le Service frontend fournit un point d'accès stable vers le Pod frontend.
```

---

### Étape 8 - Créer la Route frontend

Appliquer le manifest Route :

```bash
oc apply -f openshift/frontend/route.yaml
```

Vérifier la Route :

```bash
oc get route coffee-shop-frontend
```

Récupérer l'URL de la Route frontend :

```bash
oc get route coffee-shop-frontend -o jsonpath='{"http://"}{.spec.host}{"\n"}'
```

Cette URL est le point d'entrée utilisateur de l'application Coffee Shop.

---

### Étape 9 - Ouvrir l'application dans le navigateur

Copier l'URL de la Route frontend :

```bash
oc get route coffee-shop-frontend -o jsonpath='{"http://"}{.spec.host}{"\n"}'
```

Ouvrir cette URL dans un navigateur.

Résultat attendu :

```text
La page OpenShift Coffee Shop s'affiche.
Le frontend indique sa version.
L'environnement est affiché.
Le Backend URL est affiché.
Le statut backend est OK.
La version backend est affichée.
La liste des produits est affichée.
```

---

### Étape 10 - Vérifier les appels frontend/backend

Dans le navigateur, ouvrir les DevTools.

Aller dans l'onglet :

```text
Network
```

Rafraîchir la page.

Observer les appels vers :

```text
/config
<BACKEND_URL>/health
<BACKEND_URL>/api/version
<BACKEND_URL>/api/products
```

Message pédagogique :

```text
Le navigateur charge le frontend, puis le frontend appelle le backend configuré via BACKEND_URL.
```

---

## 6. Commandes

Commandes principales du TP :

```bash
# Vérifier le projet courant
oc project

# Vérifier la Route backend
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
echo $BACKEND_ROUTE
curl $BACKEND_ROUTE/health

# Créer la ConfigMap frontend
oc apply -f openshift/frontend/configmap.yaml

# Mettre à jour BACKEND_URL
oc patch configmap coffee-shop-frontend-config \
  --type merge \
  -p "{\"data\":{\"BACKEND_URL\":\"$BACKEND_ROUTE\"}}"

# Déployer le frontend
oc apply -f openshift/frontend/deployment.yaml

# Créer le Service frontend
oc apply -f openshift/frontend/service.yaml

# Créer la Route frontend
oc apply -f openshift/frontend/route.yaml

# Vérifier les ressources frontend
oc get deployment coffee-shop-frontend
oc get pods -l app=coffee-shop,component=frontend
oc get svc coffee-shop-frontend
oc get route coffee-shop-frontend

# Récupérer l'URL frontend
oc get route coffee-shop-frontend -o jsonpath='{"http://"}{.spec.host}{"\n"}'
```

Commandes d'observation complémentaires :

```bash
# Afficher la ConfigMap frontend
oc get configmap coffee-shop-frontend-config -o yaml

# Décrire le Deployment frontend
oc describe deployment coffee-shop-frontend

# Voir les logs frontend
oc logs deployment/coffee-shop-frontend

# Décrire le Service frontend
oc describe svc coffee-shop-frontend

# Décrire la Route frontend
oc describe route coffee-shop-frontend

# Voir toutes les ressources
oc get all
```

---

## 7. Vérifications

### Vérifier la ConfigMap frontend

```bash
oc get configmap coffee-shop-frontend-config -o yaml
```

Résultat attendu :

```text
FRONTEND_VERSION est présent
APP_ENV est présent
BACKEND_URL pointe vers la Route backend
```

---

### Vérifier le Deployment frontend

```bash
oc get deployment coffee-shop-frontend
```

Résultat attendu :

```text
READY   UP-TO-DATE   AVAILABLE
1/1     1            1
```

---

### Vérifier le Pod frontend

```bash
oc get pods -l app=coffee-shop,component=frontend
```

Résultat attendu :

```text
READY   STATUS
1/1     Running
```

---

### Vérifier le Service frontend

```bash
oc describe svc coffee-shop-frontend
```

Résultat attendu :

```text
Selector: app=coffee-shop,component=frontend
Endpoints: <IP_DU_POD>:3000
```

---

### Vérifier la Route frontend

```bash
oc get route coffee-shop-frontend
```

Résultat attendu :

```text
La Route frontend existe et possède un HOST.
```

---

### Vérifier l'application dans le navigateur

Ouvrir :

```text
http://<route-frontend>
```

Résultat attendu :

```text
Page Coffee Shop affichée
Statut backend OK
Produits affichés
Version backend affichée
```

---

### Erreurs fréquentes à vérifier

#### BACKEND_URL incorrect

Symptôme possible :

```text
Le frontend s'affiche, mais le backend est inaccessible.
```

Vérifier :

```bash
oc get configmap coffee-shop-frontend-config -o yaml
```

Corriger avec la bonne Route backend.

---

#### Pod frontend non Ready

Symptôme possible :

```text
READY 0/1
```

Vérifier :

```bash
oc describe pod <pod-name>
oc logs deployment/coffee-shop-frontend
```

---

#### Service frontend sans endpoints

Symptôme possible :

```text
Route frontend créée mais application inaccessible.
```

Vérifier :

```bash
oc describe svc coffee-shop-frontend
oc get pods -l app=coffee-shop,component=frontend --show-labels
```

---

#### Route frontend absente

Symptôme possible :

```text
Impossible de récupérer l'URL frontend.
```

Correction :

```bash
oc apply -f openshift/frontend/route.yaml
```

---

## 8. Questions de compréhension

### Question 1

Quelle variable permet au frontend de connaître l'URL du backend ?

<details>
<summary>Réponse</summary>

```text
BACKEND_URL
```

</details>

---

### Question 2

Dans quel objet OpenShift stocke-t-on `BACKEND_URL` ?

<details>
<summary>Réponse</summary>

Dans la ConfigMap :

```text
coffee-shop-frontend-config
```

</details>

---

### Question 3

Quel objet OpenShift expose le frontend vers l'extérieur du cluster ?

<details>
<summary>Réponse</summary>

```text
Route coffee-shop-frontend
```

</details>

---

### Question 4

Quel objet fournit un point d'accès stable vers le Pod frontend ?

<details>
<summary>Réponse</summary>

```text
Service coffee-shop-frontend
```

</details>

---

### Question 5

Que faut-il vérifier si le frontend s'affiche mais que le backend est inaccessible ?

<details>
<summary>Réponse</summary>

Il faut vérifier la valeur de `BACKEND_URL` dans la ConfigMap frontend, puis vérifier que la Route backend fonctionne.

Commandes utiles :

```bash
oc get configmap coffee-shop-frontend-config -o yaml
oc get route coffee-shop-backend
curl $BACKEND_ROUTE/health
```

</details>

---

## 9. Résultat attendu

À la fin de ce TP :

- la ConfigMap `coffee-shop-frontend-config` existe ;
- `BACKEND_URL` pointe vers la Route backend ;
- le Deployment `coffee-shop-frontend` existe ;
- le Pod frontend est en état `1/1 Running` ;
- le Service `coffee-shop-frontend` existe ;
- la Route `coffee-shop-frontend` existe ;
- l'application Coffee Shop est accessible depuis un navigateur ;
- le frontend affiche correctement les données du backend.

Vérification rapide :

```bash
oc get configmap coffee-shop-frontend-config -o yaml
oc get deployment coffee-shop-frontend
oc get pods -l app=coffee-shop,component=frontend
oc get svc coffee-shop-frontend
oc get route coffee-shop-frontend
```

Résultat attendu dans le navigateur :

```text
Frontend v1
Environnement training
Backend URL renseignée
Statut backend OK
Version backend v1
Produits affichés
```

---

## 10. Nettoyage

Aucun nettoyage n'est nécessaire à la fin de ce TP.

Les ressources frontend seront utilisées dans les TP et scénarios suivants.

Ne supprimez pas :

```text
ConfigMap coffee-shop-frontend-config
Deployment coffee-shop-frontend
Service coffee-shop-frontend
Route coffee-shop-frontend
```

Si le formateur demande de supprimer uniquement les ressources frontend :

```bash
oc delete -f openshift/frontend/route.yaml
oc delete -f openshift/frontend/service.yaml
oc delete -f openshift/frontend/deployment.yaml
oc delete -f openshift/frontend/configmap.yaml
```

Attention : supprimer ces ressources rendra l'application Coffee Shop inaccessible depuis le navigateur.

---

## 11. Message clé

```text
Le frontend rend l'application visible à l'utilisateur, mais il dépend de sa configuration pour joindre le backend.
```

Phrase de synthèse :

```text
Le backend est déployé et exposé.
Le frontend est déployé.
La ConfigMap frontend indique l'URL du backend.
Le Service frontend stabilise l'accès au Pod frontend.
La Route frontend expose l'application à l'utilisateur.
L'application complète est maintenant accessible.
```

---

## 12. Transition vers le TP suivant

Dans ce TP, nous avons terminé le parcours nominal principal :

```text
Code Git
→ Build
→ Image
→ Deployment
→ Pod
→ Service
→ Route
→ Utilisateur
```

L'application Coffee Shop est maintenant accessible depuis un navigateur.

Dans le TP suivant, nous allons faire évoluer l'application en modifiant le nombre d'instances du backend.

Nous passerons de :

```text
1 Pod backend
→ Plusieurs Pods backend
→ Service backend avec plusieurs endpoints
```

Le prochain objectif sera donc :

```text
Faire évoluer l'application avec le scaling.
```
