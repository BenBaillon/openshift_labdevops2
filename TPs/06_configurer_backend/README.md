# TP 06 - Configurer le backend avec ConfigMap et Secret

## 1. Objectif du TP

Ce TP a pour objectif de configurer le backend de l'application **OpenShift Coffee Shop** sans modifier son code source.

Dans le TP précédent, nous avons déployé le backend sous forme de `Deployment` et observé le Pod backend démarrer dans OpenShift.

Dans ce TP, nous allons introduire deux objets importants pour la configuration applicative :

```text
ConfigMap
Secret
```

À la fin de ce TP, vous devez être capable de :

- comprendre le rôle d'une `ConfigMap` ;
- comprendre le rôle d'un `Secret` ;
- différencier configuration non sensible et configuration sensible ;
- créer une ConfigMap backend ;
- créer un Secret backend ;
- comprendre comment un Deployment injecte ces valeurs dans un Pod ;
- vérifier les variables d'environnement utilisées par le backend ;
- redémarrer le backend pour appliquer une configuration ;
- vérifier la configuration effective via l'endpoint `/admin/config`.

Ce TP prépare les prochains TP sur les Services et les Routes.

Il se concentre sur la phase :

```text
Deployment backend
→ ConfigMap
→ Secret
→ Variables d'environnement
→ Pod backend configuré
```

**Situation du TP :**

```text
Demi-journée 2
Chapitre 9 - Configurer l'application
Après TP 05 - Déployer le backend sur OpenShift
Avant TP 07 - Créer le Service backend
```

---

## 2. Concepts abordés

Ce TP introduit les concepts suivants :

- configuration applicative ;
- variable d'environnement ;
- `ConfigMap` ;
- `Secret` ;
- configuration non sensible ;
- configuration sensible ;
- `envFrom` ;
- redémarrage d'un Deployment ;
- séparation code / configuration ;
- diagnostic de configuration.

Dans ce TP, nous allons utiliser principalement :

```text
ConfigMap
Secret
Deployment
Pod
```

### ConfigMap

Une ConfigMap contient de la configuration non sensible.

Exemples :

```text
APP_NAME
APP_VERSION
APP_ENV
APP_MESSAGE
FAIL_MODE
```

### Secret

Un Secret contient une information sensible.

Dans notre application, le Secret contient :

```text
SECRET_API_KEY
```

Message important :

```text
Une ConfigMap sert à stocker de la configuration non sensible.
Un Secret sert à stocker une donnée sensible.
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
→ Configuration
→ Service
→ Route
→ Utilisateur
```

Le TP 06 correspond précisément à cette étape :

```text
Configurer l'application
```

Dans le TP précédent, nous avons déployé le backend.

Dans ce TP, nous allons lui fournir une configuration externe.

Message clé :

```text
Le code ne doit pas contenir toute la configuration.
OpenShift permet d'injecter la configuration au moment du déploiement.
```

---

## 4. Pré-requis

Avant de commencer ce TP, vous devez avoir :

- terminé le TP 01 ;
- terminé le TP 02 ;
- terminé le TP 03 ;
- terminé le TP 04 ;
- terminé le TP 05 ;
- accès à un cluster OpenShift ;
- accès à la CLI `oc` ;
- un Project OpenShift courant ;
- un Deployment backend existant ;
- un Pod backend en état `Running`.

Vérifier le Project courant :

```bash
oc project
```

Résultat attendu :

```text
Using project "coffee-shop-demo"
```

Vérifier que le backend est déployé :

```bash
oc get deployment coffee-shop-backend
oc get pods -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
Deployment coffee-shop-backend présent
Pod backend 1/1 Running
```

---

## 5. Étapes détaillées

### Étape 1 - Observer le manifest ConfigMap backend

Ouvrir le fichier :

```text
openshift/backend/configmap.yaml
```

Exemple de contenu attendu :

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: coffee-shop-backend-config
data:
  APP_NAME: "Coffee Shop Backend"
  APP_VERSION: "v1"
  APP_ENV: "training"
  APP_MESSAGE: "Bonjour depuis une ConfigMap OpenShift"
  FAIL_MODE: "false"
