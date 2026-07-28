# Scénario 03 - Healthcheck en erreur

## 1. Objectif du scénario

Ce scénario permet de simuler une panne applicative détectée par les probes OpenShift.

L'objectif est de faire comprendre que :

```text
Un Pod peut exister.
Un conteneur peut démarrer.
Mais l'application peut ne pas être considérée comme prête ou saine.
```

Dans ce scénario, nous allons activer un mode erreur volontaire sur le backend de l'application **OpenShift Coffee Shop** avec la variable :

```text
FAIL_MODE=true
```

Cette variable provoque des réponses en erreur sur les endpoints techniques :

```text
/health
/ready
```

OpenShift utilise ces endpoints pour évaluer l'état de l'application à travers :

```text
livenessProbe
readinessProbe
```

---

## 2. Concepts OpenShift abordés

Ce scénario illustre les concepts suivants :

- `Pod`
- `Deployment`
- `Readiness Probe`
- `Liveness Probe`
- état `Ready` d'un Pod
- redémarrage de conteneur
- logs applicatifs
- events OpenShift
- diagnostic avec `oc describe`
- diagnostic avec `oc logs`

---

## 3. Position dans le fil rouge de formation

Ce scénario correspond principalement à l'étape suivante du fil rouge :

```text
10. Dépanner
```

Il peut aussi être rattaché à une étape intermédiaire :

```text
Vérifier que l'application fonctionne correctement
```

Dans le parcours complet :

```text
Deployment
→ Pod
→ Application démarrée
→ Readiness Probe
→ Liveness Probe
→ Diagnostic
```

Message clé :

> OpenShift ne se contente pas de démarrer un conteneur. OpenShift vérifie aussi que l'application est vivante et prête à recevoir du trafic.

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

```text
http://<route-backend>/health
http://<route-backend>/ready
```

Résultat attendu avant la panne :

```text
/health → OK
/ready  → READY
```

---

## 5. Vérifier l'état initial

Récupérer l'URL de la Route backend :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
```

Tester `/health` :

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

Tester `/ready` :

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

Vérifier les Pods :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
Le Pod backend est Running et Ready.
```

Exemple :

```text
NAME                                  READY   STATUS    RESTARTS   AGE
coffee-shop-backend-xxxxxxxxx-yyyyy   1/1     Running   0          5m
```

---

## 6. Vérifier les probes dans le Deployment

Afficher le Deployment backend :

```bash
oc describe deployment coffee-shop-backend
```

Ou afficher le YAML :

```bash
oc get deployment coffee-shop-backend -o yaml
```

Les probes attendues sont :

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

Message pédagogique :

> La readiness probe indique si l'application est prête à recevoir du trafic. La liveness probe indique si l'application est encore vivante.

---

## 7. Créer volontairement la panne

Activer le mode erreur sur le backend :

```bash
oc set env deployment/coffee-shop-backend FAIL_MODE=true
```

Cette commande modifie le template du Deployment et déclenche un nouveau rollout.

Suivre le rollout :

```bash
oc rollout status deployment/coffee-shop-backend
```

Observer les Pods :

```bash
oc get pods -l app=coffee-shop,component=backend
```

---

## 8. Observer les effets de la panne

Tester `/health` :

```bash
curl $BACKEND_ROUTE/health
```

Résultat attendu :

```json
{
  "status": "KO",
  "message": "Application is in fail mode"
}
```

Le code HTTP attendu est :

```text
500
```

Tester `/ready` :

```bash
curl $BACKEND_ROUTE/ready
```

Résultat attendu :

```json
{
  "status": "NOT_READY",
  "message": "Application is not ready because FAIL_MODE=true"
}
```

Le code HTTP attendu est :

```text
503
```

---

## 9. Observer l'état des Pods

Afficher les Pods backend :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Selon le timing et la configuration des probes, plusieurs comportements peuvent être observés :

```text
Pod Running mais non Ready
Pod en redémarrage
RESTARTS qui augmente
Rollout bloqué
```

Exemples possibles :

```text
READY   STATUS    RESTARTS
0/1     Running   0
```

ou :

```text
READY   STATUS    RESTARTS
0/1     Running   2
```

Message pédagogique :

> Un Pod peut être Running sans être Ready.

---

## 10. Diagnostic avec oc describe pod

Récupérer le nom du Pod backend :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Décrire le Pod :

```bash
oc describe pod <pod-name>
```

Chercher les sections suivantes :

