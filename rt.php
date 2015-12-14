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
           
        
		<div class="page-header">
		    <div class="row">
		        <div class="col-md-11 rtTitle">Données de la chaudière <?php echo 'http://'.CHAUDIERE ?></div>
		        <div class="col-md-1 text-right">
		            <button type="button" class="btn btn-xs btn-default" data-toggle="modal" data-target="#modal_boiler">
			            <span class="glyphicon glyphicon-cog" aria-hidden="true"></span>
		            </button>
		        </div>
		    </div>          
		</div>
		<div id="logginprogress" class="page-header" align="center">
            <p><span class="glyphicon glyphicon-refresh glyphicon-spin"></span>&nbsp;<?php echo session::getInstance()->getLabel('lang.text.page.rt.logginprogress') ?></p>
        </div> 
        
        <div id="communication" style="display: none;">
        
            <ul class="nav nav-tabs" role="tablist">
                <li role="presentation" class="active"><a href="#indicateurs" aria-controls="indicateurs" role="tab" data-toggle="tab">Réglages Chaudière</a></li>
                <li role="presentation"><a href="#graphiques" aria-controls="graphiques" role="tab" data-toggle="tab">Graphiques</a></li>
            </ul>
             
            <div class="tab-content">
                 
                 <div role="tabpanel" class="tab-pane active" id="indicateurs">  
                    
            		<div class="row">
            		    <div class="col-md-12" ><h2><small>Indicateurs de fontionnement</small></h2></div>
            		    <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                            
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:FA[0].L_mittlere_laufzeit') ?>" data-original-title="Tooltip"></span></div>
                                    
                                        <div class="col-xs-8 text-center">
                                            <div class="huge" id="FA0_L_mittlere_laufzeit">--</div>
                                        </div>
                                        
                                        <div class="col-xs-2 text-right">
                                            <a href="" class="change"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                                        </div>
                                        
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:FA[0].L_mittlere_laufzeit') ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:FA[0].L_brennerstarts') ?>" data-original-title="Tooltip" ></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge" id="FA0_L_brennerstarts">--</div>
                                        </div>
                                        <div class="col-xs-2 text-right"><span class="glyphicon glyphicon-pencil" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:FA[0].L_brennerstarts') ?>" data-original-title="Tooltip"></span></div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:FA[0].L_brennerstarts') ?></div>
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:FA[0].L_brennerlaufzeit_anzeige') ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="FA0_L_brennerlaufzeit_anzeige">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:FA[0].L_brennerlaufzeit_anzeige') ?></div>
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:FA[0].L_anzahl_zuendung') ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="FA0_L_anzahl_zuendung">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:FA[0].L_anzahl_zuendung') ?></div>
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-md-12" ><h2><small>Chauffage - T°C ambiante</small></h2></div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:LOCAL.hk[0].raumtemp_heizen') ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="hk0_raumtemp_heizen">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].raumtemp_heizen') ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:LOCAL.hk[0].raumtemp_absenken') ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="hk0_raumtemp_absenken">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].raumtemp_absenken') ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:LOCAL.hk[0].heizkurve_steigung') ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="hk0_heizkurve_steigung">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].heizkurve_steigung') ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:LOCAL.hk[0].heizkurve_fusspunkt') ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="hk0_heizkurve_fusspunkt">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].heizkurve_fusspunkt') ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:LOCAL.hk[0].heizgrenze_heizen') ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="hk0_heizgrenze_heizen">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].heizgrenze_heizen') ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign" title="Tooltip on left"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="hk0_heizgrenze_absenken">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].heizgrenze_absenken') ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-md-12" ><h2><small>Chauffage - Gestion Eau dans Radiateur</small></h2></div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign" title="Tooltip on left"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="hk0_vorlauftemp_max">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].vorlauftemp_max') ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign" title="Tooltip on left"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="hk0_vorlauftemp_min">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].vorlauftemp_min') ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign" title="Tooltip on left"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="hk0_ueberhoehung">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].ueberhoehung') ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign" title="Tooltip on left"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="hk0_mischer_max_auf_zeit">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].mischer_max_auf_zeit') ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign" title="Tooltip on left"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="hk0_mischer_max_aus_zeit">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].mischer_max_aus_zeit') ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign" title="Tooltip on left"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="hk0_mischer_max_zu_zeit">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].mischer_max_zu_zeit') ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign" title="Tooltip on left"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="hk0_mischer_regelbereich_quelle">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].mischer_regelbereich_quelle') ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign" title="Tooltip on left"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="hk0_mischer_regelbereich_vorlauf">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].mischer_regelbereich_vorlauf') ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign" title="Tooltip on left"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="hk0_quellentempverlauf_anstiegstemp">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].quellentempverlauf_anstiegstemp') ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign" title="Tooltip on left"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="hk0_quellentempverlauf_regelbereich">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].quellentempverlauf_regelbereich') ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-md-12" ><h2><small>Paramétrage brûleur</small></h2></div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign" title="Tooltip on left"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="FA0_pe_kesseltemperatur_soll">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:FA[0].pe_kesseltemperatur_soll') ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign" title="Tooltip on left"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="FA0_pe_abschalttemperatur">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:FA[0].pe_abschalttemperatur') ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign" title="Tooltip on left"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="FA0_pe_einschalthysterese_smart">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:FA[0].pe_einschalthysterese_smart') ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-12 text-right"><span class="glyphicon glyphicon-info-sign" title="Tooltip on left"></span></div>
                                        <div class="col-xs-12 text-center">
                                            <div class="huge" id="FA0_pe_kesselleistung">--</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:FA[0].pe_kesselleistung') ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-md-12 text-right" id="touch0_version" ></div>
                        
                    </div>
                </div>
                
                
                <div role="tabpanel" class="tab-pane " id="graphiques">  
                    <br/>
                    <div class="col-md-12" align="left"><?php echo session::getInstance()->getLabel('lang.text.page.rt.select.graphe') ?>
            			<select id="select_graphique">
            			</select>
            			<button type="button" id="grapheValidate" class="btn btn-xs btn-default">
            			    <span class="glyphicon glyphicon-ok" aria-hidden="true"></span>
            		    </button>
            		</div>
                	<br/><br/>
                    <div class="graphique" id="rt"></div>
                	
        		</div>
            </div>
        </div>
        
        <div class="modal fade" id="modal_boiler" tabindex="-1" role="dialog" aria-labelledby="setLogin" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                    <h4 class="modal-title"><?php echo session::getInstance()->getLabel('lang.text.page.rt.modal.title') ?></h4>
                </div>
                <div class="modal-body">
                    <form>
                        <div class="form-group">
                            <label for="recipient-name" class="control-label"><?php echo session::getInstance()->getLabel('lang.text.page.rt.modal.login') ?></label>
                            <input type="text" class="form-control" id="okologin" placeholder="Ex : oekofen">
                        </div>
                        <div class="form-group">
                            <label for="recipient-name" class="control-label"><?php echo session::getInstance()->getLabel('lang.text.page.rt.modal.password') ?></label>
                            <input type="password" class="form-control" id="okopassword" placeholder="Ex : oekofen">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default btn-sm" data-dismiss="modal">
                        <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
                    </button>
                    <button type="button" id="btconfirm" class="btn btn-default btn-sm">
                        <span class="glyphicon glyphicon-ok" aria-hidden="true"></span>
                    </button>
                </div>
                
            </div>
        </div>
        </div>


<?php
include('_templates/footer.php');
?>
<!--appel des scripts personnels de la page -->
    <script src="js/rt.js"></script>
	</body>
</html>