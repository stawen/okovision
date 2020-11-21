# Hebergement gratuit

## Autre hebergeur

Voici une [liste d'hebergement gratuit](https://korben.info/hebergement-web-gratuit-2019.html)


J'ai choisi `Byet.host` un peu par hazard, il repond bien à mes attentes. Okovision fonctionne sans configuration particulière dessus.
Le nom de domaine n'est pas jolie, ce n'est pas très important. Nous verrons dans le temps.

## Byet.host


**1 - Creation du compte**

Rendez vous sur le lien ici https://byet.host/free-hosting/news

**Important:** Le mot de passe que vous choisirez ici sera le meme pour toute la configuration

Pour en creer un (decocher Include Symbole et preciser 12 en longeur ) : https://passwordsgenerator.net/

Remplissez le formulaire suivant :

![ID](/wiki/freehosting/010-id.png)



**2 - Email de validation**

**Attention :** A la validation le site vous previent que le mail de confirmation sera peut etre dans le **SPAM**. Cela a été le cas pour moi

![Warning](/wiki/freehosting/020-warning.png)

![SPAM](/wiki/freehosting/030-spam.png)


**3 - Information de connexion**

Lorsque vous avez cliqué sur le lien de validation, vous disposerez de vos informations de connexion.

**Notez les bien immediatement !** Meme si vous allez recevoir un mail de recap

![Cpanel](/wiki/freehosting/040-informations.png)

Vous pouvez dés à present connaitre le nom de domaine pour acceder à votre installation. Ici : <http://demo-okovision.byethost7.com>

Rendez vous sur le lien du `Control Panel URL`. Par exemple : http://cpanel.byethost8.com/


**4 - Creation de la base de données**

Une fois dans le Control Panel (ou CPANEL), vous devrez creer la base de données qui recevra toutes les données de votre chaudière.

Selectionnner Mysql :

![MySQL](/wiki/freehosting/050-select-mysql.png)

Creation de la base de donnée :

![Create Db](/wiki/freehosting/060-create-db.png)

Le nom de la base sera `bx_xxxxxx51_okovision`


**5 - Installation des fichiers sur l'hebergeur**

Récupérer en local les fichiers de la [derniere version](https://github.com/stawen/okovision/archive/master.zip)

Dezipper le zip

![unzip](/wiki/freehosting/070-unzip.png)

Pour transferer les fichiers, il vous faut [Filezila](https://filezilla-project.org/download.php)

Ouvir Filezila et configurer les parametres de connexion

![FZ create](/wiki/freehosting/080-filezila-create.png)

![FZ create](/wiki/freehosting/090-filezila-conn.png)

Accepter la connexion

![FZ SSL](/wiki/freehosting/100-filezila-ssl.png)

Se placer dans htdocs sur le serveur distant

![FZ HTDOCS](/wiki/freehosting/110-filezila-htdocs.png)

![FZ HTDOCS Inside](/wiki/freehosting/120-filezila-htdocs-inside.png)

Vous aller dans la colonne de droite vous mettre dans le repertoire okovision que vous avez dezippé, et vous les glissez dans la fenêtre de droite

![FZ Drag and drop](/wiki/freehosting/130-dragdrop.png)


**6 - Lancer le setup okovision**

Rendez vous sur votre site, dans mon cas http://demo-okovision.byethost7.com/
La page de setup se lance.

Remplir tout avec les bons identifiants, ceux indiqués lors de votre inscription. Pour le mot de passe, c'est celui que vous avez renseigné lors de l'inscription aussi.

![Oko Setup](/wiki/freehosting/140-oko-setup.png)

Si vous revenez a la racine sur site, la page d'accueil vous dire par une alerte : `Error getIndic`, cela est normal. Il faut initialiser la matrice

**7 - Recuperation automatique des données de la chaudiere**

Vous devez parametrer le CRON

![CPANEL Cron](/wiki/freehosting/150-cron.png)

Cliquez sur `Alter Cron`

![CPANEL Cron](/wiki/freehosting/160-altercron.png)

Mettre toutes les 2 heures (en dessous cela ne sert a rien car la chaudiere met à jours le fichier csv que toutes les 2 heures)
Indiquez le fichier `cron.php`

![CPANEL Cron](/wiki/freehosting/170-cron-conf.png)

Dans l'offre gratuite, le traitement du Cron doit prendre moins de 5 secondes. Ce qui est le cas si tout va bien, il prend entre 2 et 3 sec.


**8 - On fait apprendre la matrice**


On recupere un fichier de la chaudiere, et on l'injecte dans okovision pour qu'il finisse de se configurer.
Pour Continuer, [suivre la procedure complète de configuration](/md/matrix.md)






