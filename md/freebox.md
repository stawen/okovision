# Avec FreeBox de FREE

Dans un premier temps, il faut faire la demande d’un adresse ip fixe. 
Si vous êtes en zone dégrouper, c’est déjà le cas, sinon il faut suffit de vous rendre sur le portail free. 

Attention: Vous pouvez rester parfois jusqu’a 24h sans connexion internet après le reboot de la freebox

Important: Le plus sage est de faire la demande puis d’attendre 24 heures avant le reboot.


![](/wiki/freebox/freebox-0010.png)


Information: Pensez à bien noter l’ip qui vous sera attribuée. Elle vous servira pour la configuration d’okovision.


Puis il faut faire un redirection des ports

```txt
port interne : 80 ou 8080 <ceci est le port d'ecoute de votre chaudière>
port externe : 80 ou 8080 <comme vous voulez>
protocole : TCP
```

![](/wiki/freebox/freebox-0020.png)


------------------

# Next Step

Dans [Configuration Générale](/md/infoGenerale.md), vous pouvez maintenant indiquer l'ip de votre chaudière avec les informations fournis ci-dessus ( `ip:port_externe` )
  