# TP 01 - Découverte de l'environnement OpenShift

## 1. Objectif du TP

Ce premier TP a pour objectif de prendre en main l'environnement OpenShift utilisé pendant la formation.

À la fin de ce TP, vous devez être capable de :

- vous connecter au cluster OpenShift ;
- vérifier votre identité avec la CLI `oc` ;
- identifier votre projet de travail ;
- créer ou sélectionner un Project OpenShift ;
- naviguer dans la console web OpenShift ;
- repérer les principaux menus utiles pour la suite de la formation ;
- comprendre que toutes les ressources de l'application seront créées dans un Project.

Ce TP ne déploie pas encore l'application **OpenShift Coffee Shop**.

Il sert à préparer l'environnement de travail.

---

## 2. Concepts abordés

Ce TP introduit les concepts suivants :

- Cluster OpenShift ;
- Console web OpenShift ;
- CLI `oc` ;
- Project ;
- Namespace ;
- Perspective Developer ;
- Perspective Administrator ;
- Ressources OpenShift ;
- Contexte courant de travail.

---

## 3. Position dans le fil rouge de la formation

Ce TP correspond au début du fil rouge :

```text
Nous allons partir d'un code dans Git
et l'amener progressivement jusqu'à une application accessible sur OpenShift.
```

Avant de construire ou déployer l'application, il faut d'abord savoir :

```text
où nous travaillons
avec quel utilisateur
dans quel Project
et avec quels outils
```

Message clé :

> Avant de déployer une application, il faut savoir où l'on travaille.

---

## 4. Pré-requis

Avant de commencer, vous devez disposer de :

- une URL de console OpenShift ;
- une URL d'API OpenShift ;
- un utilisateur OpenShift ;
- un mot de passe ou un token de connexion ;
- la CLI `oc` installée sur votre poste ;
- un accès réseau au cluster OpenShift.

Vérifier que la commande `oc` est disponible :

```bash
oc version
```

Si la commande n'est pas reconnue, la CLI OpenShift n'est pas installée ou n'est pas disponible dans le `PATH`.

---

## 5. Connexion à OpenShift

Se connecter au cluster avec la commande fournie par le formateur.

Exemple :

```bash
oc login <API_URL_OPENSHIFT>
```

Selon l'environnement, la commande peut demander :

```text
Username
Password
```

ou utiliser un token.

Exemple avec token :

```bash
oc login --token=<TOKEN> --server=<API_URL_OPENSHIFT>
```

---

## 6. Vérifier l'utilisateur connecté

Exécuter :

```bash
oc whoami
```

Résultat attendu :

```text
<votre-utilisateur>
```

Cette commande permet de vérifier l'identité actuellement utilisée par la CLI `oc`.

---

## 7. Vérifier le serveur OpenShift utilisé

Exécuter :

```bash
oc whoami --show-server
```

Résultat attendu :

```text
https://api.<cluster>:6443
```

Cette commande permet de vérifier sur quel cluster OpenShift vous êtes connecté.

---

## 8. Vérifier le projet courant

Exécuter :

```bash
oc project
```

Si aucun projet n'est sélectionné, vous pouvez obtenir un message indiquant qu'aucun Project n'est actif.

Lister les projets disponibles :

```bash
oc get projects
```

Selon vos droits, vous verrez un ou plusieurs projets.

---

## 9. Créer ou sélectionner le projet de travail

Pendant la formation, toutes les ressources seront créées dans un Project dédié.

Nom proposé :

```text
coffee-shop-demo
```

Créer le Project :

```bash
oc new-project coffee-shop-demo
```

Si le Project existe déjà, le sélectionner :

```bash
oc project coffee-shop-demo
```

Vérifier le Project courant :

```bash
oc project
```

Résultat attendu :

```text
Using project "coffee-shop-demo"
```

---

## 10. Comprendre le rôle du Project

Un Project OpenShift est un espace de travail isolé.

Dans cette formation, le Project contiendra progressivement :

```text
BuildConfig
ImageStream
ConfigMap
Secret
Deployment
Pod
Service
Route
```

Message important :

```text
Le cluster est la plateforme.
Le Project est l'espace de travail dans lequel nous allons créer nos ressources.
```

---

## 11. Vérifier que le Project est vide

Exécuter :

```bash
oc get all
```

Au début de la formation, le Project doit être vide ou presque vide.

Résultat possible :

```text
No resources found in coffee-shop-demo namespace.
```

Afficher aussi les ConfigMaps, Secrets et Routes :

```bash
oc get configmap
oc get secret
oc get route
```

Il peut exister quelques ressources système par défaut. Ce n'est pas bloquant.

---

## 12. Accéder à la console web OpenShift

Ouvrir l'URL de la console OpenShift fournie par le formateur dans un navigateur.

Se connecter avec les mêmes identifiants que pour la CLI.

Une fois connecté, vérifier que le Project `coffee-shop-demo` est visible.

---

## 13. Repérer les perspectives OpenShift

Dans la console OpenShift, repérer les deux perspectives principales.

### Perspective Developer

La perspective Developer est orientée application.

Elle permet notamment de visualiser :

