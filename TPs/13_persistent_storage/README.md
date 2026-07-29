# TP 13 - Persister les commandes avec un PVC

## 1. Objectif du TP

Ce TP a pour objectif d'introduire le stockage persistant dans OpenShift avec un `PersistentVolumeClaim`.

Jusqu'à présent, l'application **OpenShift Coffee Shop** fonctionne correctement, mais le backend stocke les commandes dans un fichier local au conteneur. Ce comportement est volontairement limité : si le Pod backend est recréé, les données peuvent disparaître.

Dans ce TP, nous allons ajouter un volume persistant au backend afin de conserver les commandes au-delà du cycle de vie du Pod.

À la fin de ce TP, vous devez être capable de :

- comprendre pourquoi le système de fichiers d'un Pod est éphémère ;
- comprendre le rôle d'un `PersistentVolumeClaim` ;
- créer un PVC pour le backend ;
- monter un PVC dans un Pod avec `volumeMounts` et `volumes` ;
- configurer le backend pour écrire dans `/data/orders.json` ;
- vérifier que les commandes sont conservées après redémarrage du backend ;
- comprendre les limites du scaling avec un volume en `ReadWriteOnce` ;
- distinguer une application stateless d'une application stateful.

Ce TP ajoute un module complémentaire au parcours principal. Il ne remplace pas le déploiement initial sans PVC.

Il se concentre sur la phase :

```text
Application sans persistance
→ Création de commandes
→ Redémarrage du Pod
→ Données potentiellement perdues
→ Ajout d'un PVC
→ Montage du volume dans le backend
→ Commandes persistées
→ Redémarrage du Pod
→ Données conservées
```

**Situation du TP :**

```text
Demi-journée 3
Chapitre complémentaire - Persister des données
Après TP 12 - Diagnostiquer une mauvaise configuration frontend/backend
Avant les scénarios de dépannage avancés ou en module optionnel
```

---

## 2. Concepts abordés

Ce TP introduit les concepts suivants :

- stockage éphémère ;
- stockage persistant ;
- `PersistentVolume` ;
- `PersistentVolumeClaim` ;
- `StorageClass` ;
- binding PVC / PV ;
- `volumeMounts` ;
- `volumes` ;
- montage de volume dans un conteneur ;
- application stateful ;
- application stateless ;
- cycle de vie d'un Pod ;
- persistance au-delà du redémarrage d'un Pod.

Les objets principaux manipulés sont :

```text
PersistentVolumeClaim
ConfigMap
Deployment
Pod
```

Le PVC utilisé dans ce TP s'appelle :

```text
coffee-shop-backend-data
```

Le volume est monté dans le backend sur :

```text
/data
```

Le fichier de commandes utilisé par l'application est :

```text
/data/orders.json
```

---

## 3. Position dans le fil rouge

Ce TP se situe après le parcours principal :

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
→ Persistance
```

Le TP 13 correspond à l'étape :

```text
Persister les données d'une application
```

Jusqu'ici, l'application Coffee Shop est essentiellement stateless.

Avec ce TP, nous ajoutons une dimension stateful simple : les commandes sont enregistrées dans un fichier.

Message clé :

```text
Un Pod est éphémère. Si une application doit conserver des données, ces données doivent être placées dans un stockage persistant.
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
- idéalement terminé le TP 10 ;
- idéalement terminé le TP 11 ;
- idéalement terminé le TP 12 ;
- accès à un cluster OpenShift ;
- accès à la CLI `oc` ;
- un Project OpenShift courant ;
- l'application Coffee Shop accessible depuis un navigateur ;
- le backend déployé ;
- le frontend déployé ;
- les endpoints `/api/orders` disponibles côté backend ;
- les manifests de variante storage présents dans le repository.

Vérifier le Project courant :

```bash
oc project
```

Résultat attendu :

```text
Using project "coffee-shop-demo"
```

Vérifier que l'application fonctionne :

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

Vérifier que l'API commandes existe :

```bash
curl $BACKEND_ROUTE/api/orders
```

Résultat attendu :

```json
{
  "count": 0,
  "storagePath": "/tmp/orders.json",
  "items": []
}
```

La valeur exacte de `count` peut être différente si des commandes existent déjà.

---

## 5. Étapes détaillées

### Étape 1 - Comprendre le stockage actuel sans PVC

