<?php
/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/

include_once '/volume1/web/okovision/config.php';

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
			
?>