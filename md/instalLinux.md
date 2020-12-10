# Installation sous Linux

Note: Okovision est compatible PHP5 et PHP7

Si vous avez un `rpi` ou un `serveur linux` chez vous, je pense sans me tromper que vous savez très bien installer Apache + Mariadb (ou Mysql) + PHP.
Je suis aussi sur que vous savez configurer un site sous apache.

Je vous met le detail pour une configuration type. Cette exemple est pour un raspberry qui ne sera dédié qu'a okovision


## Installation Base de donnée

```bash
sudo apt-get -y install mariadb-server
```

## Configuration Base de donnée

Creation de l'utilisateur `okouser` avec le password `okopass`

```bash
sudo mysql -e "CREATE USER 'okouser'@'localhost' IDENTIFIED BY 'okopass';"
sudo mysql -e "GRANT ALL PRIVILEGES ON *.* TO 'okouser'@'localhost' ;"
```

## Installation Apache

```bash
sudo apt-get -y install apache2
systemctl enable apache2
```

## Installation PHP

```bash
sudo apt-get -y install software-properties-common python-software-properties
sudo add-apt-repository -y ppa:ondrej/php
sudo apt-get update
sudo apt-get -y install php7.2 php7.2-cli php7.2-common
sudo apt-get -y install php7.2-curl php7.2-gd php7.2-json php7.2-mbstring php7.2-intl php7.2-mysql php7.2-xml php7.2-zip
```

# Installation des sources Okovision

```bash
cd /var/www/
wget https://github.com/stawen/okovision/archive/master.zip
unzip master.zip
mv okovision-master/ okovision/
rm master.zip
chown www-data:www-data -R okovision/
```

## Configuration apache

```bash
cp /var/www/okovision/install/099-okovision.conf /etc/apache2/sites-available/.
a2ensite 099-okovision.conf
a2dissite 000-default
service apache2 reload
```

## Configuration okovision

Aller sur l'adresse ip du serveur linux / rpi et faites le setup okovision

-------------------

Next: Configuration de la [crontab](/md/cronlinux.md)