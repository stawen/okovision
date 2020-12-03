<?php
/*
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
*/

    include_once 'config.php';
    include_once '_templates/header.php';
    include_once '_templates/menu.php';

?>   

    <div class="container" role="main">

	
		<div class="page-header row">
		 	<div class="col-md-12" >
		 		<div id="silo_status_alert" class="alert alert-warning" role="warning" style="display: none;"></div>
		 	</div>	
		 	<div class="col-md-12" id="silo_status">
				<span class="glyphicon glyphicon-fire"></span> <?php echo session::getInstance()->getLabel('lang.text.page.label.stock'); ?>
				<div class="progress">
					<div id="silo_progress_bar" class="progress-bar progress-bar-info" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>
				</div>
			</div>
			
			<div class="col-md-9" >
				<span class="glyphicon glyphicon-hand-right"></span> <?php echo session::getInstance()->getLabel('lang.text.page.label.conso'); ?> <span id="consoPellet" class="label label-primary">00,00 Kg</span> &nbsp;&nbsp;
				<?php echo session::getInstance()->getLabel('lang.text.page.label.conso.ecs'); ?> <span id="consoEcsPellet" class="label label-primary">00,00 Kg</span> &nbsp;&nbsp;
				<span class="glyphicon glyphicon-arrow-up"></span> <?php echo session::getInstance()->getLabel('lang.text.page.label.tcmax'); ?> <span id="tcmax" class="label label-success">00,0 °C</span> &nbsp;&nbsp;
				<span class="glyphicon glyphicon-arrow-right"></span> <?php echo session::getInstance()->getLabel('lang.text.page.label.tcmoy'); ?> <span id="tcmoy" class="label label-info">00,0 °C</span> &nbsp;&nbsp;
				<span class="glyphicon glyphicon-arrow-down"></span> <?php echo session::getInstance()->getLabel('lang.text.page.label.tcmin'); ?> <span id="tcmin" class="label label-warning">00,0 °C</span> &nbsp;&nbsp;
				
			</div>
		
			<div class="col-md-3" align="right">
				<a id="bt_avant"><span class="glyphicon glyphicon-arrow-left"></span></a>			
				<?php
                    $months = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];
                    echo '<select id="mois" name="mois">';

                    foreach ($months as $index => $name) {
                        echo '<option value="'.($index + 1).'"';
                        if ($index + 1 == date('m')) {
                            echo ' selected="selected"';
                        }
                        echo ">{$name}</option>";
                    }
                    echo '</select>';

                    echo '<select id="annee" name="annee">';
                        for ($a = 2014; $a <= 2035; ++$a) {
                            echo '<option value="'.($a).'"';
                            if ($a == date('Y')) {
                                echo ' selected="selected"';
                            }
                            echo ">{$a}</option>";
                        }
                    echo '</select>';

                ?>
				<a id="bt_apres"><span class="glyphicon glyphicon-arrow-right"></span></a>
			</div>
			<div class="col-md-12">
				<span class="glyphicon glyphicon-cloud"></span> <?php echo session::getInstance()->getLabel('lang.text.page.label.dju'); ?> <span id="dju" class="label label-primary">0</span> &nbsp;&nbsp;
				<span class="glyphicon glyphicon-hand-right"></span> <?php echo session::getInstance()->getLabel('lang.text.page.label.nbcycle'); ?> <span id="cycle" class="label label-primary">0</span> &nbsp;&nbsp;
			</div>

			
			
			
			
		</div>
		
		<div>	
			<div class="col-md-12" id="histo-temperature" style="width:100%; height:500px;"></div>
			<div class="col-md-12"></div>
		</div>
		<p>&nbsp;</p>
		
		<div class="page-header row">
			
			<div class="col-md-9">
				<span class="glyphicon glyphicon-hand-right"></span> <?php echo session::getInstance()->getLabel('lang.text.page.label.conso'); ?> <span id="consoPelletSaison" class="label label-primary">00,00 Kg</span> &nbsp;&nbsp;
				<?php echo session::getInstance()->getLabel('lang.text.page.label.conso.ecs'); ?> <span id="consoEcsPelletSaison" class="label label-primary">00,00 Kg</span> &nbsp;&nbsp;
				<span class="glyphicon glyphicon-arrow-up"></span> <?php echo session::getInstance()->getLabel('lang.text.page.label.tcmax'); ?> <span id="tcmaxSaison" class="label label-success">00,0 °C</span> &nbsp;&nbsp;
				<span class="glyphicon glyphicon-arrow-right"></span> <?php echo session::getInstance()->getLabel('lang.text.page.label.tcmoy'); ?> <span id="tcmoySaison" class="label label-info">00,0 °C</span> &nbsp;&nbsp;
				<span class="glyphicon glyphicon-arrow-down"></span> <?php echo session::getInstance()->getLabel('lang.text.page.label.tcmin'); ?> <span id="tcminSaison" class="label label-warning">00,0 °C</span> &nbsp;&nbsp;
			</div>
			<div class="col-md-3" align="right">
				<select id="saison" name="saison">
					
				</select>
			</div>
			<div class="col-md-12">
				<span class="glyphicon glyphicon-cloud"></span> <?php echo session::getInstance()->getLabel('lang.text.page.label.dju'); ?> <span id="djuSaison" class="label label-primary">0</span>
				<span class="glyphicon glyphicon-hand-right"></span> <?php echo session::getInstance()->getLabel('lang.text.page.label.nbcycle'); ?> <span id="cycleSaison" class="label label-primary">0</span>
			
			</div>
		</div>
		
		<div id="saison_graphic" style="width:100%; height:400px;"></div>
		
		<p>&nbsp;</p>
		
		<table id="recap" class="table table-hover">
	        <thead>
	            <tr >
	                <th class="col-md-2">Mois</th>
	                <th class="col-md-2">Cycle Bruleur</th>
	                <th class="col-md-2">DJU</th>
					<th class="col-md-2">Conso (Kg)</th>
					<th class="col-md-2">Dont ECS (Kg)</th>
	                <th class="col-md-2">gr/DJU/m2</th>
	                
	            </tr>
	        </thead>
	    
	        <tbody>
	        </tbody>

    	</table>
		
	</div>	
		
<?php
include __DIR__.'/_templates/footer.php';
?>
<!--appel des scripts personnels de la page -->
	
	<script src="js/histo.js"></script>
	
	</body>
</html>
