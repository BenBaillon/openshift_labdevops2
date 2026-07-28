# Scénario 02 - Backend URL incorrecte

## 1. Objectif du scénario

Ce scénario permet de simuler une panne de configuration entre le frontend et le backend de l'application **OpenShift Coffee Shop**.

L'objectif est de faire comprendre qu'une application peut être :

```text
correctement démarrée
correctement exposée
visible dans le navigateur
mais mal configurée
```

Dans ce scénario, le frontend reste accessible, mais il ne parvient plus à joindre le backend car la variable `BACKEND_URL` contient une mauvaise valeur.

---

## 2. Concepts OpenShift abordés

Ce scénario illustre les concepts suivants :

- `ConfigMap`
- variable d'environnement
- `Deployment`
- `Pod`
- `Route`
- communication frontend/backend
- redémarrage de Pod après modification de configuration
- diagnostic navigateur avec DevTools
- diagnostic OpenShift avec `oc logs`, `oc describe`, `oc get route` et `oc get configmap`

---

## 3. Position dans le fil rouge de formation

Ce scénario correspond principalement aux étapes suivantes du fil rouge :

```text
5. Configurer l'application
6. Permettre aux composants de communiquer
10. Dépanner
```

Dans le parcours complet :

```text
Frontend
→ Configuration BACKEND_URL
→ Route backend
→ Backend API
```

Message clé :

> Une application peut être disponible, mais ne pas fonctionner correctement si sa configuration est incorrecte.

---

## 4. Pré-requis

Avant de commencer ce scénario, l'application doit être déployée et fonctionnelle sur OpenShift.

Les ressources suivantes doivent exister :

```bash
oc get deployment coffee-shop-frontend
oc get deployment coffee-shop-backend
oc get route coffee-shop-frontend
oc get route coffee-shop-backend
oc get configmap coffee-shop-frontend-config
```

Le frontend doit être accessible depuis un navigateur.

Le backend doit répondre correctement :

```text
http://<route-backend>/health
http://<route-backend>/api/version
http://<route-backend>/api/products
```

Dans l'application frontend, le statut backend doit être :

```text
OK
```

---

## 5. Vérifier l'état initial

Récupérer l'URL du backend :

```bash
oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}{"\n"}'
```

Récupérer l'URL du frontend :

```bash
oc get route coffee-shop-frontend -o jsonpath='{"http://"}{.spec.host}{"\n"}'
```

Ouvrir la Route frontend dans un navigateur.

Résultat attendu :

```text
Frontend : v1
Environnement : training
Backend URL : http://<route-backend>
Statut backend : OK
Version backend : v1
Produits affichés
```

---

## 6. Vérifier la ConfigMap frontend

Afficher la ConfigMap du frontend :

```bash
oc get configmap coffee-shop-frontend-config -o yaml
```

La valeur de `BACKEND_URL` doit pointer vers la Route backend correcte :

```yaml
data:
  BACKEND_URL: http://<route-backend>
  FRONTEND_VERSION: v1
  APP_ENV: training
```

Cette ConfigMap est injectée dans le Pod frontend sous forme de variables d'environnement.

---

## 7. Créer volontairement la panne

Modifier la ConfigMap pour renseigner une mauvaise URL backend :

```bash
oc patch configmap coffee-shop-frontend-config \
  --type merge \
  -p '{"data":{"BACKEND_URL":"http://backend-inexistant"}}'
```

Cette commande modifie uniquement la ConfigMap.

Important : une variable d'environnement injectée dans un Pod est lue au démarrage du Pod. Le Pod frontend existant ne récupère donc pas automatiquement la nouvelle valeur.

Il faut redémarrer le Deployment frontend.

```bash
oc rollout restart deployment/coffee-shop-frontend
oc rollout status deployment/coffee-shop-frontend
```

---

## 8. Observer le résultat côté utilisateur

Ouvrir ou rafraîchir la Route frontend dans le navigateur.

Résultat attendu :

```text
Le frontend reste accessible.
Le backend devient inaccessible.
Les produits ne se chargent plus.
Un message d'erreur est affiché.
```

Ce point est important :

> Le problème ne vient pas du frontend lui-même. Le frontend fonctionne, mais il ne sait plus joindre le backend.

---

## 9. Diagnostic avec les DevTools du navigateur

Ouvrir les DevTools du navigateur.

Aller dans l'onglet **Network**.

Rafraîchir la page.

Les requêtes vers le backend doivent échouer.

Exemple attendu :

```text
http://backend-inexistant/health
http://backend-inexistant/api/version
http://backend-inexistant/api/products
```

Les erreurs possibles peuvent être :

