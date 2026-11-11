## Configuration AWS Cloud 9

```bash
sudo mysql -uroot
```

Lancer la console Mysql et ajouter un user

```sql
CREATE USER 'test'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'test'@'localhost' WITH GRANT OPTION;
```

## github

```git
git clone https://github.com/stawen/okovision.git
git config --global user.name stawen
git config --global user.email stawen@dronek.com
git fetch origin
git remote add upstream https://github.com/stawen/okovision.git/
```

```git
git config credential.helper store
git push https://github.com/stawen/okovision.git/
```

le module php-mbstring, php-curl, php-xml doit etre activé

import du jeu de test

```sql
mysql -utest -p  -h localhost okovision < /home/ubuntu/environment/_tmp/okovision-jeudedonnee.sql
```

rendre compatbible mysql5.7 avec mariadb 10.3.7

```sql
SET @@SQL_MODE = CONCAT(@@SQL_MODE, ',ONLY_FULL_GROUP_BY,NO_ZERO_IN_DATE,NO_ZERO_DATE');
```

## Cron synology

```bash
wget http://127.0.0.1/okovision/cron.php 1>/dev/null 2>/dev/null;
```

## Statut_chaudiere

- 2 = Ventilations bruleur et fumées à 100%
- 3 = Allumage (T° flamme augmente, T° flamme consigne calée à 120°
- 4 = Alimentation Pellets (les fameux zs d'alim et pause)
- 5 = Fin de combustion, bruleur arrêté / on fini de ventiler
- 7 = Alim trémie effectivement

- 0 - Réamorcage
- 1 - Démarrage
- 2 - Allumage
- 3 - Allumage stab
- 4 - Combustion
- 5 - fin Combustion
- 6 - Arrêt
- 7 - Aspiration
- 8 - Cendre

- compter le nb de cycle : 4
- alimentation pellet dans tremi : 7

## taille des tables de la base

```sql
SELECT table_schema AS NomBaseDeDonnees, ROUND(SUM( data_length + index_length ) / 1024 / 1024, 2) AS BaseDonneesMo FROM information_schema.TABLES GROUP BY TABLE_SCHEMA;
```

```sql
SELECT
 TABLE_NAME,
 CONCAT(ROUND(((DATA_LENGTH + INDEX_LENGTH - DATA_FREE) / 1024 / 1024), 2), 'Mo') AS TailleMo
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'oko_test'
```

## Pense bete Git

- Create the branch on your local machine and switch in this branch :

```git
git checkout -b [name_of_your_new_branch]
```

- Push the branch on github :

```git
git push origin [name_of_your_new_branch]
```

- You can see all branches created by using :

```git
git branch
```

- Delete a branch on your local filesystem :

```git
git branch -d [name_of_your_new_branch]
```

- To force the deletion of local branch on your filesystem :

```git
git branch -D [name_of_your_new_branch]
```

- Delete the branch on github :

```git
git push origin --delete [name_of_your_new_branch]
```

```git
git push origin :[name_of_your_new_branch]
```

- Merge

```git
git merge unstable
```

# Compatibilité Okofen Touch

- V2 - Ok
- Jusqu'au 3.00d ou 3.10d la connexion non sécurisée fonctionne.
- A partir du 4.00 il va falloir trouver une autre méthode (plus accès au log)
