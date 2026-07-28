# Scénario 05 - Secret manquant ou incorrect

## 1. Objectif du scénario

Ce scénario permet de simuler un problème lié à un `Secret` OpenShift utilisé par le backend de l'application **OpenShift Coffee Shop**.

L'objectif est de faire comprendre que :

```text
Un Secret contient une donnée sensible.
Un Deployment peut référencer un Secret.
Si le Secret est absent ou incorrect, le Pod peut ne pas démarrer correctement.
```

Dans ce scénario, nous allons provoquer une panne en supprimant ou en modifiant le Secret utilisé par le backend.

Résultat attendu :

```text
Le Deployment backend existe toujours.
Le Pod backend peut échouer au démarrage ou rester bloqué.
OpenShift affiche des erreurs liées au Secret manquant.
```

---

## 2. Concepts OpenShift abordés

Ce scénario illustre les concepts suivants :

- `Secret`
- configuration sensible
- variable d'environnement
- `Deployment`
- `Pod`
- démarrage de conteneur
- events OpenShift
- diagnostic avec `oc describe pod`
- diagnostic avec `oc get secret`
- différence entre `ConfigMap` et `Secret`

---

## 3. Position dans le fil rouge de formation

Ce scénario correspond principalement aux étapes suivantes du fil rouge :

```text
5. Configurer l'application
10. Dépanner
```

Dans le parcours complet :

```text
Secret
→ Deployment
→ Pod
→ Variable d'environnement sensible
→ Application backend
```

Message clé :

> Une application peut dépendre d'une configuration sensible. Si cette configuration est absente, le Pod peut ne pas démarrer correctement.

---

## 4. Pré-requis

Avant de commencer ce scénario, l'application doit être déployée et fonctionnelle sur OpenShift.

Les ressources suivantes doivent exister :

```bash
oc get deployment coffee-shop-backend
oc get pods -l app=coffee-shop,component=backend
oc get secret coffee-shop-backend-secret
oc get configmap coffee-shop-backend-config
```

Le backend doit être accessible et répondre correctement :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
curl $BACKEND_ROUTE/health
curl $BACKEND_ROUTE/admin/config
```

Dans `/admin/config`, le backend doit indiquer :

```json
{
  "secretConfigured": true
}
```

---

## 5. Vérifier l'état initial

Vérifier que le Secret existe :

```bash
oc get secret coffee-shop-backend-secret
```

Afficher le Secret sans révéler directement sa valeur décodée :

```bash
oc describe secret coffee-shop-backend-secret
```

Résultat attendu :

```text
Name:         coffee-shop-backend-secret
Type:         Opaque
Data
====
SECRET_API_KEY:  <taille en bytes>
```

Vérifier le Deployment backend :

```bash
oc get deployment coffee-shop-backend -o yaml
```

Le Deployment doit référencer le Secret :

```yaml
envFrom:
  - configMapRef:
      name: coffee-shop-backend-config
  - secretRef:
      name: coffee-shop-backend-secret
```

---

## 6. Vérifier côté application

Récupérer la Route backend :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
```

Tester la configuration effective :

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
L'application indique seulement si le Secret est présent.
```

---

## 7. Créer volontairement la panne

Supprimer le Secret backend :

```bash
oc delete secret coffee-shop-backend-secret
```

Le Pod existant peut continuer à fonctionner car les variables d'environnement ont déjà été injectées au démarrage du conteneur.

Pour observer l'impact du Secret manquant, redémarrer le Deployment backend :

```bash
oc rollout restart deployment/coffee-shop-backend
```

Suivre le rollout :

```bash
oc rollout status deployment/coffee-shop-backend
```

Selon le comportement du cluster et du Deployment, le rollout peut se bloquer.

---

## 8. Observer les effets de la panne

Afficher les Pods backend :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Résultats possibles :

```text
Pod en CreateContainerConfigError
Pod bloqué au démarrage
Rollout qui ne se termine pas
Ancien Pod encore présent
Nouveau Pod non disponible
```

Exemple possible :

```text
NAME                                  READY   STATUS                       RESTARTS   AGE
coffee-shop-backend-xxxxxxxxx-yyyyy   0/1     CreateContainerConfigError   0          30s
```

Message pédagogique :

> Si un Pod référence un Secret obligatoire qui n'existe pas, le conteneur ne peut pas être configuré correctement.

---

## 9. Diagnostic avec oc describe pod

Récupérer le nom du Pod en erreur :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Décrire le Pod :

```bash
oc describe pod <pod-name>
```

Chercher dans les Events des messages du type :

```text
Error: secret "coffee-shop-backend-secret" not found
CreateContainerConfigError
```

Message pédagogique :

> `oc describe pod` permet d'identifier les erreurs de configuration qui empêchent le conteneur de démarrer.

---

## 10. Diagnostic avec les Events

Afficher les Events récents :

```bash
oc get events --sort-by=.lastTimestamp
```

Chercher les messages liés au Secret :

```text
secret "coffee-shop-backend-secret" not found
Error creating: pods ...
CreateContainerConfigError
```

Message pédagogique :

> Les Events permettent de comprendre ce qu'OpenShift a tenté de faire et pourquoi cela a échoué.

---

## 11. Vérifier que le Secret est absent

```bash
oc get secret coffee-shop-backend-secret
```

Résultat attendu :

```text
Error from server (NotFound): secrets "coffee-shop-backend-secret" not found
```

Conclusion du diagnostic :

```text
Le Deployment référence un Secret.
Le Secret n'existe plus.
Le nouveau Pod ne peut pas démarrer.
```

---

## 12. Correction

Recréer le Secret à partir du manifest :

```bash
oc apply -f openshift/backend/secret.yaml
```

Vérifier que le Secret existe à nouveau :

```bash
oc get secret coffee-shop-backend-secret
```

Redémarrer le Deployment backend :

```bash
oc rollout restart deployment/coffee-shop-backend
oc rollout status deployment/coffee-shop-backend
```

---

## 13. Vérifier le retour à l'état nominal

Afficher les Pods backend :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
READY   STATUS
1/1     Running
```