```

Cette ConfigMap contient la configuration non sensible du backend.

Points à identifier :

```text
APP_NAME
APP_VERSION
APP_ENV
APP_MESSAGE
FAIL_MODE
```

Message pédagogique :

```text
La ConfigMap permet de modifier la configuration sans modifier le code applicatif.
```

---

### Étape 2 - Observer le manifest Secret backend

Ouvrir le fichier :

```text
openshift/backend/secret.yaml
```

Exemple de contenu attendu :

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: coffee-shop-backend-secret
type: Opaque
stringData:
  SECRET_API_KEY: "training-secret-key"
```

Ce Secret contient une donnée sensible simulée.

Point à identifier :

```text
SECRET_API_KEY
```

Message pédagogique :

```text
La valeur sensible n'est pas stockée dans le code source de l'application.
```

---

### Étape 3 - Créer la ConfigMap backend

Appliquer le manifest ConfigMap :

```bash
oc apply -f openshift/backend/configmap.yaml
```

Vérifier la création :

```bash
oc get configmap coffee-shop-backend-config
```

Afficher le contenu :

```bash
oc get configmap coffee-shop-backend-config -o yaml
```

Résultat attendu :

```text
La ConfigMap coffee-shop-backend-config existe.
Elle contient les clés APP_NAME, APP_VERSION, APP_ENV, APP_MESSAGE et FAIL_MODE.
```

---

### Étape 4 - Créer le Secret backend

Appliquer le manifest Secret :

```bash
oc apply -f openshift/backend/secret.yaml
```

Vérifier la création :

```bash
oc get secret coffee-shop-backend-secret
```

Afficher les informations du Secret sans décoder sa valeur :

```bash
oc describe secret coffee-shop-backend-secret
```

Résultat attendu :

```text
Le Secret coffee-shop-backend-secret existe.
Il contient une clé SECRET_API_KEY.
```

Attention :

```text
Ne pas afficher inutilement la valeur réelle d'un Secret dans une formation ou dans des logs.
```

---

### Étape 5 - Observer l'injection dans le Deployment

Ouvrir le fichier :

```text
openshift/backend/deployment.yaml
```

Repérer la section :

```yaml
# envFrom:
#   - configMapRef:
#       name: coffee-shop-backend-config
#   - secretRef:
#       name: coffee-shop-backend-secret
```

Cette section indique que le Pod backend reçoit ses variables d'environnement depuis :

```text
coffee-shop-backend-config
coffee-shop-backend-secret
```

Message pédagogique :

```text
Le Deployment décrit comment la configuration est injectée dans le Pod.
```

---

### Étape 6 - Redéployer le Deployment backend

Décommenter la section présentée ci-dessus concernant les variables d'environnements.

Lancer :

```bash
oc apply -f openshift/backend/deployment.yaml
```

Observer le Pod :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
Un nouveau Pod backend démarre et passe en 1/1 Running.
```

---

### Étape 7 - Vérifier les variables d'environnement du Deployment

Lister les variables d'environnement déclarées sur le Deployment :

```bash
oc set env deployment/coffee-shop-backend --list
```

Selon la manière dont les variables sont injectées, OpenShift peut afficher les références aux objets utilisés.

Pour vérifier précisément le manifest du Deployment :

```bash
oc get deployment coffee-shop-backend -o yaml
```

Chercher :

```text
envFrom
configMapRef
secretRef
```

---

### Étape 8 - Préparer l'accès au backend pour vérifier la configuration

À ce stade, selon le déroulé exact des TP, le Service et la Route backend peuvent ne pas encore être créés.

Si le Service et la Route ne sont pas encore créés, ils seront introduits dans les TP suivants.

Pour vérifier la configuration dès maintenant, le formateur peut choisir l'une des deux options suivantes :

#### Option A - Vérification plus tard

Attendre le TP 07 et le TP 08 pour créer le Service et la Route backend.

La vérification via `/admin/config` sera alors faite après exposition du backend.

#### Option B - Vérification immédiate avec port-forward

Utiliser un port-forward temporaire vers le Pod backend.

Récupérer le nom du Pod :

```bash
BACKEND_POD=$(oc get pods -l app=coffee-shop,component=backend -o jsonpath='{.items[0].metadata.name}')
```

Lancer le port-forward :

```bash
oc port-forward pod/$BACKEND_POD 8080:8080
```

Dans un autre terminal, tester :

```bash
curl http://localhost:8080/admin/config
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

