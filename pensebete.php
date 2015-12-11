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

http://chaudiere/?api=CAPPL:LOCAL.anlage_betriebsart?u=oekofen&p=oekofen

/* v1.6.3 - préparation livraison 1.7 (maj temps reel)
- update autoloader pour prendre en compte les dates
- maj des textes et de la matrice pour import / maj dans la 1.7





        deleted:    js/adapters/standalone-framework.js
        deleted:    js/adapters/standalone-framework.src.js
        deleted:    js/bootstrap-notify.min.js
        deleted:    js/bootstrap.min.js
        deleted:    js/highcharts.min.js
        deleted:    js/jquery-ui.min.js
        deleted:    js/jquery.fileupload.js
        deleted:    js/jquery.min.js
        deleted:    js/modules/canvas-tools.js
        deleted:    js/modules/canvas-tools.src.js
        deleted:    js/modules/data.js
        deleted:    js/modules/data.src.js
        deleted:    js/modules/drilldown.js
        deleted:    js/modules/drilldown.src.js
        deleted:    js/modules/exporting.js
        deleted:    js/modules/exporting.src.js
        deleted:    js/modules/funnel.js
        deleted:    js/modules/funnel.src.js
        deleted:    js/modules/heatmap.js
        deleted:    js/modules/heatmap.src.js
        deleted:    js/modules/no-data-to-display.js
        deleted:    js/modules/no-data-to-display.src.js
        deleted:    js/modules/solid-gauge.js
        deleted:    js/modules/solid-gauge.src.js
        deleted:    js/themes/dark-blue.js
        deleted:    js/themes/dark-green.js
        deleted:    js/themes/dark-unica.js
        deleted:    js/themes/gray.js
        deleted:    js/themes/grid-light.js
        deleted:    js/themes/grid.js
        deleted:    js/themes/sand-signika.js
        deleted:    js/themes/skies.js


d9fe039 et 96ed891 -> commit autoupdate




*/
?>
