# Installation sous Linux

Note: Okovision est compatible PHP5 et PHP7

Si vous avez un `rpi` ou un `serveur linux` chez vous, je pense sans me tromper que vous savez très bien installer Apache + Mariadb (ou Mysql) + PHP.
Je suis aussi sur que vous savez configurer un site sous apache.

Je vous met le detail pour une configuration type. Cette exemple est pour un raspberry qui ne sera dédié qu'a okovision


Passer en root

```bash
su -
```
Installation des prerequis

```bash
apt-get update
apt-get -y install apache2 php7 php-mysql php-curl php-mbstring php-curl php-xml mysql-server php-zip
```

Installation des sources okovision

```bash
cd /var/www/
wget https://github.com/stawen/okovision/archive/master.zip
unzip master.zip
mv okovision-master/ okovision/
rm master.zip
chown www-data:www-data -R okovision/
```

Configuration apache

```bash
cp /var/www/okovision/install/099-okovision.conf /etc/apache2/sites-available/.
a2ensite 099-okovision.conf
a2dissite 000-default
service apache2 reload
```

Aller sur l'adresse ip du serveur linux et faites le setup okovision

-------------------

Next: Configuration de la [crontab](/md/cronlinux.md)