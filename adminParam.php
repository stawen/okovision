<?php
/*
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
*/

    include_once 'config.php';
    include_once '_templates/header.php';
    include_once '_templates/menu.php';
?>



<div class="container theme-showcase" role="main">
<br/>
    <div class="page-header" >
        <h2><?php echo session::getInstance()->getLabel('lang.text.menu.admin.information'); ?></h2>
    </div>

                <form class="form-horizontal">
    				<fieldset>
    				
    				<!-- Form Name -->
    					<legend><?php echo session::getInstance()->getLabel('lang.text.page.admin.boilercomm'); ?></legend>
    					
    					<!-- Select Basic -->
    					<div class="form-group">
    					  <label class="col-md-4 control-label" for="oko_typeconnect"><?php echo session::getInstance()->getLabel('lang.text.page.admin.boilergetfile'); ?></label>
    					  <div class="col-md-3">
    					    <select id="oko_typeconnect" name="oko_typeconnect" class="form-control">
    					        <option value="0">USB</option>
    			                <option value="1" <?php if (GET_CHAUDIERE_DATA_BY_IP) {
    echo 'selected=selected';
} ?> >IP</option>
    					    </select>
    					  </div>
    					 
    					</div>
    					
                        <!-- Text input-->
                        <div class="form-group" id="form-ip" <?php if (!GET_CHAUDIERE_DATA_BY_IP) {
    echo 'style="display: none;"';
} ?>>
                            <label class="col-md-4 control-label" for="oko_ip"><?php echo session::getInstance()->getLabel('lang.text.page.admin.boilerip'); ?></label>  
                            <div class="col-md-3">
                                <input id="oko_ip" name="oko_ip" type="text" class="form-control input-md" placeholder="ex : 192.168.0.20" value="<?php echo CHAUDIERE; ?>">
                                <span class="help-block" id="url_csv"></span> 
                            </div>
                            <div class="col-md-3">
                                <button type="button" class="btn btn-xs btn-default" id="test_oko_ip">
                                    <span class="glyphicon glyphicon-share" aria-hidden="true"></span><?php echo session::getInstance()->getLabel('lang.text.page.admin.test'); ?>
                                </button>
                            </div>
    					</div>
    				
    				</fieldset>
    				
    				<fieldset>
    				    <legend><?php echo session::getInstance()->getLabel('lang.text.page.admin.param'); ?></legend>
					
    					<!-- Text input-->
    					<div class="form-group">
    					  <label class="col-md-4 control-label" for="param_zone"><?php echo session::getInstance()->getLabel('lang.text.page.admin.param.timezone'); ?></label>  
    					  <div class="col-md-3">
    					  	<select id="timezone" class="form-control">
							  <?php
                                $t = DateTimeZone::listIdentifiers(DateTimeZone::EUROPE);
                                $d = date_default_timezone_get();
                                echo '<option>UTC</option>';
                                foreach ($t as $zone) {
                                    if ($d === $zone) {
                                        echo '<option selected=selected>'.$zone.'</option>';
                                    } else {
                                        echo '<option>'.$zone.'</option>';
                                    }
                                }

                                ?>
							</select>
    					
    					  </div>
    					</div>
    					
    					<!-- Text input-->
    					<div class="form-group">
    					  <label class="col-md-4 control-label" for="param_tcref"><?php echo session::getInstance()->getLabel('lang.text.page.admin.param.tcref'); ?></label>  
    					  <div class="col-md-3">
    					  <input id="param_tcref" name="param_tcref" type="text" placeholder="ex : 20" class="form-control input-md" required="" value="<?php echo TC_REF; ?>">
    					  <span class="help-block"><?php echo session::getInstance()->getLabel('lang.text.page.admin.param.tcref.desc'); ?></span>  
    					  </div>
    					</div>
    					
    					<!-- Text input-->
    					<div class="form-group">
    					  <label class="col-md-4 control-label" for="param_poids_pellet"><?php echo session::getInstance()->getLabel('lang.text.page.admin.param.pellet'); ?></label>  
    					  <div class="col-md-3">
    					  <input id="param_poids_pellet" name="param_poids_pellet" type="text" placeholder="ex : 150" class="form-control input-md" required=""  value="<?php echo POIDS_PELLET_PAR_MINUTE; ?>">
    					  <span class="help-block"><?php echo session::getInstance()->getLabel('lang.text.page.admin.param.pellet.desc'); ?></span>  
    					  </div>
    					</div>
    					
    					<!-- Text input-->
    					<div class="form-group">
    					  <label class="col-md-4 control-label" for="parap_poids_pellet"><?php echo session::getInstance()->getLabel('lang.text.page.admin.param.surface'); ?></label>  
    					  <div class="col-md-3">
    					  <input id="surface_maison" name="param_surface" type="text" placeholder="ex : 180" class="form-control input-md" required=""  value="<?php echo SURFACE_HOUSE; ?>">
    					  <span class="help-block"><?php echo session::getInstance()->getLabel('lang.text.page.admin.param.surface.desc'); ?></span>  
    					  </div>
    					</div>
				
				    </fieldset>
    			

                    <fieldset>
    				
    				<!-- Form Name -->
    					<legend><?php echo session::getInstance()->getLabel('lang.text.page.admin.silo'); ?></legend>
    					
    					<!-- Select Basic -->
    					<div class="form-group">
    					  <label class="col-md-4 control-label" for="oko_loadingmode"><?php echo session::getInstance()->getLabel('lang.text.page.admin.loading_mode'); ?></label>
    					  <div class="col-md-3">
    					    <select id="oko_loadingmode" name="oko_loadingmode" class="form-control">
    					        <option value="0"><?php echo session::getInstance()->getLabel('lang.text.page.admin.loading_mode_bags'); ?></option>
    			                <option value="1" <?php if (HAS_SILO) {
                                    echo 'selected=selected';
                                } ?> ><?php echo session::getInstance()->getLabel('lang.text.page.admin.loading_mode_silo'); ?></option>
    					    </select>
    					  </div>
    					 
    					</div>
    					
                        <!-- Text input-->
                        <div class="form-group" id="form-silo-details" <?php if (!HAS_SILO) {
                                    echo 'style="display: none;"';
                                } ?>>
                            <label class="col-md-4 control-label" for="oko_silo_size"><?php echo session::getInstance()->getLabel('lang.text.page.admin.silo_size'); ?></label>  
                            <div class="col-md-3">
                                <input id="oko_silo_size" name="oko_silo_size" type="text" class="form-control input-md" placeholder="ex : 3500" value="<?php echo SILO_SIZE; ?>">
                            </div>
    					</div>
    				
    				    <!-- Text input-->
    					<div class="form-group">
    					  <label class="col-md-4 control-label" for="oko_ashtray"><?php echo session::getInstance()->getLabel('lang.text.page.admin.param.ashtray'); ?></label>  
    					  <div class="col-md-3">
    					  <input id="oko_ashtray" name="oko_ashtray" type="text" placeholder="ex : 1000" class="form-control input-md" required=""  value="<?php echo ASHTRAY; ?>">
    					  <span class="help-block"><?php echo session::getInstance()->getLabel('lang.text.page.admin.param.ashtray.desc'); ?></span>  
    					  </div>
    					</div>
					</fieldset> 
					
					<fieldset>
    				
    				<!-- Form Name -->
    					<legend><?php echo session::getInstance()->getLabel('lang.text.page.admin.language'); ?></legend>
    					
    					<!-- Select Basic -->
    					<div class="form-group">
    					  <label class="col-md-4 control-label" for="oko_language"><?php echo session::getInstance()->getLabel('lang.text.page.admin.language.choice'); ?></label>
    					  <div class="col-md-3">
							<label class="radio-inline"><input id="lang_en" type="radio" value="en" name="oko_language" <?php if ('en' == session::getInstance()->getLang()) {
                                    echo 'checked';
                                } ?>><img src="css/images/en-flag.png"></label>
							<label class="radio-inline"><input id="lang_fr" type="radio" value="fr" name="oko_language"<?php if ('fr' == session::getInstance()->getLang()) {
                                    echo 'checked';
                                } ?>><img src="css/images/fr-flag.png"></label>  
    					  </div>
    					 
    					</div>
    					
    				</fieldset> 
                    
                    
    			</form>
                <div  align="center">
					    <button id="bt_save_infoge" name="bt_save_infoge" class="btn btn-primary" type="button"><?php echo session::getInstance()->getLabel('lang.text.page.admin.save'); ?></button>
				</div>
            </div>
            
            
            


<?php
include __DIR__.'/_templates/footer.php';
?>
    <!--script src="js/jquery.fileupload.js"></script-->
	<script src="js/adminParam.js"></script>
    </body>
</html>