- les applications ;
- les composants ;
- la Topology ;
- les builds ;
- les routes ;
- les logs applicatifs.

### Perspective Administrator

La perspective Administrator est plus orientée plateforme.

Elle permet notamment de visualiser :

- les Workloads ;
- les Pods ;
- les Deployments ;
- les Services ;
- les Routes ;
- les Events ;
- les détails techniques des ressources.

Pendant la formation, les deux perspectives pourront être utilisées.

---

## 14. Explorer la vue Topology

Dans la console web :

```text
Developer
→ Topology
```

Au début, la Topology peut être vide.

Ce sera normal.

Au fur et à mesure de la formation, cette vue affichera :

```text
coffee-shop-backend
coffee-shop-frontend
```

avec leurs relations et leur état.

---

## 15. Explorer les menus utiles

Repérer les zones suivantes dans la console.

### Workloads

Permet de voir :

```text
Deployments
Pods
ReplicaSets
```

### Builds

Permet de voir :

```text
BuildConfigs
Builds
ImageStreams
```

### Networking

Permet de voir :

```text
Services
Routes
```

### ConfigMaps and Secrets

Permet de voir :

```text
ConfigMaps
Secrets
```

Ces sections seront utilisées dans les prochains TP.

---

## 16. Vérifier la cohérence CLI / Console

Dans la CLI, afficher le projet courant :

```bash
oc project
```

Dans la console, vérifier que le même Project est sélectionné.

Les deux outils manipulent les mêmes ressources OpenShift.

Message important :

```text
La console web et la CLI oc sont deux façons différentes d'observer et de gérer les mêmes objets OpenShift.
```

---

## 17. Commandes récapitulatives

```bash
# Vérifier la CLI
oc version

# Se connecter
oc login <API_URL_OPENSHIFT>

# Vérifier l'utilisateur
oc whoami

# Vérifier le cluster
oc whoami --show-server

# Lister les projets
oc get projects

# Créer un projet
oc new-project coffee-shop-demo

# Sélectionner un projet
oc project coffee-shop-demo

# Vérifier le projet courant
oc project

# Voir les ressources du projet
oc get all

# Voir quelques types de ressources utiles
oc get pods
oc get deployment
oc get svc
oc get route
oc get configmap
oc get secret
```

---

## 18. Questions de compréhension

Répondre aux questions suivantes.

### Question 1

Quelle commande permet de savoir avec quel utilisateur vous êtes connecté ?

<details>
<summary>Réponse</summary>

```bash
oc whoami
```

</details>

---

### Question 2

Quelle commande permet de savoir dans quel Project vous travaillez ?

<details>
<summary>Réponse</summary>

```bash
oc project
```

</details>

---

### Question 3

Quelle est la différence entre un cluster et un Project ?

<details>
<summary>Réponse</summary>

Le cluster est la plateforme OpenShift complète.

Le Project est un espace de travail isolé dans lequel une équipe ou une application crée ses ressources.

</details>

---

### Question 4

La console web et la CLI `oc` manipulent-elles les mêmes objets ?

<details>
<summary>Réponse</summary>

Oui.

La console web et la CLI `oc` sont deux interfaces différentes pour observer et gérer les mêmes ressources OpenShift.

</details>

---

### Question 5

Dans quel Project allons-nous déployer l'application Coffee Shop ?

<details>
<summary>Réponse</summary>

Dans le Project utilisé pendant la formation, par exemple :

```text
coffee-shop-demo
```

</details>

---

## 19. Résultat attendu du TP

À la fin de ce TP :

- vous êtes connecté au cluster OpenShift ;
- la commande `oc whoami` fonctionne ;
- vous connaissez le Project courant ;
- le Project `coffee-shop-demo` existe ou est sélectionné ;
- vous savez afficher les ressources du Project ;
- vous avez ouvert la console web OpenShift ;
- vous avez repéré les perspectives Developer et Administrator ;
- vous savez où observer les prochains objets créés pendant la formation.

---

## 20. Nettoyage

Aucun nettoyage n'est nécessaire à la fin de ce TP.

Le Project sera utilisé dans les TP suivants.

Ne supprimez pas le Project sauf demande explicite du formateur.

Si vous devez repartir de zéro, la commande suivante supprime tout le Project et toutes ses ressources :

```bash
oc delete project coffee-shop-demo
```

Attention : cette commande supprime toutes les ressources contenues dans le Project.

---

## 21. Message clé à retenir

```text
Avant de déployer une application, il faut savoir où l'on travaille.
```

Phrase de synthèse :

```text
Je me connecte au cluster.
Je vérifie mon utilisateur.
Je choisis mon Project.
J'observe les ressources avec la console et la CLI.
Je suis prêt à déployer l'application.
```

---

## 22. Transition vers le TP suivant

Dans le TP suivant, nous allons découvrir le repository applicatif **OpenShift Coffee Shop**.

Nous identifierons :

```text
le frontend
le backend
les Dockerfiles
les manifests OpenShift
les scénarios pédagogiques
```

Le prochain objectif sera de comprendre ce que nous allons déployer avant de demander à OpenShift de construire les images.
