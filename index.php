<?php
/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/

if (!file_exists("config.php")) {
   header("Location: setup.php");
}else{
	include_once 'config.php';
	include_once '_templates/header.php';
	include_once '_templates/menu.php';
}



?>   
<div class="se-pre-con"></div>

    <div class="container theme-showcase" role="main">
		
		<div class="page-header" align="center">
			<span class="glyphicon glyphicon-hand-right"></span> Consommation de pellet : <span id="consoPellet" class="label label-primary">00,00 Kg</span> &nbsp;&nbsp;
			<span class="glyphicon glyphicon-arrow-up"></span> T°C Max (ext) : <span id="tcmax" class="label label-success">00,0 °C</span> &nbsp;&nbsp;
			<span class="glyphicon glyphicon-arrow-down"></span> T°C Min (ext) : <span id="tcmin" class="label label-warning">00,0 °C</span>
		</div>
		<div class="container-graphe">
		</div>
		
		
		
			
		
		


	
<?php
include('_templates/footer.php');
?>
<!--appel des scripts personnels de la page -->
	<script src="js/index.js"></script>
	</body>
</html>