# Scénario 04 - Service selector incorrect

## 1. Objectif du scénario

Ce scénario permet de simuler une panne de communication entre un Service OpenShift et les Pods backend de l'application **OpenShift Coffee Shop**.

L'objectif est de faire comprendre que :

```text
Un Service ne trouve pas les Pods automatiquement.
Un Service utilise des selectors.
Les selectors doivent correspondre aux labels des Pods.
Si les selectors sont incorrects, le Service n'a plus d'endpoints.
```

Dans ce scénario, nous allons modifier volontairement le selector du Service backend afin qu'il ne corresponde plus aux labels des Pods backend.

Résultat attendu :

```text
Le backend Pod continue de tourner.
Le Service backend existe toujours.
La Route backend existe toujours.
Mais la Route ne permet plus d'atteindre l'application.
```

---

## 2. Concepts OpenShift abordés

Ce scénario illustre les concepts suivants :

- `Service`
- `Selector`
- `Labels`
- `Endpoints`
- `Pod`
- `Deployment`
- `Route`
- communication applicative
- diagnostic réseau simple
- dépannage avec `oc describe svc`
- dépannage avec `oc get pods --show-labels`

---

## 3. Position dans le fil rouge de formation

Ce scénario correspond principalement aux étapes suivantes du fil rouge :

```text
6. Permettre aux composants de communiquer
10. Dépanner
```

Dans le parcours complet :

```text
Pod backend
→ Labels du Pod
→ Service backend
→ Selector du Service
→ Endpoints
→ Route backend
→ Utilisateur
```

Message clé :

> Un Service OpenShift s'appuie sur des labels pour trouver les Pods vers lesquels envoyer le trafic.

---

## 4. Pré-requis

Avant de commencer ce scénario, l'application doit être déployée et fonctionnelle sur OpenShift.

Les ressources suivantes doivent exister :

```bash
oc get deployment coffee-shop-backend
oc get pods -l app=coffee-shop,component=backend
oc get svc coffee-shop-backend
oc get route coffee-shop-backend
```

Le backend doit répondre correctement avant la panne :

```text
http://<route-backend>/health
http://<route-backend>/api/products
http://<route-backend>/api/version
```

---

## 5. Vérifier l'état initial

Récupérer la Route backend :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
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

Vérifier les Pods backend :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
Le Pod backend est Running et Ready.
```

---

## 6. Observer les labels des Pods

Afficher les Pods avec leurs labels :

```bash
oc get pods --show-labels
```

Ou filtrer uniquement le backend :

```bash
oc get pods -l app=coffee-shop,component=backend --show-labels
```

Les Pods backend doivent porter des labels similaires à :

```text
app=coffee-shop
component=backend
```

Exemple :

```text
NAME                                  READY   STATUS    LABELS
coffee-shop-backend-xxxxxxxxx-yyyyy   1/1     Running   app=coffee-shop,component=backend,pod-template-hash=xxxxxxxxx
```

Message pédagogique :

> Les labels sont des étiquettes posées sur les objets OpenShift. Les Services les utilisent pour sélectionner les Pods.

---

## 7. Observer le selector du Service

Afficher le Service backend :

```bash
oc describe svc coffee-shop-backend
```

Chercher les lignes suivantes :

```text
Selector: app=coffee-shop,component=backend
Endpoints: <IP_DU_POD>:8080
```

Le selector doit correspondre aux labels du Pod backend.

Afficher le Service en YAML :

```bash
oc get svc coffee-shop-backend -o yaml
```

On doit retrouver :

```yaml
spec:
  selector:
    app: coffee-shop
    component: backend
```

Message pédagogique :

> Si le selector du Service correspond aux labels des Pods, le Service possède des endpoints.

---

## 8. Créer volontairement la panne

Modifier le selector du Service backend avec une valeur incorrecte :

```bash
oc patch service coffee-shop-backend \
  --type merge \
  -p '{"spec":{"selector":{"app":"coffee-shop","component":"backend-broken"}}}'
