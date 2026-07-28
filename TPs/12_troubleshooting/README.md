# TP 12 - Diagnostiquer une mauvaise configuration frontend/backend

## 1. Objectif du TP

Ce TP a pour objectif d'introduire une première situation de dépannage sur l'application **OpenShift Coffee Shop**.

Dans les TP précédents, nous avons construit, déployé, configuré, exposé et fait évoluer l'application.

Dans ce TP, nous allons provoquer volontairement une erreur de configuration : le frontend va continuer à fonctionner, mais il ne pourra plus joindre le backend car la variable `BACKEND_URL` sera incorrecte.

À la fin de ce TP, vous devez être capable de :

- comprendre qu'une application peut être démarrée mais mal configurée ;
- diagnostiquer une erreur de communication frontend/backend ;
- vérifier l'état des Pods ;
- vérifier les Routes ;
- vérifier la ConfigMap frontend ;
- utiliser les DevTools du navigateur pour observer les appels HTTP ;
- corriger une mauvaise valeur de `BACKEND_URL` ;
- redémarrer le frontend pour qu'il relise sa configuration ;
- valider le retour à l'état nominal.

Ce TP marque l'entrée dans la partie dépannage de la formation.

Il se concentre sur la phase :

```text
Application fonctionnelle
→ Mauvaise configuration BACKEND_URL
→ Frontend accessible mais backend inaccessible
→ Diagnostic
→ Correction
```

**Situation du TP :**

```text
Demi-journée 3
Chapitre 15 - Dépanner
Après TP 11 - Déployer une nouvelle version avec rollout / rollback
Avant les scénarios de dépannage avancés : Service selector, healthcheck, Secret
```

---

## 2. Concepts abordés

Ce TP introduit ou renforce les concepts suivants :

- `ConfigMap` ;
- variable d'environnement ;
- `Deployment` ;
- `Pod` ;
- `Route` ;
- communication frontend/backend ;
- diagnostic applicatif ;
- DevTools navigateur ;
- redémarrage de Deployment ;
- distinction entre état technique et état fonctionnel.

L'objet principal manipulé est :

```text
ConfigMap coffee-shop-frontend-config
```

La variable concernée est :

```text
BACKEND_URL
```

Cette variable indique au frontend l'adresse du backend à contacter.

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
→ Rollout
→ Dépannage
```

Le TP 12 correspond précisément à cette étape :

```text
Dépanner une application déployée
```

Dans les TP précédents, l'application fonctionnait correctement.

Dans ce TP, nous allons volontairement casser la configuration qui relie le frontend au backend.

Message clé :

```text
Tous les Pods peuvent être Running, mais l'application peut quand même être cassée fonctionnellement.
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
- terminé le TP 11 ;
- accès à un cluster OpenShift ;
- accès à la CLI `oc` ;
- un Project OpenShift courant ;
- l'application Coffee Shop accessible depuis un navigateur ;
- le backend en état `Running` ;
- le frontend en état `Running` ;
- la ConfigMap frontend créée ;
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

Vérifier que l'application est disponible :

```bash
oc get deployment coffee-shop-backend
oc get deployment coffee-shop-frontend
oc get pods
oc get route
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

Vérifier que le frontend est accessible :

```bash
oc get route coffee-shop-frontend -o jsonpath='{"http://"}{.spec.host}{"\n"}'
```

Ouvrir l'URL frontend dans un navigateur.

Résultat attendu :

```text
Statut backend : OK
Produits affichés
Version backend affichée
```

---

## 5. Étapes détaillées

### Étape 1 - Vérifier l'état nominal de l'application

Récupérer la Route backend :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
```

Tester le backend :

```bash
curl $BACKEND_ROUTE/health
curl $BACKEND_ROUTE/api/version
curl $BACKEND_ROUTE/api/products
```

Résultat attendu :

```text
Le backend répond correctement.
```

Récupérer la Route frontend :

```bash
FRONTEND_ROUTE=$(oc get route coffee-shop-frontend -o jsonpath='{"http://"}{.spec.host}')
echo $FRONTEND_ROUTE
```

Ouvrir l'URL frontend dans un navigateur.

Résultat attendu :

```text
Le frontend s'affiche.
Le statut backend est OK.
Les produits sont affichés.
```