Avant d'ajouter le PVC, le backend écrit les commandes dans un fichier local au conteneur.

Par défaut, le chemin utilisé est :

```text
/tmp/orders.json
```

Tester la configuration actuelle :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
curl $BACKEND_ROUTE/admin/config
```

Résultat attendu avant ajout du PVC :

```json
{
  "ordersFilePath": "/tmp/orders.json"
}
```

Message pédagogique :

```text
/tmp est dans le système de fichiers du conteneur. Ce stockage n'est pas conçu pour survivre au cycle de vie du Pod.
```

---

### Étape 2 - Créer une commande sans PVC

Créer une commande :

```bash
curl -X POST $BACKEND_ROUTE/api/orders \
  -H "Content-Type: application/json" \
  -d '{"product":"Latte","quantity":2}'
```

Lister les commandes :

```bash
curl $BACKEND_ROUTE/api/orders
```

Résultat attendu :

```text
La commande créée est visible.
Le storagePath indique /tmp/orders.json.
```

---

### Étape 3 - Redémarrer le backend sans PVC

Redémarrer le Deployment backend :

```bash
oc rollout restart deployment/coffee-shop-backend
oc rollout status deployment/coffee-shop-backend
```

Lister les commandes à nouveau :

```bash
curl $BACKEND_ROUTE/api/orders
```

Selon les conditions de redémarrage et le comportement du conteneur, les commandes peuvent disparaître.

Point pédagogique :

```text
Ce comportement illustre que le stockage local d'un conteneur ne doit pas être utilisé comme stockage durable.
```

Si les données sont encore présentes dans votre environnement, expliquer que ce comportement ne doit pas être considéré comme une garantie. Le système de fichiers du conteneur reste lié au cycle de vie du Pod et de son runtime.

---

### Étape 4 - Observer les manifests de la variante storage

Ouvrir le dossier :

```text
openshift/backend/storage/
```

Les fichiers attendus sont :

```text
pvc.yaml
configmap-with-pvc.yaml
deployment-with-pvc.yaml
```

Rôle de chaque fichier :

```text
pvc.yaml                 → demande de stockage persistant
configmap-with-pvc.yaml  → configure ORDERS_FILE_PATH=/data/orders.json
deployment-with-pvc.yaml → monte le PVC dans le Pod backend sur /data
```

---

### Étape 5 - Lire le manifest PVC

Ouvrir le fichier :

```text
openshift/backend/storage/pvc.yaml
```

Exemple de contenu attendu :

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: coffee-shop-backend-data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

Points à identifier :

```text
kind: PersistentVolumeClaim
name: coffee-shop-backend-data
accessModes: ReadWriteOnce
storage: 1Gi
```

Message pédagogique :

```text
Le PVC est une demande de stockage faite par l'application.
```

---

### Étape 6 - Créer le PVC

Appliquer le manifest :

```bash
oc apply -f openshift/backend/storage/pvc.yaml
```

Vérifier le PVC :

```bash
oc get pvc
```

Résultat attendu :

```text
coffee-shop-backend-data   Bound
```

Si le PVC reste en `Pending`, cela signifie généralement que le cluster ne parvient pas à fournir un volume correspondant à la demande.

Afficher le détail :

```bash
oc describe pvc coffee-shop-backend-data
```

---

### Étape 7 - Appliquer la ConfigMap avec PVC

Appliquer la variante de ConfigMap :

```bash
oc apply -f openshift/backend/storage/configmap-with-pvc.yaml
```

Vérifier la valeur :

```bash
oc get configmap coffee-shop-backend-config -o yaml
```

Résultat attendu :

```yaml
ORDERS_FILE_PATH: /data/orders.json
```

Message pédagogique :

```text
La ConfigMap indique maintenant au backend d'écrire les commandes dans /data/orders.json.
```

---

### Étape 8 - Appliquer le Deployment avec PVC

Appliquer la variante de Deployment :

```bash
oc apply -f openshift/backend/storage/deployment-with-pvc.yaml
```

Cette variante ajoute :

```yaml
volumeMounts:
  - name: backend-data
    mountPath: /data
```

et :

```yaml
volumes:
  - name: backend-data
    persistentVolumeClaim:
      claimName: coffee-shop-backend-data
