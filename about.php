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
			<h2>A propos d'Okovision</h2>
        </div>
        <div class="well">
            <img style='float:left;width:130px;height:130px; margin-right:20px;' src="https://avatars2.githubusercontent.com/u/13132210?v=3&s=460" alt="stawen" class="img-circle" >
            
           	<p>Okovision est une application de Stawen Dronek.</p>
			<p>Toutes utilisations commerciales est interdite sans mon accord.</p>
			<p>Pour plus d'informations <a href="http://okovision.dronek.com" target="_blank">okovision.dronek.com</a> et le <a href="https://github.com/stawen/okovision/wiki" target="_blank">Wiki</a></p>
			<p>Si vous constatez des bugs, merci de me les remonter via <a href="https://github.com/stawen/okovision/issues" target="_blank">GitHub</a> ou par mail</p>
			<p>Contact : <a href="mailto:stawen@dronek.com">stawen@dronek.com</a></p>
        </div>
       <div class="page-header">
			<h2>Mise à jour disponible</h2>
			Mettre les changlog des maj dispo
        </div>
		
		
		
		
			
		
		


	
<?php
include('_templates/footer.php');
?>
<!--appel des scripts personnels de la page -->
	<!-- script src="js/index.js"></script -->
	</body>
</html>