---

### Étape 2 - Observer la ConfigMap frontend

Afficher la ConfigMap du frontend :

```bash
oc get configmap coffee-shop-frontend-config -o yaml
```

Repérer la variable :

```yaml
BACKEND_URL: http://<route-backend>
```

Cette valeur indique au frontend quelle URL utiliser pour appeler le backend.

Message pédagogique :

```text
Le frontend dépend de sa configuration pour trouver le backend.
```

---

### Étape 3 - Créer volontairement la panne

Modifier la ConfigMap frontend avec une mauvaise URL backend :

```bash
oc patch configmap coffee-shop-frontend-config \
  --type merge \
  -p '{"data":{"BACKEND_URL":"http://backend-inexistant"}}'
```

Cette commande modifie uniquement la ConfigMap.

Important :

```text
Une variable d'environnement injectée dans un Pod est lue au démarrage du conteneur.
Le Pod frontend existant ne récupère donc pas automatiquement la nouvelle valeur.
```

---

### Étape 4 - Redémarrer le frontend

Redémarrer le Deployment frontend :

```bash
oc rollout restart deployment/coffee-shop-frontend
```

Suivre le redémarrage :

```bash
oc rollout status deployment/coffee-shop-frontend
```

Observer le Pod frontend :

```bash
oc get pods -l app=coffee-shop,component=frontend
```

Résultat attendu :

```text
Un nouveau Pod frontend démarre et passe en 1/1 Running.
```

---

### Étape 5 - Observer le résultat côté utilisateur

Ouvrir ou rafraîchir la Route frontend dans le navigateur.

Résultat attendu :

```text
Le frontend reste accessible.
Le backend devient inaccessible.
Les produits ne se chargent plus.
Un message d'erreur apparaît.
```

Point important :

```text
Le frontend n'est pas arrêté.
Le backend n'est pas arrêté.
La configuration qui relie les deux est incorrecte.
```

---

### Étape 6 - Diagnostiquer avec les DevTools du navigateur

Ouvrir les DevTools du navigateur.

Aller dans l'onglet :

```text
Network
```

Rafraîchir la page.

Observer les appels HTTP. Les appels backend doivent pointer vers :

```text
http://backend-inexistant/health
http://backend-inexistant/api/version
http://backend-inexistant/api/products
```

Résultats possibles selon le navigateur :

```text
ERR_NAME_NOT_RESOLVED
Failed to fetch
NetworkError
CORS error selon le contexte
```

Message pédagogique :

```text
Les DevTools permettent de voir les URL réellement appelées par le frontend.
```

---

### Étape 7 - Diagnostiquer avec OpenShift : vérifier les Pods

Vérifier les Pods :

```bash
oc get pods
```

Résultat attendu :

```text
Les Pods backend et frontend sont Running.
```

Vérifier spécifiquement le frontend :

```bash
oc get pods -l app=coffee-shop,component=frontend
```

Vérifier spécifiquement le backend :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Conclusion :

```text
Le problème ne vient pas d'un Pod arrêté.
```

---

### Étape 8 - Diagnostiquer avec OpenShift : vérifier les Routes

Afficher les Routes :

```bash
oc get route
```

Tester directement la Route backend :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
curl $BACKEND_ROUTE/health
```

Résultat attendu :

```text
Le backend répond correctement lorsqu'il est appelé directement.
```

Conclusion :

```text
Le backend fonctionne.
Sa Route fonctionne.
Mais le frontend n'utilise pas la bonne URL.
```

---

### Étape 9 - Diagnostiquer avec OpenShift : vérifier la ConfigMap

Afficher la ConfigMap frontend :

```bash
oc get configmap coffee-shop-frontend-config -o yaml
```

Résultat attendu :

```yaml
BACKEND_URL: http://backend-inexistant
```

Conclusion :

```text
La panne vient de la ConfigMap frontend.
```

Message pédagogique :

```text
Le diagnostic doit vérifier l'état des ressources et la configuration applicative.
```

---

### Étape 10 - Corriger la ConfigMap frontend

Récupérer la bonne Route backend :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
```

Corriger la ConfigMap frontend :