```text
Readiness probe failed
Liveness probe failed
Events
Restart count
Conditions
```

Les Events peuvent afficher des messages du type :

```text
Readiness probe failed: HTTP probe failed with statuscode: 503
Liveness probe failed: HTTP probe failed with statuscode: 500
```

Message pédagogique :

> `oc describe pod` permet de voir ce qu'OpenShift observe sur le Pod.

---

## 11. Diagnostic avec oc logs

Afficher les logs du backend :

```bash
oc logs deployment/coffee-shop-backend
```

Ou suivre les logs :

```bash
oc logs -f deployment/coffee-shop-backend
```

Si le conteneur redémarre, il peut être utile d'afficher les logs précédents :

```bash
oc logs <pod-name> --previous
```

Message pédagogique :

> `oc logs` montre ce que l'application écrit. `oc describe` montre ce qu'OpenShift constate.

---

## 12. Diagnostic avec les Events

Afficher les Events récents :

```bash
oc get events --sort-by=.lastTimestamp
```

Chercher les événements liés au backend :

```text
Unhealthy
Readiness probe failed
Liveness probe failed
Back-off restarting failed container
```

Message pédagogique :

> Les Events racontent l'historique récent des problèmes observés par OpenShift.

---

## 13. Correction

Désactiver le mode erreur :

```bash
oc set env deployment/coffee-shop-backend FAIL_MODE=false
```

Suivre le rollout :

```bash
oc rollout status deployment/coffee-shop-backend
```

Vérifier les Pods :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Le Pod doit revenir en état :

```text
1/1 Running
```

---

## 14. Vérifier le retour à l'état nominal

Tester `/health` :

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

Tester `/ready` :

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

Vérifier les Pods :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
READY   STATUS
1/1     Running
```

---
## 15. Commandes récapitulatives

```bash
# Récupérer la Route backend
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')

# Vérifier l'état initial
curl $BACKEND_ROUTE/health
curl $BACKEND_ROUTE/ready
oc get pods -l app=coffee-shop,component=backend

# Créer la panne
oc set env deployment/coffee-shop-backend FAIL_MODE=true
oc rollout status deployment/coffee-shop-backend

# Observer
oc get pods -l app=coffee-shop,component=backend
curl $BACKEND_ROUTE/health
curl $BACKEND_ROUTE/ready

# Diagnostiquer
oc describe pod <pod-name>
oc logs deployment/coffee-shop-backend
oc get events --sort-by=.lastTimestamp

# Corriger
oc set env deployment/coffee-shop-backend FAIL_MODE=false
oc rollout status deployment/coffee-shop-backend

# Vérifier le retour nominal
curl $BACKEND_ROUTE/health
curl $BACKEND_ROUTE/ready
oc get pods -l app=coffee-shop,component=backend
```

---

## 16. Ce que l'on doit observer

1. Le backend peut démarrer mais ne pas être prêt.
2. `/ready` pilote la capacité à recevoir du trafic.
3. `/health` pilote la détection d'une application bloquée ou défaillante.
4. Une probe en échec peut rendre un Pod non Ready.
5. Une liveness probe en échec peut provoquer des redémarrages.
6. `oc get pods` donne une première indication.
7. `oc describe pod` explique les échecs de probes.
8. `oc logs` donne le point de vue de l'application.
9. `oc get events` donne le point de vue d'OpenShift.

---

## 17. Méthode de diagnostic à retenir

Pour une panne de santé applicative, suivre cette méthode :

```text
1. Le Pod est-il Running ?
2. Le Pod est-il Ready ?
3. Les probes échouent-elles ?
4. Que dit oc describe pod ?
5. Que disent les logs applicatifs ?
6. Y a-t-il des Events Unhealthy ?
7. Quelle configuration a changé récemment ?
```

Commandes associées :

```bash
oc get pods
oc describe pod <pod-name>
oc logs deployment/coffee-shop-backend
oc get events --sort-by=.lastTimestamp
oc set env deployment/coffee-shop-backend --list
```

---

## 18. Message clé à retenir

> OpenShift surveille les applications grâce aux probes. Une application doit être démarrée, vivante et prête pour être réellement utilisable.

Phrase de synthèse :

```text
Le Pod démarre.
OpenShift interroge /ready et /health.
Si /ready échoue, le Pod ne reçoit pas de trafic.
Si /health échoue, OpenShift peut redémarrer le conteneur.
Le diagnostic passe par get pods, describe, logs et events.
```