```

Suivre le rollout :

```bash
oc rollout status deployment/coffee-shop-backend
```

Vérifier le Pod backend :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
Pod backend 1/1 Running
```

---

### Étape 9 - Vérifier le montage du volume

Récupérer le nom du Pod backend :

```bash
BACKEND_POD=$(oc get pods -l app=coffee-shop,component=backend -o jsonpath='{.items[0].metadata.name}')
```

Ouvrir un shell dans le Pod :

```bash
oc rsh $BACKEND_POD
```

Lister le dossier `/data` :

```bash
ls -la /data
```

Sortir du Pod :

```bash
exit
```

Résultat attendu :

```text
Le dossier /data existe et est accessible.
```

---

### Étape 10 - Vérifier la configuration applicative après PVC

Tester `/admin/config` :

```bash
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')
curl $BACKEND_ROUTE/admin/config
```

Résultat attendu :

```json
{
  "ordersFilePath": "/data/orders.json"
}
```

Message pédagogique :

```text
Le backend utilise maintenant un chemin monté depuis un PVC.
```

---

### Étape 11 - Créer une commande avec PVC

Créer une commande :

```bash
curl -X POST $BACKEND_ROUTE/api/orders \
  -H "Content-Type: application/json" \
  -d '{"product":"Cappuccino","quantity":3}'
```

Lister les commandes :

```bash
curl $BACKEND_ROUTE/api/orders
```

Résultat attendu :

```text
La commande existe.
Le storagePath indique /data/orders.json.
```

---

### Étape 12 - Redémarrer le backend avec PVC

Redémarrer le backend :

```bash
oc rollout restart deployment/coffee-shop-backend
oc rollout status deployment/coffee-shop-backend
```

Attendre que le Pod soit à nouveau disponible :

```bash
oc get pods -l app=coffee-shop,component=backend
```

Résultat attendu :

```text
Pod backend 1/1 Running
```

---

### Étape 13 - Vérifier que les commandes existent toujours

Lister les commandes :

```bash
curl $BACKEND_ROUTE/api/orders
```

Résultat attendu :

```text
La commande créée avant le redémarrage est toujours présente.
```

Message pédagogique :

```text
Le Pod a été recréé, mais les données sont restées dans le volume persistant.
```

---

### Étape 14 - Vérifier depuis le frontend

Ouvrir la Route frontend dans un navigateur.

Si le frontend a été mis à jour avec la section Commandes, vérifier :

```text
La section Commandes est visible.
Le fichier de stockage indique /data/orders.json.
Les commandes créées sont affichées.
Il est possible de créer une nouvelle commande.
```

Si le frontend n'affiche pas la nouvelle section, reconstruire le frontend :

```bash
oc start-build coffee-shop-frontend --follow
oc rollout restart deployment/coffee-shop-frontend
oc rollout status deployment/coffee-shop-frontend
```

---

### Étape 15 - Revenir à l'état nominal si nécessaire

Pour vider les commandes :

```bash
curl -X DELETE $BACKEND_ROUTE/api/orders
```

Pour garder le backend à 1 replica :

```bash
oc scale deployment/coffee-shop-backend --replicas=1
```

Message pédagogique :

```text
Avec un PVC ReadWriteOnce et un stockage fichier, on garde volontairement un seul replica backend dans ce module.
```

---

## 6. Commandes

Commandes principales du TP :

```bash
# Récupérer la Route backend
BACKEND_ROUTE=$(oc get route coffee-shop-backend -o jsonpath='{"http://"}{.spec.host}')

# Vérifier le stockage actuel
curl $BACKEND_ROUTE/admin/config
curl $BACKEND_ROUTE/api/orders

# Créer une commande avant PVC
curl -X POST $BACKEND_ROUTE/api/orders \
  -H "Content-Type: application/json" \
  -d '{"product":"Latte","quantity":2}'

# Redémarrer le backend sans PVC
oc rollout restart deployment/coffee-shop-backend
oc rollout status deployment/coffee-shop-backend

# Créer le PVC
oc apply -f openshift/backend/storage/pvc.yaml
oc get pvc

# Appliquer la configuration avec PVC
oc apply -f openshift/backend/storage/configmap-with-pvc.yaml

# Appliquer le Deployment avec montage PVC
oc apply -f openshift/backend/storage/deployment-with-pvc.yaml
oc rollout status deployment/coffee-shop-backend

# Vérifier la configuration
curl $BACKEND_ROUTE/admin/config

# Créer une commande avec PVC
curl -X POST $BACKEND_ROUTE/api/orders \
  -H "Content-Type: application/json" \
  -d '{"product":"Cappuccino","quantity":3}'

# Vérifier les commandes
curl $BACKEND_ROUTE/api/orders

# Redémarrer le backend avec PVC
oc rollout restart deployment/coffee-shop-backend
oc rollout status deployment/coffee-shop-backend

# Vérifier que les commandes existent toujours
curl $BACKEND_ROUTE/api/orders
```