Message pédagogique :

```text
Le backend lit bien sa configuration depuis OpenShift.
```

---

## 6. Commandes

Commandes principales du TP :

```bash
# Vérifier le projet courant
oc project

# Créer la ConfigMap backend
oc apply -f openshift/backend/configmap.yaml

# Créer le Secret backend
oc apply -f openshift/backend/secret.yaml

# Vérifier les objets
oc get configmap coffee-shop-backend-config
oc get secret coffee-shop-backend-secret

# Observer leur contenu ou structure
oc get configmap coffee-shop-backend-config -o yaml
oc describe secret coffee-shop-backend-secret

# Redémarrer le backend pour reprendre la configuration
oc rollout restart deployment/coffee-shop-backend
oc rollout status deployment/coffee-shop-backend

# Vérifier le Pod backend
oc get pods -l app=coffee-shop,component=backend
```

Commandes d'observation complémentaires :

```bash
# Voir le Deployment en YAML
oc get deployment coffee-shop-backend -o yaml

# Vérifier les références de configuration
oc set env deployment/coffee-shop-backend --list

# Logs backend
oc logs deployment/coffee-shop-backend

# Port-forward temporaire, si nécessaire
BACKEND_POD=$(oc get pods -l app=coffee-shop,component=backend -o jsonpath='{.items[0].metadata.name}')
oc port-forward pod/$BACKEND_POD 8080:8080
```

Dans un autre terminal :

```bash
curl http://localhost:8080/admin/config
```

---

## 7. Vérifications

### Vérifier la ConfigMap

```bash
oc get configmap coffee-shop-backend-config
```

Résultat attendu :

```text
coffee-shop-backend-config
```

Afficher le contenu :

```bash
oc get configmap coffee-shop-backend-config -o yaml
```

Vérifier la présence des clés :

```text
APP_NAME
APP_VERSION
APP_ENV
APP_MESSAGE
FAIL_MODE
```

---

### Vérifier le Secret

```bash
oc get secret coffee-shop-backend-secret
```

Résultat attendu :

```text
coffee-shop-backend-secret
```

Afficher la structure sans décoder la valeur :

```bash
oc describe secret coffee-shop-backend-secret
```

Vérifier la présence de la clé :

```text
SECRET_API_KEY
```

---

### Vérifier le Deployment

```bash
oc get deployment coffee-shop-backend -o yaml
```

Vérifier la présence de :

```text
envFrom
configMapRef
secretRef
```

---

### Vérifier le Pod backend

```bash
oc get pods -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
READY   STATUS
1/1     Running
```

---

### Vérifier la configuration effective

Si un accès HTTP au backend est disponible, tester :

```bash
curl http://localhost:8080/admin/config
```

ou, plus tard après création de la Route :

```bash
curl http://<route-backend>/admin/config
```

Résultat attendu :

```text
APP_VERSION vaut v1
APP_ENV vaut training
APP_MESSAGE vient de la ConfigMap
secretConfigured vaut true
```

---

### Erreurs fréquentes à vérifier

#### ConfigMap absente

Symptôme possible :

```text
configmap "coffee-shop-backend-config" not found
```

Correction :

```bash
oc apply -f openshift/backend/configmap.yaml
```

---

#### Secret absent

Symptôme possible :

```text
secret "coffee-shop-backend-secret" not found
```

Correction :

```bash
oc apply -f openshift/backend/secret.yaml
```

---

#### Pod en erreur après redémarrage