```bash
oc patch configmap coffee-shop-frontend-config \
  --type merge \
  -p "{\"data\":{\"BACKEND_URL\":\"$BACKEND_ROUTE\"}}"
```

Vérifier la correction :

```bash
oc get configmap coffee-shop-frontend-config -o yaml
```

Résultat attendu :

```yaml
BACKEND_URL: http://<route-backend>
```

---

### Étape 11 - Redémarrer le frontend après correction

Redémarrer le Deployment frontend :

```bash
oc rollout restart deployment/coffee-shop-frontend
```

Suivre le redémarrage :

```bash
oc rollout status deployment/coffee-shop-frontend
```

Observer le Pod frontend :

```bash
oc get pods -l app=coffee-shop,component=frontend
```

Résultat attendu :

```text
Le Pod frontend redémarre et repasse en 1/1 Running.
```

---

### Étape 12 - Vérifier le retour à l'état nominal

Rafraîchir la Route frontend dans le navigateur.

Résultat attendu :

```text
Le frontend s'affiche correctement.
Le statut backend est OK.
La version backend est affichée.
Les produits sont affichés.
```

Vérifier avec les DevTools :

```text
Les appels HTTP pointent à nouveau vers la vraie Route backend.
```

---

## 6. Commandes

Commandes principales du TP :

```bash
# Vérifier l'état initial
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
FRONTEND_ROUTE=$(oc get route coffee-shop-frontend -o jsonpath='{"http://"}{.spec.host}')

curl $BACKEND_ROUTE/health
oc get configmap coffee-shop-frontend-config -o yaml

# Créer la panne
oc patch configmap coffee-shop-frontend-config \
  --type merge \
  -p '{"data":{"BACKEND_URL":"http://backend-inexistant"}}'

# Redémarrer le frontend
oc rollout restart deployment/coffee-shop-frontend
oc rollout status deployment/coffee-shop-frontend

# Diagnostiquer
oc get pods
oc get route
oc get configmap coffee-shop-frontend-config -o yaml
curl $BACKEND_ROUTE/health

# Corriger
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')

oc patch configmap coffee-shop-frontend-config \
  --type merge \
  -p "{\"data\":{\"BACKEND_URL\":\"$BACKEND_ROUTE\"}}"

# Redémarrer après correction
oc rollout restart deployment/coffee-shop-frontend
oc rollout status deployment/coffee-shop-frontend
```

Commandes d'observation complémentaires :

```bash
# Voir les logs frontend
oc logs deployment/coffee-shop-frontend

# Voir les logs backend
oc logs deployment/coffee-shop-backend

# Décrire le Deployment frontend
oc describe deployment coffee-shop-frontend

# Voir les Events récents
oc get events --sort-by=.lastTimestamp

# Vérifier les Services
oc get svc
```

---

## 7. Vérifications

### Vérifier que les Pods sont Running

```bash
oc get pods
```

Résultat attendu pendant la panne :

```text
Les Pods backend et frontend sont Running.
```

C'est important : le problème n'est pas un Pod arrêté.

---

