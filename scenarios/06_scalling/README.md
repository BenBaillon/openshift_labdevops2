# Scénario 06 - Scaling de l'application

## 1. Objectif du scénario

Ce scénario permet de montrer comment OpenShift peut faire évoluer le nombre d'instances d'une application en augmentant ou en diminuant le nombre de replicas d'un `Deployment`.

L'objectif est de faire comprendre que :

```text
Une application peut tourner avec une seule instance.
OpenShift peut lancer plusieurs Pods identiques.
Le Service continue de fournir un point d'accès stable.
Le trafic peut être distribué vers plusieurs Pods.
```

Dans ce scénario, nous allons scaler le backend de l'application **OpenShift Coffee Shop** de 1 à 3 replicas, puis revenir à 1 replica.

---

## 2. Concepts OpenShift abordés

Ce scénario illustre les concepts suivants :

- `Deployment`
- `ReplicaSet`
- `Pod`
- replicas
- scaling manuel
- `Service`
- endpoints
- disponibilité applicative
- observation de plusieurs instances
- retour à l'état nominal

---

## 3. Position dans le fil rouge de formation

Ce scénario correspond à l'étape suivante du fil rouge :

```text
7. Faire évoluer l'application
```

Dans le parcours complet :

```text
Deployment
→ ReplicaSet
→ Pod unique
→ Scaling
→ Plusieurs Pods
→ Service
→ Application toujours accessible
```

Message clé :

> Pour absorber plus de charge ou améliorer la disponibilité, OpenShift peut lancer plusieurs instances d'une même application.

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

Le backend doit répondre correctement :

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

## 5. Vérifier l'état initial

Afficher le Deployment backend :

```bash
oc get deployment coffee-shop-backend
```

Résultat attendu au début du scénario :

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
coffee-shop-backend-xxxxxxxxx-yyyyy   1/1     Running   0          5m
```

---

## 6. Observer le Service avant scaling

Décrire le Service backend :

```bash
oc describe svc coffee-shop-backend
```

Observer la ligne :

```text
Endpoints: <IP_DU_POD>:8080
```

À ce stade, le Service pointe vers un seul Pod backend.

Message pédagogique :

> Le Service fournit un point d'accès stable, même si le ou les Pods derrière lui changent.

---

## 7. Scaler le backend à 3 replicas

Lancer la commande suivante :

```bash
oc scale deployment/coffee-shop-backend --replicas=3
```

Cette commande modifie le nombre de replicas souhaités dans le Deployment.

OpenShift va alors créer de nouveaux Pods pour atteindre l'état demandé.

---

## 8. Observer le Deployment après scaling

Afficher le Deployment :

```bash
oc get deployment coffee-shop-backend
```

Résultat attendu :

```text
READY   UP-TO-DATE   AVAILABLE
3/3     3            3
```

Selon le timing, le résultat peut passer temporairement par :

```text
1/3
2/3
3/3
```

Message pédagogique :

> OpenShift converge progressivement vers l'état désiré.

---

## 9. Observer les Pods créés

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

> Les trois Pods exécutent la même application backend.

---

## 10. Observer le ReplicaSet

Afficher les ReplicaSets backend :

```bash
oc get rs -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
Le ReplicaSet associé au Deployment indique 3 replicas.
```

Exemple :

```text
NAME                            DESIRED   CURRENT   READY
coffee-shop-backend-xxxxxxxxx   3         3         3
```

Message pédagogique :

> Le Deployment pilote le ReplicaSet, et le ReplicaSet maintient le nombre de Pods demandé.

---

## 11. Observer le Service après scaling

Décrire le Service backend :

```bash
oc describe svc coffee-shop-backend
```

Observer la ligne :

```text
Endpoints: <IP_POD_1>:8080,<IP_POD_2>:8080,<IP_POD_3>:8080
```

Le Service pointe maintenant vers plusieurs Pods.

Message pédagogique :

> Le Service reste le même, mais il a maintenant plusieurs destinations possibles.

---

## 12. Tester l'application après scaling

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

Ouvrir également le frontend dans le navigateur.

Résultat attendu :

```text
Le frontend reste accessible.
Le statut backend reste OK.
Les produits sont toujours affichés.
```

---

## 13. Ajouter une observation via les logs

Afficher les logs du backend :

```bash
oc logs deployment/coffee-shop-backend
```

Remarque :

```text
Avec plusieurs replicas, oc logs deployment/... peut afficher les logs d'un Pod sélectionné par OpenShift.
```

Pour voir les Pods individuellement :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Puis :

```bash
oc logs <pod-name>
```

Message pédagogique :

> Quand une application tourne sur plusieurs Pods, il faut parfois regarder les logs de l'instance concernée.

---

## 14. Revenir à 1 replica

Pour revenir à l'état nominal :

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
OpenShift supprime progressivement les Pods en trop.
Il ne reste qu'un seul Pod backend Running et Ready.
```

