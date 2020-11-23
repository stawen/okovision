# Avec Livebox orange

Important: Ceci est vrai pour les Chaudiere Oekofen avec Firmware V2 et V3.

## Créer un nom de domaine dynamique avec No-ip

Votre livebox (si vous n'avez pas une livebox pro) change d'adresse ip régulièrement. Cela n'est pas pratique. Alors orange à implémenté dans leur box un plugin permettant d'utiliser le service DynDns.

Tout d'abord, allez sur le site [https://www.noip.com/sign-up](https://www.noip.com/sign-up) , créez un compte. Si vous vous appelez `DUPOND`, vous pouvez demander un nom de domaine dynamique du style `dupond.ddns.net`.

Dans le wiki, je le nommerai `dupond.ddns.net` et choisissez l'offre gratuite (free sign-up)

Une fois le compte validé et créé, il vous faut paramétrer la livebox

## Configurer la livebox pour le service no-ip

Loggez-vous sur votre livebox http://livebox.home/

Aller dans le menu `Configuration avancée`

![](/wiki/livebox/forward-0010.png)

puis "DynDNS"

![](/wiki/livebox/forward-0020.png)

* Saisissez le nom du domaine que vous avez choisi (ici `dupond.ddns.net`) 
* Sélectionnez le serice `no-ip`
* Renseignez votre email et mot de passe que vous avez défini lors de l'inscription sur `noip.com`

## Repérer l'adresse IP sur votre chaudiere

Voir la doc okofen. Je vous conseille de choisir l'option IP statique et pas DHCP sur la chaudière. En effet, dans le cas d'un coupure de courant, la chaudière redémarre + vite que la livebox et donc la livebox ne peut pas lui répondre pour lui donner un IP. Il est donc plus simple de fixer l'ip.

Noter l'adresse ip de votre chaudière, c'est du style : 192.168.xxx.xxx

ici le chaudière est PC30 (je le sais car j'ai été voir l'ip directement sur la chaudière)

![](/wiki/livebox/forward-0030.png)


## Mise sur internet de votre chaudière (Forwarding de port)

Votre nom de domaine `dupond.ddns.net` pointe sur votre livebox, donc sur rien. Pour rendre accessible votre chaudière à partir de l'adresse `dupond.ddns.net`, vous devez indiquez à la livebox de rediriger les flux (venant de l'exterieur) du port 80 de la livebox vers votre chaudière sur le port 80

Attention: Vous pouvez choisir de mettre n'importe quel port (supérieur à 1024) de la livevox vers le 80, **mais en fonction de l'hebergeur que vous avez choisi, il est possible que vous soyez contraint de faire 80 -> 80 ou 8080 -> 80**

Allez sur NAT/PAT

![](/wiki/livebox/forward-0040.png)

choisissez le service `web server http`

```txt
port interne: 80
port externe: 80 ou 8080
protocole: TCP
appareil: soit il est dans la liste, soit vous saisissez son adresse IP
```

et vous enregistrez.

![](/wiki/livebox/forward-0050.png)
![](/wiki/livebox/forward-0060.png)

si tout va bien, il doit apparaître dans la liste des services

![](/wiki/livebox/forward-0070.png)

## Tester le bon fonctionnement

Depuis chez vous (votre connexion internet) vous ne pourrez pas tester ce qui vient d'être mis en place. Par contre, si vous avez un téléphone portable en 3g ou 4g, vous pouvez faire le test.
En allant à l'adresse ddns que vous avez choisi (dans notre exemple dupond.ddns.net) vous devriez voir la page de login de la chaudière.

![](/wiki/livebox/forward-0080.png)

Note: Si tout est OK, dans `Okovision`, vous indiquez dans `Informations générales` que l'adresse ip est `dupond.ddns.net` (ceci est un exemple bien évidement)