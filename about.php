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

    <div class="container theme-showcase" role="main">
		
		<div class="page-header" >
			<h2><?php echo session::getLabel('lang.text.page.about.title') ?></h2>
        </div>
        <div class="well">
            <img style='float:left;width:130px;height:130px; margin-right:20px;' src="images/stawen.png" alt="stawen" class="img-circle" >
            
           	<?php echo session::getLabel('lang.text.page.about.information') ?>
        </div>
       <div class="page-header">
			<h2><?php echo session::getLabel('lang.text.page.about.update') ?></h2>
				<button type="button" id="bt_update" class="btn btn-xs btn-default" style="display: none;">
					<span class="glyphicon glyphicon-cloud-download" aria-hidden="true"></span> <?php echo session::getLabel('lang.text.page.about.update.install') ?>
				</button>
			<div id="inwork-checkupdate" ><br/><br/><span class="glyphicon glyphicon-refresh glyphicon-spin"></span>  <?php echo session::getLabel('lang.text.page.about.update.check') ?></div>
			<div id="inwork-makeupdate" style="display: none;"><br/><br/><span class="glyphicon glyphicon-refresh glyphicon-spin"></span>  <?php echo session::getLabel('lang.text.page.about.update.inprogress') ?></div>
			<p>
				<div id ="informations"></div>
			</p>
        </div>
		

<?php
include('_templates/footer.php');
?>
<!--appel des scripts personnels de la page -->
	<script src="js/about.js"></script>
	</body>
</html>