<?php
/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/

/*

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

compter le nb de cycle : 4
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



// 72 capteurs dans fr/matrice.json => faire 99 colonnes par defaut + 2 = 101
/*
CREATE TABLE IF NOT EXISTS `oko_historique_full` (
	`jour` DATE NOT NULL,
	`heure` TIME NOT NULL,
	`col_2` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_3` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_4` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_5` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_6` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_7` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_8` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_9` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_10` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_11` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_12` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_13` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_14` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_15` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_16` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_17` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_18` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_19` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_20` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_21` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_22` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_23` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_24` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_25` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_26` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_27` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_28` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_29` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_30` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_31` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_32` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_33` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_34` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_35` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_36` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_37` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_38` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_39` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_40` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_41` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_42` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_43` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_44` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_45` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_46` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_47` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_48` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_49` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_50` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_51` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_52` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_53` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_54` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_55` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_56` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_57` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_58` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_59` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_60` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_61` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_62` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_63` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_64` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_65` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_66` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_67` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_68` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_69` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_70` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_71` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_72` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_73` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_74` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_75` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_76` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_77` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_78` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_79` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_80` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_81` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_82` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_83` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_84` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_85` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_86` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_87` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_88` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_89` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_90` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_91` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_92` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_93` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_94` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_95` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_96` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_97` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_98` DECIMAL(6,2) NULL DEFAULT NULL,
	`col_99` DECIMAL(6,2) NULL DEFAULT NULL,
	PRIMARY KEY (`jour`, `heure`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

SELECT table_schema AS NomBaseDeDonnees, ROUND(SUM( data_length + index_length ) / 1024 / 1024, 2) AS BaseDonneesMo FROM information_schema.TABLES GROUP BY TABLE_SCHEMA;
*/
?>