Commandes d'observation complémentaires :

```bash
# Décrire le PVC
oc describe pvc coffee-shop-backend-data

# Voir le Pod backend
oc get pods -l app=coffee-shop,component=backend

# Vérifier le montage dans le Pod
BACKEND_POD=$(oc get pods -l app=coffee-shop,component=backend -o jsonpath='{.items[0].metadata.name}')
oc rsh $BACKEND_POD
ls -la /data
exit

# Voir le Deployment en YAML
oc get deployment coffee-shop-backend -o yaml

# Voir les Events récents
oc get events --sort-by=.lastTimestamp
```

---

## 7. Vérifications

### Vérifier le PVC

```bash
oc get pvc
```

Résultat attendu :

```text
coffee-shop-backend-data   Bound
```

Si le statut est :

```text
Pending
```

alors le stockage n'a pas encore été provisionné ou aucune ressource compatible n'est disponible.

---

### Vérifier la ConfigMap avec PVC

```bash
oc get configmap coffee-shop-backend-config -o yaml
```

Résultat attendu :

```yaml
ORDERS_FILE_PATH: /data/orders.json
```

---

### Vérifier le Deployment avec PVC

```bash
oc get deployment coffee-shop-backend -o yaml
```

Vérifier la présence de :

```text
volumeMounts
mountPath: /data
volumes
persistentVolumeClaim
claimName: coffee-shop-backend-data
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

### Vérifier la configuration de l'application

```bash
curl $BACKEND_ROUTE/admin/config
```

Résultat attendu :

```text
ordersFilePath vaut /data/orders.json
```

---

### Vérifier la persistance

Créer une commande :

```bash
curl -X POST $BACKEND_ROUTE/api/orders \
  -H "Content-Type: application/json" \
  -d '{"product":"Mocha","quantity":1}'