### Vérifier que le backend fonctionne directement

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
curl $BACKEND_ROUTE/health
```

Résultat attendu :

```text
status OK
```

---

### Vérifier la ConfigMap frontend pendant la panne

```bash
oc get configmap coffee-shop-frontend-config -o yaml
```

Résultat attendu pendant la panne :

```text
BACKEND_URL: http://backend-inexistant
```

---

### Vérifier la ConfigMap après correction

```bash
oc get configmap coffee-shop-frontend-config -o yaml
```

Résultat attendu après correction :

```text
BACKEND_URL: http://<route-backend>
```

---

### Vérifier l'application dans le navigateur

Ouvrir :

```text
http://<route-frontend>
```

Résultat attendu après correction :

```text
Statut backend OK
Produits affichés
Version backend affichée
```

---

### Erreurs fréquentes à vérifier

#### Le frontend affiche encore une erreur après correction

Causes possibles :

```text
Le Pod frontend n'a pas été redémarré.
La ConfigMap contient encore une mauvaise valeur.
La page navigateur n'a pas été rafraîchie.
Le backend ne répond pas directement.
```

Commandes utiles :

```bash
oc get configmap coffee-shop-frontend-config -o yaml
oc rollout restart deployment/coffee-shop-frontend
oc rollout status deployment/coffee-shop-frontend
curl $BACKEND_ROUTE/health
```

---

#### La Route backend est incorrecte

Vérifier :

```bash
oc get route coffee-shop-backend
oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}{"\n"}'
```

---

#### Le backend ne répond plus directement

Vérifier :

```bash
oc get pods -l app=coffee-shop,component=backend
oc get svc coffee-shop-backend
oc get route coffee-shop-backend
oc logs deployment/coffee-shop-backend
```

---

## 8. Questions de compréhension

### Question 1

Pourquoi le frontend peut-il être accessible alors que l'application ne fonctionne pas correctement ?

<details>
<summary>Réponse</summary>

Parce que le frontend peut démarrer correctement, mais être mal configuré pour joindre le backend.

</details>

---

### Question 2

Quelle variable indique au frontend l'URL du backend ?

<details>
<summary>Réponse</summary>

```text
BACKEND_URL
```

</details>

---

### Question 3

Dans quel objet OpenShift est stockée la variable `BACKEND_URL` ?

<details>
<summary>Réponse</summary>

Dans la ConfigMap :

```text
coffee-shop-frontend-config
```

</details>

---

### Question 4

Pourquoi faut-il redémarrer le frontend après modification de la ConfigMap ?

<details>
<summary>Réponse</summary>

Parce que `BACKEND_URL` est injectée comme variable d'environnement. Les variables d'environnement sont lues au démarrage du conteneur.

</details>

---

### Question 5

Quel outil du navigateur permet de voir les appels HTTP du frontend ?

<details>
<summary>Réponse</summary>

Les DevTools du navigateur, onglet `Network`.

</details>

---

## 9. Résultat attendu

À la fin de ce TP :

- une mauvaise valeur de `BACKEND_URL` a été configurée ;
- le frontend est resté accessible ;
- le backend est resté disponible en accès direct ;
- l'application a affiché une erreur côté frontend ;
- la panne a été diagnostiquée via les Pods, les Routes, la ConfigMap et les DevTools ;
- la ConfigMap frontend a été corrigée ;
- le frontend a été redémarré ;
- l'application est revenue à l'état nominal.

Vérification rapide après correction :

```bash
oc get configmap coffee-shop-frontend-config -o yaml
oc get pods
curl $BACKEND_ROUTE/health
```

Résultat attendu dans le navigateur :

```text
Statut backend OK
Version backend affichée
Produits affichés
```

---

## 10. Nettoyage

Le nettoyage consiste à s'assurer que la ConfigMap frontend contient la bonne URL backend.

Exécuter :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')

oc patch configmap coffee-shop-frontend-config \
  --type merge \
  -p "{\"data\":{\"BACKEND_URL\":\"$BACKEND_ROUTE\"}}"

oc rollout restart deployment/coffee-shop-frontend
oc rollout status deployment/coffee-shop-frontend
```

Vérifier :

```bash
oc get configmap coffee-shop-frontend-config -o yaml
```

Résultat attendu :

```text
BACKEND_URL pointe vers la Route backend correcte.
```

Ne supprimez pas les ressources suivantes :

```text
ConfigMap coffee-shop-frontend-config
Deployment coffee-shop-frontend
Service coffee-shop-frontend
Route coffee-shop-frontend
Deployment coffee-shop-backend
Service coffee-shop-backend
Route coffee-shop-backend
```

---

## 11. Message clé

```text
Une application peut être techniquement démarrée mais fonctionnellement cassée à cause d'une mauvaise configuration.
```

Phrase de synthèse :

```text
Le frontend fonctionne.
Le backend fonctionne.
Mais la configuration qui relie les deux est fausse.
Le diagnostic doit vérifier les composants, les routes, la configuration et les appels HTTP réels.
```

---

## 12. Transition vers le TP suivant

Dans ce TP, nous avons diagnostiqué une panne de configuration frontend/backend.

Dans les prochains exercices de dépannage, nous pourrons aller plus loin avec d'autres types de pannes :

```text
Service sans endpoints
Healthcheck en erreur
Secret manquant
```

Le prochain objectif sera donc :

```text
Approfondir les méthodes de diagnostic OpenShift avec d'autres scénarios de panne.
```
