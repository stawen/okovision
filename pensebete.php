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

SELECT 
 TABLE_NAME,
 CONCAT(ROUND(((DATA_LENGTH + INDEX_LENGTH - DATA_FREE) / 1024 / 1024), 2), 'Mo') AS TailleMo 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'oko_test'
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
  
  
  options.series.push({
            type: 'flags',
            name: 'Cloud',
            color: '#333333',
            shape: 'squarepin',
            y: -80,
            data: [
                { x: Date.UTC(2014, 4, 1), text: 'Highcharts Cloud Beta', title: 'Cloud', shape: 'squarepin' }
            ],
            showInLegend: false
        }, {
            type: 'flags',
            name: 'Highmaps',
            color: '#333333',
            shape: 'squarepin',
            y: -55,
            data: [
                { x: Date.UTC(2014, 5, 13), text: 'Highmaps version 1.0 released', title: 'Maps' }
            ],
            showInLegend: false
        }, {
            type: 'flags',
            name: 'Highcharts',
            color: '#333333',
            shape: 'circlepin',
            data: [
                { x: Date.UTC(2009, 10, 27), text: 'Highcharts version 1.0 released', title: '1.0' },
                { x: Date.UTC(2010, 6, 13), text: 'Ported from canvas to SVG rendering', title: '2.0' },
                { x: Date.UTC(2010, 10, 23), text: 'Dynamically resize and scale to text labels', title: '2.1' },
                { x: Date.UTC(2011, 9, 18), text: 'Highstock version 1.0 released', title: 'Stock', shape: 'squarepin' },
                { x: Date.UTC(2012, 7, 24), text: 'Gauges, polar charts and range series', title: '2.3' },
                { x: Date.UTC(2013, 2, 22), text: 'Multitouch support, more series types', title: '3.0' },
                { x: Date.UTC(2014, 3, 22), text: '3D charts, heatmaps', title: '4.0' }
            ],
            showInLegend: false
        }, 
  
  
  
  [{"status":"OK","name":"CAPPL:LOCAL.hk[0].heizkurve_fusspunkt","value":"350"}]

*/
?>
