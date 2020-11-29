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
<br/>
    <div class="page-header" >
        <h2><?php echo session::getInstance()->getLabel( 'lang.text.menu.manual.import.ip') ?></h2>
    </div>    
           
            <p><?php echo session::getInstance()->getLabel('lang.text.page.manual.ip.import') ?></p>
            <div id="inwork-remotefile" >
            <br/><span class="glyphicon glyphicon-refresh glyphicon-spin"></span><?php echo session::getInstance()->getLabel('lang.text.page.manual.workinprogress') ?></div>
                <table id="listeFichierFromChaudiere" class="table table-hover">
                    <thead>
                        <tr>
                            <th class="col-md-10"><?php echo session::getInstance()->getLabel('lang.text.page.manual.ip.filefromboiler') ?></th>
                            <th class="col-md-2"></th>
                        </tr>
                    </thead>
                
                    <tbody>
                    </tbody>
            
                </table>
            
            </div>
            
    </div>

<?php
include(__DIR__ . '/_templates/footer.php');
?>
<!--appel des scripts personnels de la page -->
    <script src="js/jquery/jquery.fileupload.js"></script>
	<script src="js/amImpBoiler.js"></script>
    </body>
</html>
