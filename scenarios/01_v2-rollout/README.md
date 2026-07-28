# Scénario 01 - Rollout / Rollback vers une version v2

## 1. Objectif du scénario

Ce scénario permet de montrer comment OpenShift gère la mise à jour d'une application et comment revenir à une version précédente en cas de problème.

L'objectif est de faire comprendre que :

```text
Une application déployée peut évoluer.
OpenShift applique cette évolution sous forme de rollout.
OpenShift conserve un historique.
OpenShift permet un rollback.
```

Dans ce scénario, nous allons faire évoluer le backend de l'application **OpenShift Coffee Shop** de la version `v1` vers la version `v2`, puis revenir à la version précédente.

---

## 2. Concepts OpenShift abordés

Ce scénario illustre les concepts suivants :

- `Deployment`
- `ReplicaSet`
- `Pod`
- `Rollout`
- `Rollback`
- historique de déploiement
- variable d'environnement
- redémarrage contrôlé d'une application
- observation d'une nouvelle version applicative

---

## 3. Position dans le fil rouge de formation

Ce scénario correspond à l'étape suivante du fil rouge :

```text
8. Déployer une nouvelle version
```

Dans le parcours complet :

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
→ Nouvelle version
→ Rollback si besoin
```

Message clé :

> OpenShift permet de publier une nouvelle version d'une application tout en gardant la possibilité de revenir en arrière.

---

## 4. Pré-requis

Avant de commencer ce scénario, l'application doit déjà être déployée et fonctionnelle sur OpenShift.

Les composants suivants doivent exister :

```text
coffee-shop-backend
coffee-shop-frontend
```

Les ressources backend doivent être présentes :

```bash
oc get deployment coffee-shop-backend
oc get pods
oc get svc coffee-shop-backend
oc get route coffee-shop-backend
```

Le backend doit répondre correctement :

```text
http://<route-backend>/api/version
```

La version initiale attendue est :

```text
v1
```

---

## 5. Vérifier l'état initial

Récupérer l'URL de la Route backend :

```bash
oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}{"\n"}'
```

Tester l'endpoint de version dans un navigateur :

```text
http://<route-backend>/api/version
```

Ou en ligne de commande :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
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

---

## 6. Observer le Deployment avant modification

Afficher le Deployment :

```bash
oc get deployment coffee-shop-backend
```

Afficher les Pods :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Afficher l'historique de rollout :

```bash
oc rollout history deployment/coffee-shop-backend
```

À ce stade, il peut y avoir un seul ou plusieurs historiques selon les manipulations déjà réalisées.

---

## 7. Déployer une nouvelle version v2

Dans ce premier scénario, la version applicative est modifiée par variable d'environnement.

Cette approche est volontairement simple pour les débutants : elle permet de se concentrer sur le mécanisme de rollout sans introduire immédiatement un nouveau commit Git ou un nouveau build.

Lancer la mise à jour :

```bash
oc set env deployment/coffee-shop-backend APP_VERSION=v2
```

Cette commande modifie le template du Deployment. OpenShift détecte ce changement et déclenche un nouveau rollout.

---

## 8. Observer le rollout

Suivre le rollout :

```bash
oc rollout status deployment/coffee-shop-backend
```

Observer les Pods :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Pendant quelques instants, il est possible de voir :

```text
ancien Pod en Terminating
nouveau Pod en Running
```

Observer le Deployment :

```bash
oc get deployment coffee-shop-backend
```

Observer les ReplicaSets :

```bash
oc get rs -l app=coffee-shop,component=backend
```

Message pédagogique :

> Le Deployment crée un nouveau ReplicaSet pour porter la nouvelle version, puis remplace progressivement les anciens Pods.

---

## 9. Vérifier la version v2

Récupérer à nouveau la Route backend si nécessaire :

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
  "version": "v2",
  "environment": "training",
  "message": "Bonjour depuis une ConfigMap OpenShift"
}
```

Dans le frontend, la carte **Version backend** doit également afficher :

```text
v2
```

Il peut être nécessaire de rafraîchir la page frontend.

---

## 10. Consulter l'historique de déploiement

Afficher l'historique :

```bash
oc rollout history deployment/coffee-shop-backend
```

Résultat attendu :

```text
deployment.apps/coffee-shop-backend
REVISION  CHANGE-CAUSE
1         <none>
2         <none>
```

Selon les manipulations précédentes, les numéros de révision peuvent être différents.

---

## 11. Revenir à la version précédente

Effectuer un rollback :

```bash
oc rollout undo deployment/coffee-shop-backend
```

Suivre le rollback :

```bash
oc rollout status deployment/coffee-shop-backend
```

Observer les Pods :

```bash
oc get pods -l app=coffee-shop,component=backend
```

---

## 12. Vérifier le retour arrière

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

Le backend doit être revenu en version `v1`.

---


## 13. Commandes récapitulatives

```bash
# Vérifier la version actuelle
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
curl $BACKEND_ROUTE/api/version

# Déployer la version v2
oc set env deployment/coffee-shop-backend APP_VERSION=v2

# Observer le rollout
oc rollout status deployment/coffee-shop-backend
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

---

## 15. Ce que l'on doit observer

1. La commande `oc set env` modifie le Deployment.
2. La modification du Deployment déclenche un rollout.
3. Un nouveau Pod est créé.
4. L'ancien Pod est progressivement remplacé.
5. La version exposée par l'API passe de `v1` à `v2`.
6. OpenShift conserve un historique des révisions.
7. La commande `oc rollout undo` permet de revenir à l'état précédent.
8. Après rollback, l'API revient en version `v1`.

---

## 16. Variante avancée possible

Une variante plus réaliste consisterait à :

```text
modifier le code source
committer la modification
relancer un build OpenShift
produire une nouvelle image
mettre à jour le Deployment
observer le rollout
```

---

## 19. Message clé à retenir

> OpenShift permet de faire évoluer une application de manière contrôlée, d'observer le déploiement d'une nouvelle version et de revenir en arrière si nécessaire.

Phrase de synthèse :

```text
Je modifie le Deployment.
OpenShift crée une nouvelle révision.
OpenShift remplace les Pods.
Je vérifie la nouvelle version.
Si besoin, je reviens en arrière.
```
