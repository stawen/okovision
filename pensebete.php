<?php
/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/


/*
Statut_chaudiere : 
2 = Ventilations bruleur et fumées à 100%
3 = Allumage (T° flamme augmente, T° flamme consigne calée à 120°
4 = Alimentation Pellets (les fameux zs d'alim et pause)
5 = Fin de combustion, bruleur arrêté / on fini de ventiler
7 = Alim trémie effectivement


0 - Réamorcage
1 - Démarrage
2 - Allumage
3 - Allumage stab
4 - Combustion
5 - fin Combustion
6 - Arrêt
7 - Aspiration
8 - Cendre

compter le nb de cycle : 4
alimentation pellet dans tremi : 7
*/





/*
SELECT table_schema AS NomBaseDeDonnees, ROUND(SUM( data_length + index_length ) / 1024 / 1024, 2) AS BaseDonneesMo FROM information_schema.TABLES GROUP BY TABLE_SCHEMA;
*/



/*

Create the branch on your local machine and switch in this branch :
	$ git checkout -b [name_of_your_new_branch]

Push the branch on github :
	$ git push origin [name_of_your_new_branch]

You can see all branches created by using :
	$ git branch

Delete a branch on your local filesystem :
	$ git branch -d [name_of_your_new_branch]

To force the deletion of local branch on your filesystem :
	$ git branch -D [name_of_your_new_branch]

Delete the branch on github :
	$ git push origin :[name_of_your_new_branch]

Merge
	$ git merge unstable
	
*/

//include_once 'config.php';

/*
http://grafana.org/
https://influxdb.com/

"plotBands" : [
         {
            "to" : 1448755200000,
            "color" : "rgba(68, 170, 213, .2)",
            "from" : 1448582400000,
            "label" : {
               "text" : "EA2016"
            }
         }
         
plotLines: [{
    color: 'red', // Color value
    dashStyle: 'longdashdot', // Style of the plot line. Default to solid
    value: 3, // Value of where the line will appear
    width: 2 // Width of the line    
  }]

*/
?>
