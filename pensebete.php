<?php
phpinfo();
/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/
/*
$ sudo mysql -uroot

Lancer la console Mysql et ajouter un user 
CREATE USER 'test'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'test'@'localhost' WITH GRANT OPTION;



-- github
$ git clone https://github.com/stawen/okovision.git
$ git config --global user.name stawen
$ git config --global user.email stawen@dronek.com
$ git fetch origin
$ git remote add upstream https://github.com/stawen/okovision.git/

$ git config credential.helper store
$ git push https://github.com/stawen/okovision.git/



le module php-mbstring, php-curl, php-xml doit etre activé 

import du jeu de test
$ mysql -utest -p  -h localhost okovision < /home/ubuntu/environment/_tmp/okovision-jeudedonnee.sql

rendre compatbible mysql5.7 avec mariadb 10.3.7 
$ SET @@SQL_MODE = CONCAT(@@SQL_MODE, ',ONLY_FULL_GROUP_BY,NO_ZERO_IN_DATE,NO_ZERO_DATE');

*/

/*
select 
t_mois.mois,
IFNULL(t_data.nbCycle,'-') AS cycle,
IFNULL(t_data.conso,'-') as conso,
IFNULL(t_data.dju,'-') as dju,
IFNULL(t_data.g_dju_m,'-') as gdjum
from
(
	select 
	DATE_FORMAT(oko_dateref.jour,'%Y-%m') as mois
	from 
		oko_dateref,
		oko_saisons
	where 
		oko_saisons.id = 5
	and oko_dateref.jour BETWEEN oko_saisons.date_debut AND oko_saisons.date_fin
	GROUP BY 
		MONTH(oko_dateref.jour)
	ORDER BY mois ASC
	) as t_mois 
left join 
	(
	select 
	DATE_FORMAT(oko_resume_day.jour,'%Y-%m') as mois,
	sum(nb_cycle) as nbCycle,
	sum(conso_kg) as conso, 
	sum(dju) as dju,
	round( ((sum(oko_resume_day.conso_kg) * 1000) / sum(oko_resume_day.dju) / 180),2) as g_dju_m 
	
	FROM
		oko_saisons, oko_resume_day
	WHERE
		oko_saisons.id=5
		AND oko_resume_day.jour BETWEEN oko_saisons.date_debut AND oko_saisons.date_fin 
	GROUP BY 
		MONTH(oko_resume_day.jour)
	ORDER BY mois ASC
	) as t_data 
ON  t_mois.mois = t_data.mois 


*/

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

/*


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


    /**
    * Description short
    *
    * @param string $toto description
    * @param string $toto description
    * @param string $toto description
    */
    
    /*
    code secret ["CAPPL:LOCAL.L_fernwartung_code_1","CAPPL:LOCAL.L_fernwartung_code_2"]
    
    */
    
?>
