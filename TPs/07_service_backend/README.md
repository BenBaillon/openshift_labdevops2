# TP 07 - Créer le Service backend

## 1. Objectif du TP

Ce TP a pour objectif de créer un `Service` OpenShift pour le backend de l'application **OpenShift Coffee Shop**.

Dans les TP précédents, nous avons :

```text
construit l'image backend
déployé le backend avec un Deployment
créé un Pod backend
configuré le backend avec une ConfigMap et un Secret
```

Le backend tourne maintenant dans un Pod, mais ce Pod n'est pas un point d'accès stable.

Dans ce TP, nous allons créer un Service afin de fournir un point d'accès stable vers le backend.

À la fin de ce TP, vous devez être capable de :

- comprendre le rôle d'un `Service` ;
- comprendre pourquoi on ne doit pas cibler directement l'adresse IP d'un Pod ;
- créer le Service backend ;
- comprendre le lien entre labels, selectors et Pods ;
- vérifier les endpoints du Service ;
- comprendre que le Service fournit une adresse stable vers des Pods qui peuvent changer.

Ce TP ne crée pas encore de Route externe.

Il se concentre sur la phase :

```text
Pod backend
→ Service backend
→ Point d'accès stable interne
```

**Situation du TP :**

```text
Demi-journée 2
Chapitre 10 - Permettre aux composants de communiquer
Après TP 06 - Configurer le backend avec ConfigMap et Secret
Avant TP 08 - Exposer le backend avec une Route
```

---

## 2. Concepts abordés

Ce TP introduit les concepts suivants :

- `Service` ;
- `ClusterIP` ;
- labels ;
- selectors ;
- endpoints ;
- port ;
- targetPort ;
- communication interne ;
- stabilité d'accès ;
- découverte de service.

Dans ce TP, l'objet principal est :

```text
Service
```

Le Service backend s'appelle :

```text
coffee-shop-backend
```

Il permet de cibler les Pods backend portant les labels :

```text
app=coffee-shop
component=backend
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
→ Service
→ Route
→ Utilisateur
```

Le TP 07 correspond précisément à cette étape :

```text
Pod
→ Service
```

Dans le TP précédent, le backend tournait déjà dans un Pod.

Dans ce TP, nous ajoutons un point d'accès stable devant ce Pod.

Message clé :

```text
Un Pod peut disparaître ou changer d'adresse IP.
Un Service fournit un point d'accès stable vers les Pods.
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
- accès à un cluster OpenShift ;
- accès à la CLI `oc` ;
- un Project OpenShift courant ;
- un Deployment backend existant ;
- un Pod backend en état `Running` et `Ready` ;
- la ConfigMap et le Secret backend créés.

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

### Étape 1 - Comprendre pourquoi un Service est nécessaire

Un Pod possède une adresse IP interne.

Mais cette adresse n'est pas stable :

```text
si le Pod redémarre
si le Pod est recréé
si le Deployment crée un nouveau Pod
```

l'adresse IP du Pod peut changer.

Il ne faut donc pas construire une application en s'appuyant directement sur l'adresse IP d'un Pod.

Le Service fournit un point d'accès stable.

Message pédagogique :

```text
Le Pod est temporaire.
Le Service est stable.
```

---

### Étape 2 - Observer les labels du Pod backend

Afficher les Pods backend avec leurs labels :

```bash
oc get pods -l app=coffee-shop,component=backend --show-labels
```

Résultat attendu :

```text
Le Pod backend possède les labels app=coffee-shop et component=backend.
```

Exemple :

```text
NAME                                  READY   STATUS    LABELS
coffee-shop-backend-xxxxxxxxx-yyyyy   1/1     Running   app=coffee-shop,component=backend,pod-template-hash=xxxxxxxxx
```

Ces labels seront utilisés par le Service pour trouver les Pods backend.

---

### Étape 3 - Observer le manifest Service backend

Ouvrir le fichier :

```text
openshift/backend/service.yaml
```

Exemple de contenu attendu :

```yaml
apiVersion: v1
kind: Service
metadata:
  name: coffee-shop-backend
  labels:
    app: coffee-shop
    component: backend
spec:
  type: ClusterIP
  selector:
    app: coffee-shop
    component: backend
  ports:
    - name: http
      port: 8080
      targetPort: 8080
      protocol: TCP
```

Points à identifier :

```text
kind: Service
name: coffee-shop-backend
type: ClusterIP
selector: app=coffee-shop, component=backend
port: 8080
targetPort: 8080
```

---

### Étape 4 - Comprendre le selector du Service

Repérer la section :

```yaml
selector:
  app: coffee-shop
  component: backend