---

## 15. Vérifier le retour à l'état nominal

Décrire le Service backend :

```bash
oc describe svc coffee-shop-backend
```

Résultat attendu :

```text
Endpoints: <IP_DU_POD>:8080
```

Tester l'application :

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

## 16. Variante : scaler le frontend

Le même principe peut être appliqué au frontend :

```bash
oc scale deployment/coffee-shop-frontend --replicas=3
```

Observer :

```bash
oc get pods -l app=coffee-shop,component=frontend
oc describe svc coffee-shop-frontend
```

Revenir à une instance :

```bash
oc scale deployment/coffee-shop-frontend --replicas=1
```

Message pédagogique :

> Chaque composant peut être scalé indépendamment selon ses besoins.

---

## 17. Commandes récapitulatives

```bash
# Vérifier l'état initial
oc get deployment coffee-shop-backend
oc get pods -l app=coffee-shop,component=backend
oc describe svc coffee-shop-backend

# Scaler à 3 replicas
oc scale deployment/coffee-shop-backend --replicas=3

# Observer
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

---

## 18. Ce que l'on doit observer

1. Le Deployment contient un nombre de replicas souhaité.
2. OpenShift crée ou supprime des Pods pour atteindre ce nombre.
3. Plusieurs Pods peuvent exécuter la même application.
4. Le Service reste stable même si le nombre de Pods change.
5. Les endpoints du Service évoluent lorsque le nombre de Pods change.
6. Le scaling peut être appliqué indépendamment au backend ou au frontend.
7. Le scaling manuel est simple, mais il ne remplace pas une stratégie d'autoscaling.

---

## 19. Méthode d'observation à  retenir

Pour observer un scaling, suivre cette méthode :

```text
1. Regarder le Deployment.
2. Regarder les Pods.
3. Regarder le ReplicaSet.
4. Regarder le Service.
5. Regarder les endpoints du Service.
6. Tester l'application.
```

Commandes associées :

```bash
oc get deployment coffee-shop-backend
oc get pods -l app=coffee-shop,component=backend
oc get rs -l app=coffee-shop,component=backend
oc describe svc coffee-shop-backend
curl $BACKEND_ROUTE/health
```

---

## 20. Différence entre scaling manuel et HPA

Ce scénario montre le scaling manuel :

```bash
oc scale deployment/coffee-shop-backend --replicas=3
```

Le scaling manuel signifie :

```text
C'est l'utilisateur qui choisit le nombre de replicas.
```

L'autoscaling, avec un `Horizontal Pod Autoscaler`, signifie :

```text
OpenShift ajuste automatiquement le nombre de replicas selon des métriques comme CPU ou mémoire.
```

---

## 21. Message clé à retenir

> OpenShift permet de faire évoluer une application en ajustant le nombre de replicas. Le Service reste stable et envoie le trafic vers les Pods disponibles.

Phrase de synthèse :

```text
Je modifie le nombre de replicas.
OpenShift crée ou supprime des Pods.
Le Service met à jour ses endpoints.
L'application reste accessible.
Je peux revenir à l'état initial à tout moment.
```
