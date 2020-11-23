# API - Interface de communication

Okovision dispose d'une API. 

Cela vous permet d'agir sur Okovision au travers de cette api sans passer par son interface graphique.
Cela vous permet aussi d'agir sur votre directement sur chaudiere via cette api.

## Fonctionnement

Important: Les appels sont des GET, et l'api retourne du Json

Important: Vous devez fournir dans votre GET votre TOKEN-API (visible dans la page "A propos")

Exemple de Requette  :
```bash
curl http://okovision/api.php?token=sdjknrjkfndvjb&type=admin&action=getFileFromChaudiere
```
Reponse :

```json
{
  "response": true,
  "listefiles": [
    {
      "file": "touch_20160108.csv",
      "url": "http://boiler/logfiles/pelletronic/touch_20160108.csv"
    },
    {
      "file": "touch_20160109.csv",
      "url": "http://boiler/logfiles/pelletronic/touch_20160109.csv"
    },
    {
      "file": "touch_20160110.csv",
      "url": "http://boiler/logfiles/pelletronic/touch_20160110.csv"
    },
    {
      "file": "touch_20160111.csv",
      "url": "http://boiler/logfiles/pelletronic/touch_20160111.csv"
    }
  ]
}
```


Exemple Requette  :
```bash
curl http://okovision/api.php?token=sdjknrjkfndvjb&type=rt&action=setBoilerMode&way=1&mode=2
```

Reponse :

```json
[
  {
    "status": "OK",
    "name": "CAPPL:LOCAL.hk[0].betriebsart[1]",
    "value": "2"
  }
]
```

Exmple Requette  :
```bash
curl http://okovision/api.php?token=sdjknrjkfndvjb&type=rendu&action=getIndicByDay&day=2015-12-22
```

Reponse :
```json
{
  "consoPellet": 22.25,
  "tcExtMax": 12.8,
  "tcExtMin": 7.3
}
```


## Lecture de la documentation

Par exemple `setBoilerMode`

```txt
* rt :
  * setBoilerMode (permet de forcer le mode d'un circuit)
      * way : 0 / 1 / 2 / etc (numero du circuit)
      * mode : 0 - arret / 1 - Auto / 2 - Confort / 3 - Reduit
```

il faut ecrire :

```txt
* type=rt
* action=setBoilerMode
* way=1 (si vous avez un seul circuit de chauffage, 1 sera toujours la valeur, si vous plusieur circuit, Aller dans l'interface web d'okofen, le numero du circuit de chauffage est precisé
* mode=2 (ici force le mode Confort)
```

Important: Ne pas oublier de mettre le token, sinon la commande sera rejecté

```txt
* token=sdjknrjkfndvjb  (mettre celui present dans la page "A propos" de votre okovision)
```

Le resultat
```bash
curl http://okovision/api.php?TOKEN=sdjknrjkfndvjb&TYPE=rt&ACTION=setBoilerMode&WAY=1&MODE=2
```

## Liste des services disponibles


```
* admin : 
   * getFileFromChaudiere
   * getHeaderFromOkoCsv
   * getSaisons
   * checkUpdate
   * getVersion
   
* graphique :
   * getCapteurs
   * getGrapheAsso :
      * id : fournir l'id du graphique (rendu.getGraphe)
      
* rendu :
   * getGraphe
   * getGrapheData :
      * id : id du graphique (rendu.getGraphe)
      * day : jour voulu, format YYYY-MM-DD
      
   *  getIndicByDay :
      * day : jour voulu, format YYYY-MM-DD
      
* rt :
   * getBoilerMode (permet de connaitre le mode de fonctionnement d'un circuit de chauffage -> Arret / Reduit / Confort / Auto) :
      * way : 0 / 1 / 2 / etc (numero du circuit)
      
   * setBoilerMode (permet de forcer le mode d'un circuit)
      * way : 0 / 1 / 2 / etc (numero du circuit)
      * mode : 0 - arret / 1 - Auto / 2 - Confort / 3 - Reduit
  ```   