```

Ce selector indique que le Service doit cibler les Pods qui portent les labels :

```text
app=coffee-shop
component=backend
```

Le Service ne cible pas un Pod par son nom.

Le Service cible un ensemble de Pods grâce aux labels.

Message pédagogique :

```text
Un Service ne connaît pas les Pods par leur nom.
Un Service sélectionne les Pods grâce aux labels.
```

---

### Étape 5 - Comprendre port et targetPort

Dans le manifest, repérer :

```yaml
ports:
  - name: http
    port: 8080
    targetPort: 8080
```

Signification :

```text
port       : port exposé par le Service
targetPort : port du conteneur ciblé dans le Pod
```

Dans notre cas, les deux valent `8080` parce que le backend écoute sur le port `8080`.

---

### Étape 6 - Créer le Service backend

Appliquer le manifest :

```bash
oc apply -f openshift/backend/service.yaml
```

OpenShift crée alors un Service backend de type `ClusterIP`.

Ce Service est accessible à l'intérieur du Project OpenShift.

---

### Étape 7 - Vérifier la création du Service

Afficher les Services :

```bash
oc get svc
```

ou :

```bash
oc get service
```

Résultat attendu :

```text
coffee-shop-backend
```

Afficher le Service backend :

```bash
oc get svc coffee-shop-backend
```

Résultat attendu :

```text
NAME                  TYPE        CLUSTER-IP      PORT(S)
coffee-shop-backend   ClusterIP   <cluster-ip>    8080/TCP
```

---

### Étape 8 - Observer les endpoints du Service

Décrire le Service :

```bash
oc describe svc coffee-shop-backend
```

Chercher les lignes suivantes :

```text
Selector:  app=coffee-shop,component=backend
Endpoints: <IP_DU_POD>:8080
```

La ligne `Endpoints` est très importante.

Elle indique vers quels Pods le Service envoie le trafic.

Résultat attendu :

```text
Le Service possède au moins un endpoint.
```

Message pédagogique :

```text
Si un Service a des endpoints, il a trouvé des Pods correspondant à son selector.
```

---

### Étape 9 - Comparer labels et selector

Afficher les labels des Pods backend :

```bash
oc get pods -l app=coffee-shop,component=backend --show-labels
```

Afficher le Service :

```bash
oc describe svc coffee-shop-backend
```

Comparer :

```text
Pod labels       : app=coffee-shop, component=backend
Service selector : app=coffee-shop, component=backend
```

Conclusion :

```text
Les labels du Pod correspondent au selector du Service.
Le Service peut donc router le trafic vers le Pod backend.
```

---

### Étape 10 - Comprendre la portée du Service

Le Service créé est de type :

```text
ClusterIP
```

Cela signifie qu'il est accessible à l'intérieur du cluster, mais pas directement depuis l'extérieur.

À ce stade :

```text
Le backend est joignable à l'intérieur du cluster.
Le backend n'est pas encore accessible depuis un navigateur externe.
```

L'accès externe sera traité dans le TP suivant avec une Route.

---

## 6. Commandes

Commandes principales du TP :

```bash
# Vérifier le projet courant
oc project

# Vérifier le Pod backend
oc get pods -l app=coffee-shop,component=backend

# Afficher les labels des Pods backend
oc get pods -l app=coffee-shop,component=backend --show-labels

# Créer le Service backend
oc apply -f openshift/backend/service.yaml

# Afficher les Services
oc get svc

# Afficher le Service backend
oc get svc coffee-shop-backend

# Décrire le Service backend
oc describe svc coffee-shop-backend
```

Commandes d'observation complémentaires :

```bash
# Afficher le Service au format YAML
oc get svc coffee-shop-backend -o yaml

# Afficher tous les Pods avec labels
oc get pods --show-labels

# Afficher les endpoints, si la ressource Endpoints est disponible
oc get endpoints coffee-shop-backend

