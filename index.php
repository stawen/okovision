<?php
include_once 'config.php';
include('_templates/header.php');
include('_templates/menu.php');
include('ajax.php');

?>   
<div class="se-pre-con"></div>

    <div class="container theme-showcase" role="main">
		<div class="page-header" align="center">
			<span class="glyphicon glyphicon-hand-right"></span> Consommation de pellet : <span id="consoPellet" class="label label-primary">00,00 Kg</span> &nbsp;&nbsp;
			<span class="glyphicon glyphicon-arrow-up"></span> T°C Max (ext) : <span id="tcmax" class="label label-success">00,0 °C</span> &nbsp;&nbsp;
			<span class="glyphicon glyphicon-arrow-down"></span> T°C Min (ext) : <span id="tcmin" class="label label-warning">00,0 °C</span>
		</div>
		<div class="page-header"> 
			<a id="bt_ecs"><span class="glyphicon glyphicon-minus-sign"></span></a> <span id="txt_ecs" class="label label-primary" style="display: none; font-size: 14px">Eau chaude sanitaire</span>
			<div id="ecs_graphic" style="width:100%; height:400px;"></div>
		</div>
		
		<div class="page-header">
			<a id="bt_chauffage"><span class="glyphicon glyphicon-minus-sign"></span></a> <span id="txt_chauffage" class="label label-primary" style="display: none; font-size: 14px">Chauffage</span>
			<div id="chauffage_graphic" style="width:100%; height:400px;"></div>
		</div>
		
		<div class="page-header">
			<a id="bt_tc"><span class="glyphicon glyphicon-minus-sign"></span></a> <span id="txt_tc" class="label label-primary" style="display: none; font-size: 14px">Température</span>
			<div id="temperature_graphic" style="width:100%; height:400px;"></div>
		</div>
		
		
		
			
		
		


	
<?php
include('_templates/footer.php');
?>
<!--appel des scripts personnels de la page -->
	<script src="js/graphiques.js"></script>
    </body>
</html>