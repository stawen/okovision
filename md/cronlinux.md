# Cron sous linux

Lancer l'editer des taches planifiés
Si premier lancement , choisissez Nano comme éditeur.

```bash
crontab -e
```

Inserer en fin de fichier cette ligne

```bash
22      */2     *       *       *       cd /var/www/okovision; /usr/bin/php -f cron.php 
```


Faites `CTRL + X`, Puis confirmer l'enregistrement `Y`