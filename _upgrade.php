<?php

ini_set('max_execution_time', 600);

$newTableHistorique = "CREATE TABLE IF NOT EXISTS `oko_historique_full` (`jour` DATE NOT NULL,`heure` TIME NOT NULL,`col_2` DECIMAL(6,2) NULL DEFAULT NULL,`col_3` DECIMAL(6,2) NULL DEFAULT NULL,`col_4` DECIMAL(6,2) NULL DEFAULT NULL,`col_5` DECIMAL(6,2) NULL DEFAULT NULL,`col_6` DECIMAL(6,2) NULL DEFAULT NULL,`col_7` DECIMAL(6,2) NULL DEFAULT NULL,`col_8` DECIMAL(6,2) NULL DEFAULT NULL,`col_9` DECIMAL(6,2) NULL DEFAULT NULL,`col_10` DECIMAL(6,2) NULL DEFAULT NULL,`col_11` DECIMAL(6,2) NULL DEFAULT NULL,`col_12` DECIMAL(6,2) NULL DEFAULT NULL,`col_13` DECIMAL(6,2) NULL DEFAULT NULL,`col_14` DECIMAL(6,2) NULL DEFAULT NULL,`col_15` DECIMAL(6,2) NULL DEFAULT NULL,`col_16` DECIMAL(6,2) NULL DEFAULT NULL,`col_17` DECIMAL(6,2) NULL DEFAULT NULL,`col_18` DECIMAL(6,2) NULL DEFAULT NULL,`col_19` DECIMAL(6,2) NULL DEFAULT NULL,`col_20` DECIMAL(6,2) NULL DEFAULT NULL,`col_21` DECIMAL(6,2) NULL DEFAULT NULL,`col_22` DECIMAL(6,2) NULL DEFAULT NULL,`col_23` DECIMAL(6,2) NULL DEFAULT NULL,`col_24` DECIMAL(6,2) NULL DEFAULT NULL,`col_25` DECIMAL(6,2) NULL DEFAULT NULL,`col_26` DECIMAL(6,2) NULL DEFAULT NULL,`col_27` DECIMAL(6,2) NULL DEFAULT NULL,`col_28` DECIMAL(6,2) NULL DEFAULT NULL,`col_29` DECIMAL(6,2) NULL DEFAULT NULL,`col_30` DECIMAL(6,2) NULL DEFAULT NULL,`col_31` DECIMAL(6,2) NULL DEFAULT NULL,`col_32` DECIMAL(6,2) NULL DEFAULT NULL,`col_33` DECIMAL(6,2) NULL DEFAULT NULL,`col_34` DECIMAL(6,2) NULL DEFAULT NULL,`col_35` DECIMAL(6,2) NULL DEFAULT NULL,`col_36` DECIMAL(6,2) NULL DEFAULT NULL,`col_37` DECIMAL(6,2) NULL DEFAULT NULL,`col_38` DECIMAL(6,2) NULL DEFAULT NULL,`col_39` DECIMAL(6,2) NULL DEFAULT NULL,`col_40` DECIMAL(6,2) NULL DEFAULT NULL,`col_41` DECIMAL(6,2) NULL DEFAULT NULL,`col_42` DECIMAL(6,2) NULL DEFAULT NULL,`col_43` DECIMAL(6,2) NULL DEFAULT NULL,`col_44` DECIMAL(6,2) NULL DEFAULT NULL,`col_45` DECIMAL(6,2) NULL DEFAULT NULL,`col_46` DECIMAL(6,2) NULL DEFAULT NULL,`col_47` DECIMAL(6,2) NULL DEFAULT NULL,`col_48` DECIMAL(6,2) NULL DEFAULT NULL,`col_49` DECIMAL(6,2) NULL DEFAULT NULL,`col_50` DECIMAL(6,2) NULL DEFAULT NULL,`col_51` DECIMAL(6,2) NULL DEFAULT NULL,`col_52` DECIMAL(6,2) NULL DEFAULT NULL,`col_53` DECIMAL(6,2) NULL DEFAULT NULL,`col_54` DECIMAL(6,2) NULL DEFAULT NULL,`col_55` DECIMAL(6,2) NULL DEFAULT NULL,`col_56` DECIMAL(6,2) NULL DEFAULT NULL,`col_57` DECIMAL(6,2) NULL DEFAULT NULL,`col_58` DECIMAL(6,2) NULL DEFAULT NULL,`col_59` DECIMAL(6,2) NULL DEFAULT NULL,`col_60` DECIMAL(6,2) NULL DEFAULT NULL,`col_61` DECIMAL(6,2) NULL DEFAULT NULL,`col_62` DECIMAL(6,2) NULL DEFAULT NULL,`col_63` DECIMAL(6,2) NULL DEFAULT NULL,`col_64` DECIMAL(6,2) NULL DEFAULT NULL,`col_65` DECIMAL(6,2) NULL DEFAULT NULL,`col_66` DECIMAL(6,2) NULL DEFAULT NULL,`col_67` DECIMAL(6,2) NULL DEFAULT NULL,`col_68` DECIMAL(6,2) NULL DEFAULT NULL,`col_69` DECIMAL(6,2) NULL DEFAULT NULL,`col_70` DECIMAL(6,2) NULL DEFAULT NULL,`col_71` DECIMAL(6,2) NULL DEFAULT NULL,`col_72` DECIMAL(6,2) NULL DEFAULT NULL,`col_73` DECIMAL(6,2) NULL DEFAULT NULL,`col_74` DECIMAL(6,2) NULL DEFAULT NULL,`col_75` DECIMAL(6,2) NULL DEFAULT NULL,`col_76` DECIMAL(6,2) NULL DEFAULT NULL,`col_77` DECIMAL(6,2) NULL DEFAULT NULL,`col_78` DECIMAL(6,2) NULL DEFAULT NULL,`col_79` DECIMAL(6,2) NULL DEFAULT NULL,`col_80` DECIMAL(6,2) NULL DEFAULT NULL,`col_81` DECIMAL(6,2) NULL DEFAULT NULL,`col_82` DECIMAL(6,2) NULL DEFAULT NULL,`col_83` DECIMAL(6,2) NULL DEFAULT NULL,`col_84` DECIMAL(6,2) NULL DEFAULT NULL,`col_85` DECIMAL(6,2) NULL DEFAULT NULL,`col_86` DECIMAL(6,2) NULL DEFAULT NULL,`col_87` DECIMAL(6,2) NULL DEFAULT NULL,`col_88` DECIMAL(6,2) NULL DEFAULT NULL,`col_89` DECIMAL(6,2) NULL DEFAULT NULL,`col_90` DECIMAL(6,2) NULL DEFAULT NULL,`col_91` DECIMAL(6,2) NULL DEFAULT NULL,`col_92` DECIMAL(6,2) NULL DEFAULT NULL,`col_93` DECIMAL(6,2) NULL DEFAULT NULL,`col_94` DECIMAL(6,2) NULL DEFAULT NULL,`col_95` DECIMAL(6,2) NULL DEFAULT NULL,`col_96` DECIMAL(6,2) NULL DEFAULT NULL,`col_97` DECIMAL(6,2) NULL DEFAULT NULL,`col_98` DECIMAL(6,2) NULL DEFAULT NULL,`col_99` DECIMAL(6,2) NULL DEFAULT NULL,PRIMARY KEY (`jour`, `heure`)) ENGINE=InnoDB DEFAULT CHARSET=utf8;";

