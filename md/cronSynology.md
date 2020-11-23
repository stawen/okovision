# Cron sous Nas synology

Aller dans le **plannificateur de taches**

![](/wiki/nas/Nas-0090-inst.png)

**Creez une nouvelle entrée** avec les informations suivantes (a adapter pour les chemins)

![](/wiki/nas/Nas-0100-inst.png)



![](/wiki/nas/Nas-0110-inst.png)

ou 
```bash
wget http://127.0.0.1/okovision/cron.php 1>/dev/null 2>/dev/null;
```

## Récurrence de l'execution

Note: Vous devez faire executer votre script tous les 2 heures minimum. En dessous cela ne sert à rien

![](/wiki/nas/Nas-0120-inst.png)