Commandes utiles :

```bash
oc get pods
oc describe pod <pod-name>
oc get events --sort-by=.lastTimestamp
```

Causes possibles :

```text
ConfigMap absente
Secret absent
nom de ressource incorrect dans le Deployment
```

---

## 8. Questions de compréhension

### Question 1

Quel objet OpenShift permet de stocker de la configuration non sensible ?

<details>
<summary>Réponse</summary>

```text
ConfigMap
```

</details>

---

### Question 2

Quel objet OpenShift permet de stocker une donnée sensible ?

<details>
<summary>Réponse</summary>

```text
Secret
```

</details>

---

### Question 3

Quelle est la différence entre une ConfigMap et un Secret ?

<details>
<summary>Réponse</summary>

Une ConfigMap contient de la configuration non sensible.

Un Secret contient des données sensibles comme un mot de passe, un token ou une clé API.

</details>

---

### Question 4

Pourquoi faut-il parfois redémarrer un Pod après modification d'une ConfigMap ou d'un Secret ?

<details>
<summary>Réponse</summary>

Lorsque la ConfigMap ou le Secret est injecté sous forme de variables d'environnement, les valeurs sont lues au démarrage du conteneur. Un Pod déjà démarré ne relit pas automatiquement ces valeurs.

</details>

---

### Question 5

Comment le Deployment backend récupère-t-il les valeurs de la ConfigMap et du Secret ?

<details>
<summary>Réponse</summary>

Avec la section `envFrom` du manifest Deployment :

```yaml
envFrom:
  - configMapRef:
      name: coffee-shop-backend-config
  - secretRef:
      name: coffee-shop-backend-secret
```

</details>

---

## 9. Résultat attendu

À la fin de ce TP :

- la ConfigMap `coffee-shop-backend-config` existe ;
- le Secret `coffee-shop-backend-secret` existe ;
- le Deployment backend référence la ConfigMap et le Secret ;
- le Pod backend a été redémarré ;
- le Pod backend est en état `1/1 Running` ;
- le backend utilise une configuration externe à son code ;
- la configuration effective peut être vérifiée via `/admin/config` lorsque le backend est accessible.

Vérification rapide :

```bash
oc get configmap coffee-shop-backend-config
oc get secret coffee-shop-backend-secret
oc get pods -l app=coffee-shop,component=backend
oc get deployment coffee-shop-backend -o yaml
```

Résultat attendu :

```text
ConfigMap présente
Secret présent
Deployment configuré avec envFrom
Pod backend Running
```

---

## 10. Nettoyage

Aucun nettoyage n'est nécessaire à la fin de ce TP.

Les ressources créées seront utilisées dans les TP suivants.

Ne supprimez pas :

```text
ConfigMap coffee-shop-backend-config
Secret coffee-shop-backend-secret
Deployment coffee-shop-backend
Pod backend
```

Si le formateur demande de supprimer uniquement la configuration backend :

```bash
oc delete -f openshift/backend/secret.yaml
oc delete -f openshift/backend/configmap.yaml
```

Attention : supprimer la ConfigMap ou le Secret peut empêcher un futur Pod backend de démarrer correctement.

---

## 11. Message clé

```text
La configuration ne doit pas être codée en dur dans l'application.
```

Phrase de synthèse :

```text
Le code backend reste le même.
La ConfigMap fournit la configuration non sensible.
Le Secret fournit la configuration sensible.
Le Deployment injecte ces valeurs dans le Pod.
L'application lit ces valeurs au démarrage.
```

---

## 12. Transition vers le TP suivant

Dans ce TP, nous avons configuré le backend.

Le backend tourne maintenant dans un Pod et utilise une configuration externe.

Mais pour l'instant, il n'existe pas encore de point d'accès stable pour joindre ce Pod.

Dans le TP suivant, nous allons créer un Service backend.

Nous passerons de :

```text
Pod backend
→ Service backend
```

Le prochain objectif sera donc :

```text
Permettre aux autres composants de joindre le backend via un point d'accès stable.
```
