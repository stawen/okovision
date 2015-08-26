<?php
/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/

include_once 'config.php';
/*
function init_calendar(){
			
			// specify connection info
			
			$connect = mysql_connect(BDD_IP,BDD_USER,BDD_PASS);
			if (!$connect){
				echo 'makeSynteseByDay | Connection MySQL impossible : ' . mysql_error();
			}
			
			$cid = mysql_select_db(BDD_SCHEMA,$connect);
			
			$start_day = mktime(0, 0, 0, 9  , 1, 2014); //1er septembre 2014
			$stop_day = mktime(0, 0, 0, 9  , 1, 2037); //justqu'au 1er septembre 2037, on verra en 2037 si j'utilise encore l'app.
			
			echo date('Y-m-d',$start_day );
			echo '<br/>';
			echo date('Y-m-d',$stop_day );
			echo '<br/>';
			$nb_day = ($stop_day - $start_day)/86400;
			
			echo 'Nb jour a creer : '.$nb_day.'<br/>';
			
			for ($i = 0; $i<= $nb_day; $i++){
				$day = date('Y-m-d' ,mktime(0, 0, 0, date("m",$start_day)  , date("d",$start_day)+$i, date("Y",$start_day)) );
				$query = "INSERT INTO oko_dateref (jour) VALUES ('".$day."');";
				// echo $query.'<br/>';
				//$this->log->debug("makeSynteseByDay | ".$query);
				
				$n=mysql_query($query, $connect );
			}
			mysql_close($connect); // closing connection
			echo 'Init fini !';
}

function histo_statut(){
		$connect = mysql_connect(BDD_IP,BDD_USER,BDD_PASS);
		if (!$connect){
			echo 'histo_statut | Connection MySQL impossible : ' . mysql_error();
		}
		
		$cid = mysql_select_db(BDD_SCHEMA,$connect);
		
		$qinit = "select jour,heure, Statut_chaudiere from oko_histo_full where Statut_chaudiere <> 99";
		
		$result =  mysql_query($qinit,$connect);
		$old_statut = "0";
		
		while($r = mysql_fetch_row($result)) {
			//echo $r[2]."<br/>";
			if ($r[2]=="3" && $r[2] <> $old_statut){
				
				$qupdate = "UPDATE oko_histo_full set Debut_cycle=1 where jour = '".$r[0]."' and heure = '".$r[1]."'";
				//echo $qupdate."<br/>";
				$n=mysql_query($qupdate, $connect );
			}
			$old_statut = $r[2];
		}
		
		mysql_free_result($result);
		
		
		mysql_close($connect); // closing connection
		echo 'histo_statut fini !';
}			
*/	


			
/* Requette pense bete
mettre a jour que le dju

UPDATE oko_resume_day 
INNER JOIN (
SELECT 
	jour, 
	IF( 20 <= (MAX(Tc_exterieur) + MIN(Tc_exterieur))/2, 0, round(20 - (MAX(Tc_exterieur) + MIN(Tc_exterieur))/2,2)) as dju
FROM oko_histo_full  group by jour
) as tmp
ON oko_resume_day.jour = tmp.jour
set oko_resume_day.dju = tmp.dju


// pour faire un resume day pour un jour precis 
insert ignore into oko_resume_day
select 
	jour, 
	max(Tc_exterieur), 
	min(Tc_exterieur),
	round(sum( ((60 / (vis_alimentation_tps + vis_alimentation_tps_pause)) * vis_alimentation_tps)) * 0.002,2) as conso_kg,
	IF( 20 <= (MAX(Tc_exterieur) + MIN(Tc_exterieur))/2, 0, round(20 - (MAX(Tc_exterieur) + MIN(Tc_exterieur))/2,2)) as dju,
	sum(Debut_cycle) as nb_cycle
from oko_histo_full where oko_histo_full.jour = '2015-07-07' group by oko_histo_full.jour


*/
/*
Statut_chaudiere : 
2 = Ventilations bruleur et fumées à 100%
3 = Allumage (T° flamme augmente, T° flamme consigne calée à 120°
4 = Alimentation Pellets (les fameux zs d'alim et pause)
5 = Fin de combustion, bruleur arrêté / on fini de ventiler
7 = Alim trémie effectivement

compter le nb de cycle : 3
alimentation pellet dans tremi : 7
*/

