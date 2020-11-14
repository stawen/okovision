<?php
/*
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
*/

if (!file_exists('config.php')) {
    header('Location: setup.php');
} else {
    include_once 'config.php';
    include_once '_templates/header.php';
    include_once '_templates/menu.php';
}

?>  

    <div class="container theme-showcase" role="main">
           
         
		<div class="page-header">
		    <div class="row">
		        <div class="col-md-11 rtTitle"><?php echo session::getInstance()->getLabel('lang.text.page.rt.boilerName'); ?> <?php echo 'http://'.CHAUDIERE; ?></div>
		        <div class="col-md-1 text-right">
		            <button type="button" class="btn btn-xs btn-default" data-toggle="modal" data-target="#modal_boiler">
			            <span class="glyphicon glyphicon-cog" aria-hidden="true"></span>
		            </button>
		        </div>
		    </div>          
		</div>
		<div id="logginprogress" class="page-header" align="center">
            <p><span class="glyphicon glyphicon-refresh glyphicon-spin"></span>&nbsp;<?php echo session::getInstance()->getLabel('lang.text.page.rt.logginprogress'); ?></p>
        </div> 
        <div id="mustSaving" class="alert alert-warning" style="display: none;" role="alert">
              <span class="glyphicon glyphicon-floppy-save"></span>&nbsp;<?php echo session::getInstance()->getLabel('lang.text.page.rt.alertWarning'); ?>
        </div>
        <div id="communication" style="display: none;">
        
            <ul class="nav nav-tabs red" role="tablist">
                <li role="presentation" class="active"><a href="#indicateurs" aria-controls="indicateurs" role="tab" data-toggle="tab"><?php echo session::getInstance()->getLabel('lang.text.page.rt.tab.boilerInfo'); ?></a></li>
                <li role="presentation"><a href="#config" aria-controls="config" role="tab" data-toggle="tab"><?php echo session::getInstance()->getLabel('lang.text.page.rt.tab.boilerConfig'); ?></a></li>
                <li role="presentation"><a href="#graphiques" aria-controls="graphiques" role="tab" data-toggle="tab"><?php echo session::getInstance()->getLabel('lang.text.page.rt.tab.graphe'); ?></a></li>
            </ul>
             
            <div class="tab-content">
                 
                 <div role="tabpanel" class="tab-pane active" id="indicateurs">  
                    
            		<div class="row">
            		    <div class="col-md-12" ><h2><small><?php echo session::getInstance()->getLabel('lang.text.page.rt.title.indic'); ?></small></h2></div>
            		    <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    
                                    <div class="row">
                                        
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:FA[0].L_mittlere_laufzeit'); ?>" data-original-title="Tooltip"></span></div>
                                    
                                        <div class="col-xs-8 text-center">
                                            <div class="huge" id="FA0_L_mittlere_laufzeit">--</div>
                                        </div>
                                        <div class="col-xs-2"></div>
                                       
                                    </div>
                                    
                                    
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:FA[0].L_mittlere_laufzeit'); ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:FA[0].L_brennerstarts'); ?>" data-original-title="Tooltip" ></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge" id="FA0_L_brennerstarts">--</div>
                                        </div>
                                         <div class="col-xs-2"></div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:FA[0].L_brennerstarts'); ?></div>
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:FA[0].L_brennerlaufzeit_anzeige'); ?>" data-original-title="Tooltip"></span></div>
                                    
                                        <div class="col-xs-8 text-center">
                                            <div class="huge" id="FA0_L_brennerlaufzeit_anzeige">--</div>
                                        </div>
                                         <div class="col-xs-2"></div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:FA[0].L_brennerlaufzeit_anzeige'); ?></div>
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:FA[0].L_anzahl_zuendung'); ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge" id="FA0_L_anzahl_zuendung">--</div>
                                        </div>
                                         <div class="col-xs-2"></div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:FA[0].L_anzahl_zuendung'); ?></div>
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-md-12" ><h2><small><?php echo session::getInstance()->getLabel('lang.text.page.rt.title.tcambiante'); ?></small></h2></div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:LOCAL.hk[0].raumtemp_heizen'); ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge 2save" id="hk0_raumtemp_heizen">--</div>
                                        </div>
                                        <div class="col-xs-2 text-right">
                                            <a href="javascript:void(0)" class="change"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].raumtemp_heizen'); ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:LOCAL.hk[0].raumtemp_absenken'); ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge 2save" id="hk0_raumtemp_absenken">--</div>
                                        </div>
                                        <div class="col-xs-2 text-right">
                                            <a href="javascript:void(0)" class="change"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].raumtemp_absenken'); ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:LOCAL.hk[0].heizkurve_steigung'); ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge 2save" id="hk0_heizkurve_steigung">--</div>
                                        </div>
                                        <div class="col-xs-2 text-right">
                                            <a href="javascript:void(0)" class="change"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].heizkurve_steigung'); ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:LOCAL.hk[0].heizkurve_fusspunkt'); ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge 2save" id="hk0_heizkurve_fusspunkt">--</div>
                                        </div>
                                        <div class="col-xs-2 text-right">
                                            <a href="javascript:void(0)" class="change"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].heizkurve_fusspunkt'); ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:LOCAL.hk[0].heizgrenze_heizen'); ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge 2save" id="hk0_heizgrenze_heizen">--</div>
                                        </div>
                                        <div class="col-xs-2 text-right">
                                            <a href="javascript:void(0)" class="change"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].heizgrenze_heizen'); ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:LOCAL.hk[0].heizgrenze_absenken'); ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge 2save" id="hk0_heizgrenze_absenken">--</div>
                                        </div>
                                        <div class="col-xs-2 text-right">
                                            <a href="javascript:void(0)" class="change"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].heizgrenze_absenken'); ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-md-12" ><h2><small><?php echo session::getInstance()->getLabel('lang.text.page.rt.title.waterHT'); ?></small></h2></div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:LOCAL.hk[0].vorlauftemp_max'); ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge 2save" id="hk0_vorlauftemp_max">--</div>
                                        </div>
                                        <div class="col-xs-2 text-right">
                                            <a href="javascript:void(0)" class="change"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].vorlauftemp_max'); ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:LOCAL.hk[0].vorlauftemp_min'); ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge 2save" id="hk0_vorlauftemp_min">--</div>
                                        </div>
                                        <div class="col-xs-2 text-right">
                                            <a href="javascript:void(0)" class="change"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].vorlauftemp_min'); ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:LOCAL.hk[0].ueberhoehung'); ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge 2save" id="hk0_ueberhoehung">--</div>
                                        </div>
                                        <div class="col-xs-2 text-right">
                                            <a href="javascript:void(0)" class="change"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].ueberhoehung'); ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:LOCAL.hk[0].mischer_max_auf_zeit'); ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge 2save" id="hk0_mischer_max_auf_zeit">--</div>
                                        </div>
                                        <div class="col-xs-2 text-right">
                                            <a href="javascript:void(0)" class="change"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].mischer_max_auf_zeit'); ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:LOCAL.hk[0].mischer_max_aus_zeit'); ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge 2save" id="hk0_mischer_max_aus_zeit">--</div>
                                        </div>
                                        <div class="col-xs-2 text-right">
                                            <a href="javascript:void(0)" class="change"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].mischer_max_aus_zeit'); ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:LOCAL.hk[0].mischer_max_zu_zeit'); ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge 2save" id="hk0_mischer_max_zu_zeit">--</div>
                                        </div>
                                        <div class="col-xs-2 text-right">
                                            <a href="javascript:void(0)" class="change"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].mischer_max_zu_zeit'); ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:LOCAL.hk[0].mischer_regelbereich_quelle'); ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge 2save" id="hk0_mischer_regelbereich_quelle">--</div>
                                        </div>
                                        <div class="col-xs-2 text-right">
                                            <a href="javascript:void(0)" class="change"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].mischer_regelbereich_quelle'); ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:LOCAL.hk[0].mischer_regelbereich_vorlauf'); ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge 2save" id="hk0_mischer_regelbereich_vorlauf">--</div>
                                        </div>
                                        <div class="col-xs-2 text-right">
                                            <a href="javascript:void(0)" class="change"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].mischer_regelbereich_vorlauf'); ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:LOCAL.hk[0].quellentempverlauf_anstiegstemp'); ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge 2save" id="hk0_quellentempverlauf_anstiegstemp">--</div>
                                        </div>
                                        <div class="col-xs-2 text-right">
                                            <a href="javascript:void(0)" class="change"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].quellentempverlauf_anstiegstemp'); ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:LOCAL.hk[0].quellentempverlauf_regelbereich'); ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge 2save" id="hk0_quellentempverlauf_regelbereich">--</div>
                                        </div>
                                        <div class="col-xs-2 text-right">
                                            <a href="javascript:void(0)" class="change"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:LOCAL.hk[0].quellentempverlauf_regelbereich'); ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-md-12" ><h2><small><?php echo session::getInstance()->getLabel('lang.text.page.rt.paramBruleur'); ?></small></h2></div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:FA[0].pe_kesseltemperatur_soll'); ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge 2save" id="FA0_pe_kesseltemperatur_soll">--</div>
                                        </div>
                                        <div class="col-xs-2 text-right">
                                            <a href="javascript:void(0)" class="change"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:FA[0].pe_kesseltemperatur_soll'); ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:FA[0].pe_abschalttemperatur'); ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge 2save" id="FA0_pe_abschalttemperatur">--</div>
                                        </div>
                                        <div class="col-xs-2 text-right">
                                            <a href="javascript:void(0)" class="change"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:FA[0].pe_abschalttemperatur'); ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:FA[0].pe_einschalthysterese_smart'); ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge 2save" id="FA0_pe_einschalthysterese_smart">--</div>
                                        </div>
                                        <div class="col-xs-2 text-right">
                                            <a href="javascript:void(0)" class="change"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></a>
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:FA[0].pe_einschalthysterese_smart'); ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-lg-3 col-md-6">
                            <div class="panel panel-primary">
                                <div class="panel-heading">
                                    <div class="row">
                                        <div class="col-xs-2 text-left"><span class="glyphicon glyphicon-info-sign tip" title="<?php echo session::getInstance()->getLabel('lang.tooltip.CAPPL:FA[0].pe_kesselleistung'); ?>" data-original-title="Tooltip"></span></div>
                                        <div class="col-xs-8 text-center">
                                            <div class="huge" id="FA0_pe_kesselleistung">--</div>
                                        </div>
                                        <div class="col-xs-2 text-right">
                                           
                                        </div>
                                    </div>
                                </div>
                                <div class="panel-footer">
                                    <div class="labelbox"><?php echo session::getInstance()->getLabel('lang.capteur.CAPPL:FA[0].pe_kesselleistung'); ?></div>
                                    
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-md-12 text-right" id="touch0_version" ></div>
                        
                    </div>
                </div>
                
                <div role="tabpanel" class="tab-pane " id="config">  
                    <h2><small><?php echo session::getInstance()->getLabel('lang.text.page.rt.title.saveConfig'); ?></small></h2>
                    <p><?php echo session::getInstance()->getLabel('lang.text.page.rt.descSaveConfig'); ?></p>
                    <div class="row">
                        <div class="col-xs-10">
                            <input type="text" class="form-control" id="configDescription" maxlength="50" placeholder="Ce Texte est affiché sur les graphes">
                        </div>
                        <div class="col-xs-2">
                            <button type="button" id="btConfigTime" class="btn btn-default">
                			    <span class="glyphicon glyphicon-time" aria-hidden="true"></span>
                		    </button>
                            <button type="button" id="configDescriptionSave" class="btn btn-default">
                			    <span class="glyphicon glyphicon-floppy-save" aria-hidden="true"></span>
                		    </button>
                        </div>
                        <div id="configTime" style="display: none;">
                            <div class="col-xs-2 text-left">
                                <input type="text" class="form-control" id="configTimeSelect"> 
                            </div>
                            <div class="col-xs-10 text-left" >
                                <?php echo session::getInstance()->getLabel('lang.text.page.rt.dateChoised'); ?>
                            </div>
                        </div>
                    </div>
                    <hr>
                    <h2><small> <?php echo session::getInstance()->getLabel('lang.text.page.rt.title.listConfigBoiler'); ?></small></h2>
                    
                    <div id="liste">
                	    <table id="listConfig" class="table table-hover">
                            <thead>
                                <tr>
                                    <th class="col-md-2"><?php echo session::getInstance()->getLabel('lang.text.page.rt.table.title.date'); ?></th>
                                    <th class="col-md-8"><?php echo session::getInstance()->getLabel('lang.text.page.rt.table.title.desc'); ?></th>
                                    <th class="col-md-2"></th>
                                    
                                </tr>
                            </thead>
                        
                            <tbody>
                            </tbody>
                
                        </table>
                	</div>
                    
                </div>
                
                <div role="tabpanel" class="tab-pane " id="graphiques">  
                    <br/>
                    <div class="col-md-12" align="left"><?php echo session::getInstance()->getLabel('lang.text.page.rt.select.graphe'); ?>
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
                        <h4 class="modal-title"><?php echo session::getInstance()->getLabel('lang.text.page.rt.modal.title'); ?></h4>
                    </div>
                    <div class="modal-body">
                        <form>
                            <div class="form-group">
                                <label for="recipient-name" class="control-label"><?php echo session::getInstance()->getLabel('lang.text.page.rt.modal.login'); ?></label>
                                <input type="text" class="form-control" id="okologin" placeholder="Ex : oekofen">
                            </div>
                            <div class="form-group">
                                <label for="recipient-name" class="control-label"><?php echo session::getInstance()->getLabel('lang.text.page.rt.modal.password'); ?></label>
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
        
        
        <div class="modal fade" id="modal_change" tabindex="-1" role="dialog" aria-labelledby="changeValue" aria-hidden="true">
            <div class="modal-dialog modal-sm">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 class="modal-title" id="sensorTitle"></h4>
                    </div>
                    <div class="modal-body">
                        <div class="hidden">
                            <input type="text" id="sensorId">
                            <input type="number" id="sensorDivisor">
                            <input type="text" id="sensorUnitText">
                        </div>
                        <div class="col-md-6 text-center" id="sensorMin"></div>
                        <div class="col-md-6 text-center" id="sensorMax"></div>
                        <br/>
                        <form>
                                <input type="number" class="form-control text-center input-lg col-xs-10" id="sensorValue" step="0.1">
                        </form>
                        <br/> <br/>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default btn-sm" data-dismiss="modal">
                            <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
                        </button>
                        <button type="button" id="btConfirmSensor" class="btn btn-default btn-sm">
                            <span class="glyphicon glyphicon-ok" aria-hidden="true"></span>
                        </button>
                    </div>
                </div>
            </div>
        </div>


        <div class="modal fade" id="modal_delete" tabindex="-1" role="dialog" aria-labelledby="deleteLabel" aria-hidden="true">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span>
						</button>
						<h4 class="modal-title"><?php echo session::getInstance()->getLabel('lang.text.page.rt.deleteConfig'); ?></h4>
					</div>
					<div class="hidden">
						<input type="text" id="deleteid">
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-default" data-dismiss="modal"><?php echo session::getInstance()->getLabel('lang.text.modal.cancel'); ?></button>
						<button type="button" class="btn btn-danger btn-ok" id="deleteConfirm"><?php echo session::getInstance()->getLabel('lang.text.modal.confirm'); ?></button>
					</div>
				</div>
			</div>
		</div>

<?php
include __DIR__.'/_templates/footer.php';
?>
<!--appel des scripts personnels de la page -->
	<script src="js/jquery/jquery-ui-timepicker-addon.js"></script>
	<script src="_langs/<?php echo session::getInstance()->getLang(); ?>.datepicker.js"></script>
	<script src="js/rt.js"></script>
	</body>
</html>