Tester le backend :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
curl $BACKEND_ROUTE/health
curl $BACKEND_ROUTE/admin/config
```

Résultat attendu dans `/admin/config` :

```json
{
  "secretConfigured": true
}
```

---

## 14. Variante : Secret présent mais valeur modifiée

Une variante moins bloquante consiste à modifier la valeur du Secret au lieu de le supprimer.

Mettre à jour le Secret :

```bash
oc delete secret coffee-shop-backend-secret

oc create secret generic coffee-shop-backend-secret \
  --from-literal=SECRET_API_KEY=updated-secret-value
```

Redémarrer le backend :

```bash
oc rollout restart deployment/coffee-shop-backend
oc rollout status deployment/coffee-shop-backend
```

Vérifier côté application :

```bash
curl $BACKEND_ROUTE/admin/config
```

Résultat attendu :

```json
{
  "secretConfigured": true
}
```

La valeur exacte du Secret ne doit pas être affichée par l'application.

Message pédagogique :

> Modifier un Secret nécessite généralement de redémarrer les Pods qui utilisent ce Secret en variable d'environnement.

---

## 15. Commandes récapitulatives

```bash
# Vérifier l'état initial
oc get secret coffee-shop-backend-secret
oc describe secret coffee-shop-backend-secret
oc get pods -l app=coffee-shop,component=backend

BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
curl $BACKEND_ROUTE/admin/config

# Créer la panne
oc delete secret coffee-shop-backend-secret
oc rollout restart deployment/coffee-shop-backend
oc rollout status deployment/coffee-shop-backend

# Observer
oc get pods -l app=coffee-shop,component=backend

# Diagnostiquer
oc describe pod <pod-name>
oc get events --sort-by=.lastTimestamp
oc get secret coffee-shop-backend-secret

# Corriger
oc apply -f openshift/backend/secret.yaml
oc rollout restart deployment/coffee-shop-backend
oc rollout status deployment/coffee-shop-backend

# Vérifier le retour nominal
oc get pods -l app=coffee-shop,component=backend
curl $BACKEND_ROUTE/admin/config
```

---

## 16. Ce que l'on doit observer

1. Le Secret est un objet OpenShift distinct du Deployment.
2. Le Deployment peut référencer un Secret.
3. Si le Secret est absent, un nouveau Pod peut ne pas démarrer.
4. `oc get pods` permet de voir un état anormal.
5. `oc describe pod` donne la cause précise.
6. Les Events indiquent souvent le Secret manquant.
7. Recréer le Secret permet de restaurer l'application.
8. Un redémarrage du Deployment peut être nécessaire pour reprendre une nouvelle valeur de Secret.

---

## 17. Méthode de diagnostic à retenir

Pour une panne liée à un Secret, suivre cette méthode :

```text
1. Quel est l'état du Pod ?
2. Le Pod est-il en CreateContainerConfigError ?
3. Que dit oc describe pod ?
4. Le Secret référencé existe-t-il ?
5. Le nom du Secret dans le Deployment est-il correct ?
6. Le Secret contient-il la clé attendue ?
7. Le Pod a-t-il été redémarré après correction ?
```

Commandes associées :

```bash
oc get pods
oc describe pod <pod-name>
oc get secret
oc describe secret coffee-shop-backend-secret
oc get deployment coffee-shop-backend -o yaml
oc get events --sort-by=.lastTimestamp
```

---

## 18. Message clé à retenir

> Un Secret permet de fournir une information sensible à une application. Si le Secret attendu est absent, le Pod peut ne pas démarrer correctement.

Phrase de synthèse :

```text
Le Deployment référence un Secret.
Le Pod a besoin de ce Secret au démarrage.
Si le Secret manque, OpenShift ne peut pas configurer le conteneur.
Le diagnostic passe par get pods, describe pod, get secret et events.
```