/*
$query .= "INSERT IGNORE INTO oko_histo_full VALUES (".
							"STR_TO_DATE('".$d[0]."','%d.%m.%Y'),'". //date
							$d[1]."',". 				// heure
							$this->cvtDec($d[2]).",". 	// T°C exterieur
							$this->cvtDec($d[3]).",". 	// T°C Chaudiere
							$this->cvtDec($d[4]).",". 	// T°C Chaudiere Consigne
							((int)$d[5])*100 .",". 		// Contact Bruleur
							$this->cvtDec($d[6]).",". 	// T°C Départ
							$this->cvtDec($d[7]).",". 	// T°C Départ Consigne
							$this->cvtDec($d[8]).",". 	// T°C Ambiante
							$this->cvtDec($d[9]).",". 	// T°C Ambiante Consigne
							((int)$d[10])*100 .",". 	// Circulateur Chauffage
							$this->cvtDec($d[11]).",". 	// T°C ECS
							$this->cvtDec($d[13]).",". 	// T°C ECS Consigne
							((int)$d[14])*100 .",". 	// Ciruclateur ECS
							$this->cvtDec($d[16]).",". 	// T°C panneau solaire
							$this->cvtDec($d[17]).",". 	// T°C Ballon Bas
							$this->cvtDec($d[18]).",". 	// Pompe Solaire
							$this->cvtDec($d[21]).",". 	// T°C Flamme
							$this->cvtDec($d[22]).",". 	// T°C Flamme Consigne
							$this->cvtDec($d[23]).",". 	// Vis Alimentation temps (ex: 50zs = 5sec)
							$this->cvtDec($d[24]).",". 	// Vis Alimentation Temps pause
							$this->cvtDec($d[25]).",". 	// Ventilation Bruleur
							$this->cvtDec($d[26]).",". 	// Ventilation fumée
							$this->cvtDec($d[27]).",". 	// Dépression
							$this->cvtDec($d[28]).",". 	// Depression Consigne
							$this->cvtDec($d[29]).",". 	// Statut Chaudiere
							((int)$d[30])*100 .",". 	// Moteur alimentation chaudiere
							((int)$d[31])*100 .",". 	// Moteur extraxtion silo
							((int)$d[32])*100 .",". 	// Moteur tremie intermediaire
							((int)$d[33])*100 .",". 	// Moteur ASPIRATION
							((int)$d[34])*100 .",". 	// Moteur Allumage
							$d[35].",". 				// Pompe du circuit primaire
							((int)$d[39])*100 .",".		// Moteur ramonage
							//Enregistrement de 1 si nous commençons un cycle d'allumage
							//Statut 3 = allumage
							$start_cycle.
							");\n";
	*/



/*
use vierbergenlars\SemVer\version;
use vierbergenlars\SemVer\expression;
use vierbergenlars\SemVer\SemVerException;
*/

/*
// Check if a version is valid
$semver = new version('1.2.3');
//$semver = new version('a.b.c'); //SemVerException thrown

//Get a clean version string
$semver = new version('=v1.2.3');
echo $semver->getVersion(); //'1.2.3'

//Check if a version satisfies a range
$semver = new version('1.2.3');
echo "a:". $semver->satisfies(new expression('1.x || >=2.5.0 || 5.0.0 - 7.2.3')); //true
# OR
$range = new expression('1.x || >=2.5.0 || 5.0.0 - 7.2.3');
echo "b:".$range->satisfiedBy(new version('1.2.3')); //true

//Compare two versions
var_dump( "c:".version::gt('1.2.3', '9.8.7') ); //false
echo "d:".version::lt('1.2.3', '9.8.7'); //true
*/


$update = new AutoUpdate();
$update->setCurrentVersion('0.0.1');
//$update->setUpdateUrl('http://okovision.dronek.com/'); //Replace with your server update directory
// Optional:
//$update->addLogHandler(new Monolog\Handler\StreamHandler(__DIR__ . '/update.log'));
//$update->setCache(new Desarrolla2\Cache\Adapter\File(__DIR__ . '/cache'), 3600);

//Check for a new update
if ($update->checkUpdate() === false)
	die('Could not check for updates! See log file for details.');
if ($update->newVersionAvailable()) {
	//Install new update
	echo 'New Version: ' . $update->getLatestVersion() . '<br>';
	echo 'Installing Updates: <br>';
	echo '<pre>';
	/*
	var_dump(array_map(function($version) {
		return (string) $version;
	}, $update->getVersionsToUpdate()));
	*/
	print_r($update->getVersionsInformationToUpdate() );
	echo '</pre>';
	/*
	$result = $update->update();
	if ($result === true) {
		echo 'Update successful<br>';
	} else {
		echo 'Update failed: ' . $result . '!<br>';
		if ($result = AutoUpdate::ERROR_SIMULATE) {
			echo '<pre>';
			var_dump($update->getSimulationResults());
			echo '</pre>';
		}
	}
	*/
	
} else {
	echo 'Current Version is up to date<br>';
}
//echo 'Log:<br>';
//echo nl2br(file_get_contents(__DIR__ . '/update.log'));
?>

<ul>
	<li>Création d'un mecanisme de mise à jour automatique</li>
	<li>Correction logger methode</li>
	<li>Correction anomalie de téléchargement des fichiers depuis la chaudiere</li>
	<li>Correction Execution via CRON</li>
</ul>

<ul>
	<li>Synthse saison dynamique pour les mois</li>
	<li>Import d'un csv via interface http chaudiere</li>
	<li>Page de synthese</li>
	<li>Ecran de Declenchement synthese journaliere pour les jours n'existant pas</li>
	<li>Page de creation graphique + indicateur dedans</li>
</ul>

<ul>
	<li>Creation page des saisons</li>
	<li>Import manuel du fichier csv distant</li>
	<li>Ecran de matrice de correspondance csv pour import des données</li>
	<li>Traduction des colonnes dans le CSV et identification du patern de nommage du constructeur</li>
	<li>Revision de la structure des données</li>
	<li>Ecran d'installation</li>
	<li>Ecran de parametrage</li>
	<li>Creation d'un fichier de configuration</li>
</ul>