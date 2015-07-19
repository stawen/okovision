<?php
	include_once 'config.php';
	include('_templates/header.php');
	include('_templates/menu.php');
	include('ajax.php');
?>
<div class="container theme-showcase" role="main">
    <div class="page-header" >
    
        <ul class="nav nav-tabs" role="tablist">
            <li role="presentation"><a href="#majip" aria-controls="majip" role="tab" data-toggle="tab">Importation des données (depuis chaudiere)</a></li>
            <li role="presentation"><a href="#majusb" aria-controls="majusb" role="tab" data-toggle="tab">Importation des données (upload)</a></li>
            <li role="presentation"><a href="#synthese" aria-controls="synthese" role="tab" data-toggle="tab">Calcul Synthèse journaliere</a></li>
        </ul>
        <div class="tab-content">
            <div role="tabpanel" class="tab-pane" id="majip">
            </br>
            <p>Pour importer les données de la chaudiere directement dans okovision, cliquez sur le bouton correspondant au fichier voulu</p>
                <table id="listeFichierFromChaudiere" class="table table-hover">
                    <thead>
                        <tr>
                            <th class="col-md-10">Nom</th>
                            <th class="col-md-2"></th>
                        </tr>
                    </thead>
                
                    <tbody>
                    </tbody>
            
                </table>
            
            </div>
            <div role="tabpanel" class="tab-pane" id="majusb">..majusb.</div>
            <div role="tabpanel" class="tab-pane" id="synthese">..synthese.</div>
        </div>

<?php
include('_templates/footer.php');
?>
<!--appel des scripts personnels de la page -->
	<script src="js/actionManuelle.js"></script>
    </body>
</html>