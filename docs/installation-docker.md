# Installation Docker

Installez OkoVision avec Docker en choisissant **une seule** des deux options :
une base MariaDB sur la même machine, ou une base MySQL/MariaDB déjà existante.

> La migration d'OkoVision est en cours. Les installations Docker et la bascule
> depuis PHP ne sont pas encore validées en production. Testez d'abord sur un
> environnement isolé ; ne modifiez pas une installation PHP en service.

## Prérequis

- [Docker et Docker Compose](https://docs.docker.com/compose/install/).
- Une machine qui reste allumée si vous souhaitez une collecte régulière.
- Une image OkoVision publiée : le tag `v2.0.0-rc.1` ci-dessous est un
  **exemple**, à remplacer par un tag réellement disponible dans les
  [releases](https://github.com/stawen/okovision/releases). Pour une release
  stable, le tag `latest` n'est publié que si cette option est cochée dans le
  workflow de release. Si l'image est privée, connectez-vous à GHCR avec
  `docker login ghcr.io`.

## Option 1 : OkoVision avec une base de données persistante

1. Créez un dossier pour OkoVision et, dans ce dossier, un fichier
   `docker-compose.yml` contenant :

   ```yaml
   services:
     okovision:
       image: ghcr.io/stawen/okovision:v2.0.0-rc.1
       restart: unless-stopped
       environment:
         ORIGIN: "http://localhost:3000"
         DB_ADRESSE: "database:3306"
         DB_NAME: "okovision"
         DB_USER: "okovision"
         DB_PASSWORD: "mot-de-passe-a-remplacer"
         DB_TLS_MODE: "disabled"
       ports:
         - "127.0.0.1:3000:3000"
       depends_on:
         database:
           condition: service_healthy
       read_only: true
       tmpfs:
         - /tmp

     database:
       image: mariadb:11.4
       restart: unless-stopped
       environment:
         MARIADB_DATABASE: "okovision"
         MARIADB_USER: "okovision"
         MARIADB_PASSWORD: "mot-de-passe-a-remplacer"
         MARIADB_ROOT_PASSWORD: "mot-de-passe-root-a-remplacer"
       volumes:
         - okovision-db:/var/lib/mysql
       healthcheck:
         test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
         interval: 10s
         timeout: 5s
         retries: 5
         start_period: 30s

   volumes:
     okovision-db:
   ```

2. Remplacez le tag de l'image par un tag publié. Choisissez un mot de passe
   de base de données et remplacez `mot-de-passe-a-remplacer` **aux deux
   endroits**. Choisissez un autre mot de passe pour
   `mot-de-passe-root-a-remplacer`. Le caractère `$` dans un mot de passe doit
   être écrit `$$` dans le fichier Compose.
3. Protégez ce fichier, qui contient les mots de passe, et l'accès à Docker :

   ```sh
   chmod 600 docker-compose.yml
   ```

4. Depuis ce dossier, démarrez les conteneurs :

   ```sh
   docker compose up -d
   ```

La base créée est vide : aucun historique n'est importé. Le volume
`okovision-db` conserve les données après l'arrêt ou la recréation des
conteneurs. **Ne lancez pas `docker compose down -v`** : cette commande
supprime aussi le volume. Prévoyez des sauvegardes et vérifiez leur restauration
sur un environnement isolé. Modifier les mots de passe dans le fichier ne
change pas les comptes d'une base déjà initialisée.

## Option 2 : OkoVision avec une base de données distante

1. Créez un dossier pour OkoVision et, dans ce dossier, un fichier
   `docker-compose.yml` contenant :

   ```yaml
   services:
     okovision:
       image: ghcr.io/stawen/okovision:v2.0.0-rc.1
       restart: unless-stopped
       environment:
         ORIGIN: "http://localhost:3000"
         DB_ADRESSE: "adresse-de-la-base:3306"
         DB_NAME: "okovision"
         DB_USER: "utilisateur-a-remplacer"
         DB_PASSWORD: "mot-de-passe-a-remplacer"
         DB_TLS_MODE: "verify"
       ports:
         - "127.0.0.1:3000:3000"
       read_only: true
       tmpfs:
         - /tmp
   ```

2. Remplacez le tag de l'image par un tag publié et renseignez l'adresse, le
   nom de la base, l'utilisateur et son mot de passe. Le caractère `$` dans
   un mot de passe doit être écrit `$$` dans le fichier Compose.
   `localhost` désigne le conteneur, pas le serveur de base de données.
3. Protégez ce fichier, qui contient le mot de passe, et l'accès à Docker :

   ```sh
   chmod 600 docker-compose.yml
   ```

4. Depuis ce dossier, démarrez le conteneur :

   ```sh
   docker compose up -d
   ```

La connexion utilise TLS avec vérification par défaut. Si une autorité de
certification privée est nécessaire, montez son fichier dans le conteneur et
indiquez son chemin dans `DB_TLS_CA_FILE`. Ne désactivez TLS que si le serveur
ne le permet pas et si le réseau est de confiance.

Le compte doit disposer des droits nécessaires aux opérations envisagées : un
compte en lecture seule ne permet ni le setup ni les écritures. Avant toute
migration ou utilisation du setup sur une base existante, réalisez une
sauvegarde vérifiée et des essais sur une copie isolée. Une réinstallation
confirmée sur une base partielle peut supprimer et recréer des tables. La
collecte peut aussi démarrer avec une configuration existante : effectuez les
essais sur une copie isolée, sans accès à une chaudière réelle.

## Utilisation

Ouvrez <http://localhost:3000> sur la machine qui héberge Docker. Pour accéder à
l'application depuis une autre machine, utilisez un reverse proxy HTTPS et
remplacez `ORIGIN` par l'URL utilisée dans le navigateur. Ne publiez pas
directement l'application sur Internet.

Sur une base neuve, ouvrez `/setup` pour créer les tables et le compte
administrateur. Réservez ce parcours à l'administrateur. La collecte peut
démarrer après validation : vérifiez les paramètres de la chaudière avant de
confirmer. Le démarrage et le contrôle de santé HTTP ne garantissent pas la
connexion à la base ou à la chaudière.

Pour consulter les journaux :

```sh
docker compose logs -f okovision
```

## Mise à jour

Après sauvegarde vérifiée et essais sur une copie isolée, remplacez le tag de
l'image dans `docker-compose.yml` par celui de la version choisie, puis lancez :

```sh
docker compose pull
docker compose up -d
```

Consultez les notes de version et le
[guide d'exploitation](./installation-et-exploitation.md) avant toute mise à
jour. Les migrations ne sont pas appliquées automatiquement au démarrage.
