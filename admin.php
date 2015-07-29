<?php
/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/

	include_once 'config.php';
	include_once '_templates/header.php';
	include_once '_templates/menu.php';
	//include_once 'ajax.php';
?>

<div class="container theme-showcase" role="main">
<br/>
    <div class="page-header" >
        <ul class="nav nav-tabs" role="tablist">
          <li role="presentation"><a href="#infoge" aria-controls="infoge" role="tab" data-toggle="tab">Informations Generales</a></li>
          <li role="presentation"><a href="#saisons" aria-controls="saisons" role="tab" data-toggle="tab">Saisons</a></li>
          <li role="presentation"><a href="#matrice" aria-controls="matrice" role="tab" data-toggle="tab">Matrice de lecture du CSV</a></li>
        </ul>

        <!-- Tab panes -->
          <div class="tab-content">
            <div role="tabpanel" class="tab-pane " id="infoge">
            <br/>
                <form class="form-horizontal">
    				<fieldset>
    				
    				<!-- Form Name -->
    					<legend>Communication avec votre chaudiere</legend>
    					
    					<!-- Select Basic -->
    					<div class="form-group">
    					  <label class="col-md-4 control-label" for="oko_typeconnect">Mode de récupération du fichier CSV :</label>
    					  <div class="col-md-3">
    					    <select id="oko_typeconnect" name="oko_typeconnect" class="form-control">
    					        <option value="0">USB</option>
    			                <option value="1" <?php if(GET_CHAUDIERE_DATA_BY_IP){ echo "selected=selected";} ?> >IP</option>
    					    </select>
    					  </div>
    					 
    					</div>
    					
                        <!-- Text input-->
                        <div class="form-group" id="form-ip" <?php if(!GET_CHAUDIERE_DATA_BY_IP){ echo 'style="display: none;"';} ?>>
                            <label class="col-md-4 control-label" for="oko_ip">Adresse IP de votre chaudière :</label>  
                            <div class="col-md-3">
                                <input id="oko_ip" name="oko_ip" type="text" class="form-control input-md" placeholder="ex : 192.168.0.20" value="<?php echo CHAUDIERE;?>">
                                <span class="help-block" id="url_csv"></span> 
                            </div>
                            <div class="col-md-3">
                                <button type="button" class="btn btn-xs btn-default" id="test_oko_ip">
                                    <span class="glyphicon glyphicon-share" aria-hidden="true"></span> Tester
                                </button>
                            </div>
    					</div>
    				
    				</fieldset>
    				
    				<fieldset>
    				    <legend>Parametrage de l'application</legend>
					
    					<!-- Text input-->
    					<div class="form-group">
    					  <label class="col-md-4 control-label" for="param_tcref">T°C de reference :</label>  
    					  <div class="col-md-3">
    					  <input id="param_tcref" name="param_tcref" type="text" placeholder="ex : 20" class="form-control input-md" required="" value="<?php echo TC_REF;?>">
    					  <span class="help-block">Si vous avez 2 consignes, réduit à 19 et confort à 21, vous faites la moyenne -&gt; 20. Ceci est pour le calcul du DJU</span>  
    					  </div>
    					</div>
    					
    					<!-- Text input-->
    					<div class="form-group">
    					  <label class="col-md-4 control-label" for="param_poids_pellet">Poids pellet pour 60 secondes de vis : </label>  
    					  <div class="col-md-3">
    					  <input id="param_poids_pellet" name="param_poids_pellet" type="text" placeholder="ex : 150" class="form-control input-md" required=""  value="<?php echo POIDS_PELLET_PAR_MINUTE;?>">
    					  <span class="help-block">Poids de pellet mesuré par un fonctionnement de la vis d'alimentation du foyer pendant 60 secondes</span>  
    					  </div>
    					</div>
    					
    					<!-- Text input-->
    					<div class="form-group">
    					  <label class="col-md-4 control-label" for="parap_poids_pellet">Surface de la maison : </label>  
    					  <div class="col-md-3">
    					  <input id="surface_maison" name="param_surface" type="text" placeholder="ex : 180" class="form-control input-md" required=""  value="<?php echo SURFACE_HOUSE;?>">
    					  <span class="help-block">en m²</span>  
    					  </div>
    					</div>
				
				    </fieldset>
    			
    			</form>
                <div  align="center">
					    <button id="bt_save_infoge" name="bt_save_infoge" class="btn btn-primary" type="button">Sauvegarder</button>
				</div>
            </div>
            
            
            <div role="tabpanel" class="tab-pane" id="saisons">
                <br/>
            	Pour avoir des graphiques de synthese, vous devez definir les saisons. Une saison est une periode d'un an. Vous devez preciser le premier jour du debut de votre année.
            	Elle peut commencer à 01 Septembre, et se terminera automatiquement au 31 Aout de l'année suivante
            	
            	<br/><br/>
            	<button type="button" class="btn btn-xs btn-default" id="openModalAddSaison" data-toggle="modal" data-target="#modal_saison">
                    <span class="glyphicon glyphicon-plus" aria-hidden="true"></span> Ajouter une saison
                </button>
                <table id="saisons" class="table table-hover">
                    <thead>
                        <tr >
                            <th class="col-md-3">Saison</th>
                            <th class="col-md-3">Date début</th>
                            <th class="col-md-3">Date fin</th>
                            <th class="col-md-3"></th>
                            
                        </tr>
                    </thead>
                
                    <tbody>
                    </tbody>
            
                </table>
                
                <div class="modal fade" id="modal_saison" tabindex="-1" role="dialog" aria-labelledby="saisonLabel" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                                <h4 class="modal-title" id="GraphiqueTitre"></h4>
                            </div>
                            <div class="modal-body">
                                <div class="hidden">
                                    <input type="text" id="saisonId">
                                    <input type="text" id="typeModal">
                                </div>
                                <form>
            
                                    <div class="form-group">
                                        <label for="recipient-name" class="control-label">Date de début :</label>
                                        <input type="text" class="form-control" id="startDateSaison" placeholder="ex : 01/09/2014">
                                    </div>
                                    
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-default btn-sm" data-dismiss="modal">
                                    <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
                                </button>
                                <button type="button" id="confirm" class="btn btn-default btn-sm">
                                    <span class="glyphicon glyphicon-ok" aria-hidden="true"></span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                
                <div class="modal fade" id="confirm-delete" tabindex="-1" role="dialog" aria-labelledby="deleteSaison" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span>
                                </button>
                                <h4 class="modal-title" id="deleteTitre"></h4>
                            </div>
                            <div class="hidden">
                                <input type="text" id="saisonId">
                           </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-default" data-dismiss="modal">Annuler</button>
                                <button type="button" class="btn btn-danger btn-ok" id="deleteConfirm">Confirmer</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                
                
                
                
            </div>
            <div role="tabpanel" class="tab-pane" id="matrice">
            	<br/>
            	Votre installation Okofen est spécifique. Le format du fichier CSV quelle produit est unique. Vous devez alors "apprendre" à okovision comment lire ce fichier.
            	<br/> Tout d'abord, importer le fichier via le bouton ci-dessous
            	<br/><br/>
            	<div id="selectFile" style="display: none;">
	            	<span class="btn btn-success fileinput-button">
				        <i class="glyphicon glyphicon-plus"></i>
				        <span>Fichier CSV produit par la chaudiere</span>
				        <!-- The file input field used as target for the file upload widget -->
				        <input id="fileupload" type="file" name="files[]">
				    </span>
				    <br/><br/>
				    <!-- The global progress bar -->
				   <div class="progress">
	  					<div id="bar" class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100">
	    					
	  					</div>
					</div>
				</div>
				<div id="concordance">
				    <table id="headerCsv" class="table table-hover">
                    <thead>
                        <tr>
                            <th class="col-md-3">Nom Original</th>
                            <th class="col-md-3">Nom Okovision</th>
                            <th class="col-md-6"></th>
                            
                        </tr>
                    </thead>
                
                    <tbody>
                    </tbody>
            
                </table>
				<div>
            </div>
           
          </div>
    </div>


<?php
include('_templates/footer.php');
?>
<!--appel des scripts personnels de la page -->
	<!-- script src="js/jquery.ui.widget.js"></script -->
  	<!--script src="js/jquery.iframe-transport.js"></script-->
  	<script src="js/jquery.fileupload.js"></script>
	<script src="js/admin.js"></script>
    </body>
</html>