# Afficher les Events récents
oc get events --sort-by=.lastTimestamp
```

---

## 7. Vérifications

### Vérifier que le Service existe

```bash
oc get svc coffee-shop-backend
```

Résultat attendu :

```text
coffee-shop-backend   ClusterIP   <cluster-ip>   8080/TCP
```

---

### Vérifier le selector du Service

```bash
oc describe svc coffee-shop-backend
```

Résultat attendu :

```text
Selector: app=coffee-shop,component=backend
```

---

### Vérifier les endpoints du Service

```bash
oc describe svc coffee-shop-backend
```

Résultat attendu :

```text
Endpoints: <IP_DU_POD>:8080
```

Si la ligne affiche :

```text
Endpoints: <none>
```

cela signifie que le Service ne trouve aucun Pod.

Dans ce cas, vérifier les labels des Pods :

```bash
oc get pods --show-labels
```

---

### Vérifier les labels des Pods

```bash
oc get pods -l app=coffee-shop,component=backend --show-labels
```

Résultat attendu :

```text
app=coffee-shop
component=backend
```

Ces labels doivent correspondre au selector du Service.

---

### Vérifier dans la console OpenShift

Dans la console web OpenShift, vérifier :

```text
Networking
→ Services
→ coffee-shop-backend
```

Observer :

```text
le port du Service
le selector
les Pods ou endpoints associés
```

À ce stade, aucune Route externe n'a encore été créée dans ce TP.

---

### Erreurs fréquentes à vérifier

#### Service absent

Symptôme possible :

```text
services "coffee-shop-backend" not found
```

Correction :

```bash
oc apply -f openshift/backend/service.yaml
```

---

#### Service sans endpoints

Symptôme :

```text
Endpoints: <none>
```

Causes possibles :

```text
selector incorrect
labels des Pods différents
Pod backend non Ready ou absent
```

Commandes utiles :

```bash
oc describe svc coffee-shop-backend
oc get pods --show-labels
oc get pods -l app=coffee-shop,component=backend
```

---

#### Mauvais port

Symptôme possible :

```text
Le Service existe mais ne permet pas d'atteindre l'application.
```

À vérifier :

```bash
oc get svc coffee-shop-backend -o yaml
```

Contrôler :

```text
port: 8080
targetPort: 8080
```

---

## 8. Questions de compréhension

### Question 1

Pourquoi ne faut-il pas utiliser directement l'adresse IP d'un Pod ?

<details>
<summary>Réponse</summary>

Parce qu'un Pod peut être supprimé, recréé ou redémarré. Son adresse IP peut changer.

</details>

---

### Question 2

Quel objet OpenShift fournit un point d'accès stable vers des Pods ?

<details>
<summary>Réponse</summary>

```text
Service
```

</details>

---

### Question 3

Comment un Service trouve-t-il les Pods vers lesquels envoyer le trafic ?

<details>
<summary>Réponse</summary>

Grâce à son selector, qui doit correspondre aux labels des Pods.

</details>

---

### Question 4

Que signifie `Endpoints: <none>` sur un Service ?

<details>
<summary>Réponse</summary>

Cela signifie que le Service ne trouve aucun Pod correspondant à son selector.

</details>

---

### Question 5

Le backend est-il accessible depuis un navigateur externe à la fin de ce TP ?

<details>
<summary>Réponse</summary>

Non.

À ce stade, le backend est accessible via un Service interne, mais aucune Route externe n'a encore été créée.

</details>

---

## 9. Résultat attendu

À la fin de ce TP :

- le Service `coffee-shop-backend` existe ;
- le Service est de type `ClusterIP` ;
- le Service cible les Pods backend avec le selector `app=coffee-shop,component=backend` ;
- le Service possède au moins un endpoint ;
- les endpoints pointent vers le Pod backend sur le port `8080` ;
- le backend n'est pas encore exposé à l'extérieur du cluster.

Vérification rapide :

```bash
oc get svc coffee-shop-backend
oc describe svc coffee-shop-backend
oc get pods -l app=coffee-shop,component=backend --show-labels
```

Résultat attendu :

```text
Service coffee-shop-backend présent
Selector correct
Endpoints présents
Pod backend Running
```

---

## 10. Nettoyage

Aucun nettoyage n'est nécessaire à la fin de ce TP.

Le Service backend sera utilisé dans le TP suivant pour créer une Route.

Ne supprimez pas :

```text
Service coffee-shop-backend
Deployment coffee-shop-backend
Pod backend
```

Si le formateur demande de supprimer uniquement le Service backend :

```bash
oc delete -f openshift/backend/service.yaml
```

Attention : supprimer le Service ne supprime pas le Pod backend, mais rend le backend plus difficile à joindre.

---

## 11. Message clé

```text
Un Pod peut changer.
Un Service reste stable.
```

Phrase de synthèse :

```text
Le backend tourne dans un Pod.
Le Pod possède des labels.
Le Service possède un selector.
Si le selector correspond aux labels, le Service trouve le Pod.
Le Service fournit alors un point d'accès stable vers le backend.
```

---

## 12. Transition vers le TP suivant

Dans ce TP, nous avons créé un Service backend.

Le backend dispose maintenant d'un point d'accès stable à l'intérieur du cluster.

Mais il n'est pas encore accessible depuis un navigateur externe.

Dans le TP suivant, nous allons créer une Route backend.

Nous passerons de :

```text
Service backend
→ Route backend
→ Accès externe
```

Le prochain objectif sera donc :

```text
Exposer le backend à l'extérieur du cluster OpenShift.
```