```text
ERR_NAME_NOT_RESOLVED
Failed to fetch
NetworkError
CORS error selon le navigateur
```

Message pédagogique :

> Le navigateur est un outil de diagnostic très utile lorsqu'une application frontend ne parvient pas à joindre un backend.

---

## 10. Diagnostic avec OpenShift

### 10.1 Vérifier que le frontend tourne

```bash
oc get pods -l app=coffee-shop,component=frontend
```

Résultat attendu :

```text
Le Pod frontend est Running et Ready.
```

Cela confirme que le frontend n'est pas arrêté.

---

### 10.2 Vérifier que le backend tourne

```bash
oc get pods -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
Le Pod backend est Running et Ready.
```

Cela confirme que le backend n'est pas arrêté.

---

### 10.3 Vérifier les Routes

```bash
oc get route
```

La Route backend doit exister.

Tester directement la Route backend :

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

Cela confirme que le backend fonctionne lorsqu'il est appelé directement.

---

### 10.4 Vérifier la ConfigMap frontend

```bash
oc get configmap coffee-shop-frontend-config -o yaml
```

La valeur incorrecte doit être visible :

```yaml
data:
  BACKEND_URL: http://backend-inexistant
```

Conclusion du diagnostic :

```text
Frontend : OK
Backend : OK
Route backend : OK
Configuration frontend : KO
```

---

## 11. Correction

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

Redémarrer le Deployment frontend :

```bash
oc rollout restart deployment/coffee-shop-frontend
oc rollout status deployment/coffee-shop-frontend
```

---

## 12. Vérifier la correction

Afficher la ConfigMap :

```bash
oc get configmap coffee-shop-frontend-config -o yaml
```

La valeur doit être revenue à une URL valide :

```yaml
data:
  BACKEND_URL: http://<route-backend>
```

Ouvrir la Route frontend dans un navigateur.

Résultat attendu :

```text
Statut backend : OK
Version backend : v1
Produits affichés
```

---

## 14. Commandes récapitulatives

```bash
# Vérifier l'état initial
oc get route
oc get configmap coffee-shop-frontend-config -o yaml

# Créer la panne
oc patch configmap coffee-shop-frontend-config \
  --type merge \
  -p '{"data":{"BACKEND_URL":"http://backend-inexistant"}}'

oc rollout restart deployment/coffee-shop-frontend
oc rollout status deployment/coffee-shop-frontend

# Diagnostiquer
oc get pods -l app=coffee-shop,component=frontend
oc get pods -l app=coffee-shop,component=backend
oc get route
oc get configmap coffee-shop-frontend-config -o yaml

BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
curl $BACKEND_ROUTE/health

# Corriger
oc patch configmap coffee-shop-frontend-config \
  --type merge \
  -p "{\"data\":{\"BACKEND_URL\":\"$BACKEND_ROUTE\"}}"

oc rollout restart deployment/coffee-shop-frontend
oc rollout status deployment/coffee-shop-frontend
```

---

## 15. Ce que l'on doit observer


1. Le frontend peut être accessible même si l'application ne fonctionne pas complètement.
2. Le backend peut être disponible, mais non joignable par le frontend à cause d'une mauvaise configuration.
3. Une ConfigMap permet d'externaliser la configuration.
4. Modifier une ConfigMap ne redémarre pas automatiquement les Pods qui consomment ses valeurs en variables d'environnement.
5. Un rollout restart est nécessaire pour forcer le frontend à relire la configuration.
6. Les DevTools du navigateur permettent de voir les appels HTTP réellement effectués.
7. Le diagnostic doit séparer l'état du frontend, du backend, de la Route et de la configuration.

---

## 16. Méthode de diagnostic à retenir

Pour ce type d'incident, suivre cette méthode :

```text
1. Le frontend est-il accessible ?
2. Le backend fonctionne-t-il directement ?
3. La Route backend existe-t-elle ?
4. Quelle URL backend le frontend utilise-t-il ?
5. La ConfigMap contient-elle la bonne valeur ?
6. Le Pod frontend a-t-il été redémarré après modification ?
7. Que montrent les DevTools du navigateur ?
```

Commandes associées :

```bash
oc get route
oc get pods
oc get configmap coffee-shop-frontend-config -o yaml
oc logs deployment/coffee-shop-frontend
```

---


## 17. Message clé à retenir

> Une application peut être techniquement démarrée, mais fonctionnellement cassée si sa configuration est incorrecte.

Phrase de synthèse :

```text
Le frontend fonctionne.
Le backend fonctionne.
Mais la configuration qui relie les deux est fausse.
Le diagnostic doit donc vérifier les composants et la configuration.
```