```

Lister les commandes :

```bash
curl $BACKEND_ROUTE/api/orders
```

Redémarrer le backend :

```bash
oc rollout restart deployment/coffee-shop-backend
oc rollout status deployment/coffee-shop-backend
```

Lister à nouveau :

```bash
curl $BACKEND_ROUTE/api/orders
```

Résultat attendu :

```text
La commande est toujours présente après redémarrage.
```

---

### Erreurs fréquentes à vérifier

#### PVC en Pending

Commandes utiles :

```bash
oc get pvc
oc describe pvc coffee-shop-backend-data
oc get storageclass
```

Causes possibles :

```text
Aucune StorageClass par défaut
Provisionnement dynamique indisponible
Quota de stockage insuffisant
Mode d'accès non supporté
```

---

#### Pod en erreur après ajout du PVC

Commandes utiles :

```bash
oc get pods
oc describe pod <pod-name>
oc get events --sort-by=.lastTimestamp
```

Causes possibles :

```text
PVC absent
PVC non Bound
Nom du claim incorrect dans le Deployment
Problème de montage du volume
```

---

#### ordersFilePath reste à /tmp/orders.json

Vérifier la ConfigMap :

```bash
oc get configmap coffee-shop-backend-config -o yaml
```

Vérifier que le Pod a été redémarré :

```bash
oc rollout restart deployment/coffee-shop-backend
oc rollout status deployment/coffee-shop-backend
```

---

#### Les commandes disparaissent encore après redémarrage

Vérifier :

```bash
curl $BACKEND_ROUTE/admin/config
oc get deployment coffee-shop-backend -o yaml
oc get pvc
```

Contrôler :

```text
ordersFilePath = /data/orders.json
volumeMounts contient /data
PVC coffee-shop-backend-data est Bound
```

---

## 8. Questions de compréhension

### Question 1

Pourquoi le stockage local d'un conteneur n'est-il pas suffisant pour conserver des données durablement ?

<details>
<summary>Réponse</summary>

Parce que le système de fichiers du conteneur est lié au cycle de vie du Pod. Si le Pod est supprimé ou recréé, les données locales peuvent disparaître.

</details>

---

### Question 2

Quel objet OpenShift permet à une application de demander du stockage persistant ?

<details>
<summary>Réponse</summary>

```text
PersistentVolumeClaim
```

ou :

```text
PVC
```

</details>

---

### Question 3

Quel est le rôle de `volumeMounts` dans un Deployment ?

<details>
<summary>Réponse</summary>

`volumeMounts` indique où monter un volume dans le conteneur.

Dans ce TP, le PVC est monté dans le backend sur :

```text
/data
```

</details>

---

### Question 4

Quel fichier le backend utilise-t-il pour stocker les commandes avec PVC ?

<details>
<summary>Réponse</summary>

```text
/data/orders.json
```

</details>

---

### Question 5

Pourquoi garde-t-on le backend à 1 replica dans ce TP ?

<details>
<summary>Réponse</summary>

Parce que le PVC utilise `ReadWriteOnce` et que l'application écrit dans un fichier local. Plusieurs Pods écrivant dans le même fichier peuvent poser des problèmes selon le stockage et l'architecture.

</details>

---

## 9. Résultat attendu

À la fin de ce TP :

- le PVC `coffee-shop-backend-data` existe ;
- le PVC est en statut `Bound` ;
- la ConfigMap backend contient `ORDERS_FILE_PATH=/data/orders.json` ;
- le Deployment backend monte le PVC dans `/data` ;
- le backend utilise `/data/orders.json` pour stocker les commandes ;
- une commande créée avant un redémarrage du Pod existe encore après redémarrage ;
- les participants comprennent pourquoi un PVC est nécessaire pour persister des données.

Vérification rapide :

```bash
oc get pvc
oc get deployment coffee-shop-backend -o yaml
curl $BACKEND_ROUTE/admin/config
curl $BACKEND_ROUTE/api/orders
```

Résultat attendu :

```text
PVC Bound
mountPath /data présent
ordersFilePath /data/orders.json
commandes conservées après redémarrage
```

---

## 10. Nettoyage

Pour vider les commandes sans supprimer le PVC :

```bash
curl -X DELETE $BACKEND_ROUTE/api/orders
```

Pour revenir à un backend à 1 replica :

```bash
oc scale deployment/coffee-shop-backend --replicas=1
```

Ne supprimez pas le PVC si vous souhaitez conserver les données :

```text
coffee-shop-backend-data
```

Si le formateur demande de supprimer la variante storage :

```bash
oc delete -f openshift/backend/storage/deployment-with-pvc.yaml
oc delete -f openshift/backend/storage/configmap-with-pvc.yaml
oc delete -f openshift/backend/storage/pvc.yaml
```

Attention : supprimer le PVC peut supprimer ou rendre inaccessible les données selon la politique de récupération du volume sous-jacent.

Pour revenir au déploiement backend sans PVC :

```bash
oc apply -f openshift/backend/configmap.yaml
oc apply -f openshift/backend/deployment.yaml
oc rollout status deployment/coffee-shop-backend
```

---

## 11. Message clé

```text
Un Pod est éphémère. Un PVC permet de conserver les données au-delà du cycle de vie du Pod.
```

Phrase de synthèse :

```text
Sans PVC, les commandes sont écrites dans le système de fichiers du conteneur.
Avec un PVC, les commandes sont écrites dans un volume persistant monté dans /data.
Le Pod peut être recréé, mais les données restent disponibles.
```

---

## 12. Transition vers le TP suivant

Ce TP ajoute une notion importante : la persistance.

Nous avons vu que toutes les applications ne sont pas équivalentes du point de vue OpenShift :

```text
Application stateless → facile à scaler
Application avec état → nécessite une réflexion sur le stockage
```

Après ce TP, vous pouvez poursuivre avec des scénarios de dépannage plus avancés, par exemple :

```text
PVC absent
PVC en Pending
mauvais claimName dans le Deployment
volume non monté
application qui écrit dans le mauvais chemin
```

Le prochain objectif possible sera donc :

```text
Diagnostiquer une panne liée au stockage persistant.
```