```

Cette commande change le Service pour qu'il cherche des Pods avec le label :

```text
component=backend-broken
```

Mais les Pods backend portent toujours :

```text
component=backend
```

Le Service ne correspond donc plus à aucun Pod.

---

## 9. Observer le résultat côté Service

Décrire le Service :

```bash
oc describe svc coffee-shop-backend
```

Résultat attendu :

```text
Selector:  app=coffee-shop,component=backend-broken
Endpoints: <none>
```

Le point le plus important est :

```text
Endpoints: <none>
```

Message pédagogique :

> Le Service existe, mais il n'a plus de destination.

---

## 10. Observer le résultat côté utilisateur

Tester la Route backend :

```bash
curl $BACKEND_ROUTE/health
```

Selon la configuration du routeur OpenShift, le résultat peut être :

```text
503 Service Unavailable
```

ou une erreur indiquant que le backend n'est pas joignable.

Dans le frontend, le statut backend peut devenir inaccessible si le frontend appelle la Route backend.

Résultat pédagogique attendu :

```text
Le Pod backend fonctionne encore.
Mais le trafic ne l'atteint plus.
```

---

## 11. Diagnostic étape par étape

### 11.1 Vérifier que le Pod backend tourne

```bash
oc get pods -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
Le Pod backend est toujours Running.
```

Cela prouve que le problème ne vient pas du Pod.

---

### 11.2 Vérifier que la Route existe

```bash
oc get route coffee-shop-backend
```

Résultat attendu :

```text
La Route existe toujours.
```

Cela prouve que le problème ne vient pas de la disparition de la Route.

---

### 11.3 Vérifier que le Service existe

```bash
oc get svc coffee-shop-backend
```

Résultat attendu :

```text
Le Service existe toujours.
```

Cela prouve que le problème ne vient pas de la suppression du Service.

---

### 11.4 Vérifier les endpoints du Service

```bash
oc describe svc coffee-shop-backend
```

Résultat attendu :

```text
Endpoints: <none>
```

C'est l'indice principal.

---

### 11.5 Comparer labels et selector

Afficher les labels des Pods :

```bash
oc get pods --show-labels
```

Afficher le selector du Service :

```bash
oc describe svc coffee-shop-backend
```

Comparer :

```text
Pod label:        component=backend
Service selector: component=backend-broken
```

Conclusion :

```text
Le Service ne sélectionne plus les Pods backend.
```

---

## 12. Correction

Restaurer le bon selector du Service :

```bash
oc patch service coffee-shop-backend \
  --type merge \
  -p '{"spec":{"selector":{"app":"coffee-shop","component":"backend"}}}'
```

Vérifier le Service :

```bash
oc describe svc coffee-shop-backend
```

Résultat attendu :

```text
Selector:  app=coffee-shop,component=backend
Endpoints: <IP_DU_POD>:8080
```

---

## 13. Vérifier le retour à l'état nominal

Tester à nouveau la Route backend :

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

Tester aussi :

```bash
curl $BACKEND_ROUTE/api/products
curl $BACKEND_ROUTE/api/version
```

Dans le frontend, le statut backend doit redevenir :

```text
OK
```

Il peut être nécessaire de rafraîchir la page frontend.

---

## 14. Commandes récapitulatives

```bash
# Récupérer la Route backend
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')

# Vérifier l'état initial
curl $BACKEND_ROUTE/health
oc get pods -l app=coffee-shop,component=backend --show-labels
oc describe svc coffee-shop-backend

# Créer la panne
oc patch service coffee-shop-backend \
  --type merge \
  -p '{"spec":{"selector":{"app":"coffee-shop","component":"backend-broken"}}}'

# Observer
oc describe svc coffee-shop-backend
curl $BACKEND_ROUTE/health

# Diagnostiquer
oc get pods --show-labels
oc get svc coffee-shop-backend
oc get route coffee-shop-backend
oc describe svc coffee-shop-backend

# Corriger
oc patch service coffee-shop-backend \
  --type merge \
  -p '{"spec":{"selector":{"app":"coffee-shop","component":"backend"}}}'

# Vérifier le retour nominal
oc describe svc coffee-shop-backend
curl $BACKEND_ROUTE/health
```

---

## 15. Ce que l'on doit observer

1. Le Pod backend continue de fonctionner.
2. La Route backend existe toujours.
3. Le Service backend existe toujours.
4. Le Service n'a plus d'endpoints.
5. Le problème vient du selector du Service.
6. Les labels des Pods et les selectors du Service doivent correspondre.
7. Une application peut être inaccessible même si les Pods sont Running.

---

## 16. Méthode de diagnostic à retenir

Pour une panne d'accès via Service, suivre cette méthode :

```text
1. La Route existe-t-elle ?
2. Le Service existe-t-il ?
3. Le Service a-t-il des endpoints ?
4. Les Pods existent-ils ?
5. Les Pods sont-ils Running et Ready ?
6. Les labels des Pods correspondent-ils au selector du Service ?
```

Commandes associées :

```bash
oc get route
oc get svc
oc describe svc coffee-shop-backend
oc get pods --show-labels
oc get pods
```
---

## 17. Différence entre Service et Route

Ce scénario permet aussi de rappeler la différence entre Service et Route.

```text
Service : point d'accès stable à l'intérieur du cluster
Route   : point d'accès externe vers un Service
```

Dans ce scénario :

```text
La Route existe.
Le Service existe.
Mais le Service n'a plus de Pods derrière lui.
Donc la Route ne peut plus servir l'application.
```

Phrase pédagogique :

> La Route expose le Service, mais si le Service ne pointe vers aucun Pod, la Route ne peut rien exposer d'utile.

---

## 18. Message clé à retenir

> Un Service OpenShift utilise des selectors pour trouver les Pods. Si le selector ne correspond pas aux labels, le Service n'a plus d'endpoints.

Phrase de synthèse :

```text
Le Pod porte des labels.
Le Service possède un selector.
Si les deux correspondent, le Service envoie le trafic vers le Pod.
Si les deux ne correspondent pas, le Service n'a aucune destination.
```
