<?php
/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/

	include_once 'config.php';
	include_once '_templates/header.php';
	include_once '_templates/menu.php';

?>  

    <div class="container theme-showcase" role="main">
        <div class="page-header"> 
            <h2>Migration des données vers version superieure ou égale à 1.3.0</h2>
        </div>
        <div class="well">
		    Pour pouvoir utiliser cette version vous devez migrer vos données. Pour cela rien de compliquer, il suffit de cliquer sur "Migrer"
	    </div>
	    <button type="button" id="bt_migrate" class="btn btn-xs btn-default" >
			<span class="glyphicon glyphicon-cloud-download" aria-hidden="true"></span>
			Migrer
		</button>
		<div id="inwork-makemigration" style="display: none;">
			<br/>
			<br/><span class="glyphicon glyphicon-refresh glyphicon-spin"></span>
			Migration en cours....
		</div>
		<div id="inwork-getDate">
			<br/>
			<br/><span class="glyphicon glyphicon-refresh glyphicon-spin"></span>
			Récupération des informations....
		</div>
    
        <table id="listeDateMigrate" class="table table-hover">
            <thead>
                <tr>
                    <th class="col-md-10">Dates à migrer</th>
                    <th class="col-md-2"></th>
                </tr>
            </thead>
        
            <tbody>
            </tbody>
    
        </table>
    
    </div>

<?php
include('_templates/footer.php');
?>
<!--appel des scripts personnels de la page -->
	<script src="js/migration.js"></script>
	</body>
</html>