//$this->log->debug("_UPGRADE | Create oko_historique_full");

if($this->db->query($newTableHistorique)){
    //on attaque la migration des données
    //insert into oko_historique_full set jour = '2015-09-26',  col_2 = 10;
    //on recupere la matrice des capteurs
    $ob_capteur 	= new capteur();
	$capteurs 		= $ob_capteur->getForImportCsv(); //l'index du tableau correspond a la colonne du capteur dans le fichier csv
		//$capteurStatus 	= $ob_capteur->getByType('status');
		//$startCycle 	= $ob_capteur->getByType('startCycle');
	//il nous faut connaitre le nombre de capteur sans startCycle qui est forcement 99
	//$nbCapteurs = count($capteurs) - 1;
	//print_r($capteurs);
    //selection par jour distinct
    
    $qJour = "select distinct(jour) from oko_historique group by jour limit 1,10";
    $resJour = $this->db->query($qJour);
    
    while($rJour = $resJour->fetch_object()){
        $insert = "INSERT IGNORE INTO oko_historique_full set jour = '".$rJour->jour."'";
        
        //puis apres le jour, les minutes present pour le jour en cours
        $qHeure = "select distinct(heure) from oko_historique where jour = '".$rJour->jour."' group by heure";
        $resHeure = $this->db->query($qHeure);
        
        while($rHeure = $resHeure->fetch_object()){
            //$rHeure->heure
            $insert .= ", heure = '".$rHeure->heure."'";
            //puis pour chaque minutes on recupere pour chaque capteur
            foreach($capteurs as $positionCsv => $capteur){
                
                $qCapteur = "select value from oko_historique where jour ='".$rJour->jour."' AND heure ='".$rHeure->heure."' AND oko_capteur_id=".$capteur['id'];
                $this->log->debug("_UPGRADE | ".$qCapteur);
                $resCapteur = $this->db->query($qCapteur);
                $rCapteur = $resCapteur->fetch_object();

                $value = $rCapteur->value;  
                if ($rCapteur->value == null){
                    $value   = 'null';
                }
                $insert .= ", col_".$positionCsv."=".$value ; 
                
            }
           
            if(! $this->db->query($insert)){
				$this->log->debug("_UPGRADE | Error | ".$insert);
				continue;	
			} 
           

        }
        
    }
    
   
    
    echo "OK";
}


?>