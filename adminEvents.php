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
         <h2><?php echo session::getInstance()->getLabel('lang.text.menu.admin.events'); ?></h2>
    </div>    
       
	<?php echo session::getInstance()->getLabel('lang.text.page.events'); ?>
	
	<br/><br/>
	<button type="button" class="btn btn-xs btn-default" id="openModalAddEvent" data-toggle="modal" data-target="#modal_event">
        <span class="glyphicon glyphicon-plus" aria-hidden="true"></span> <?php echo session::getInstance()->getLabel('lang.text.page.events.add'); ?>
    </button>
    <table id="events" class="table table-hover">
        <thead>
            <tr >
                <th class="col-md-3"><?php echo session::getInstance()->getLabel('lang.text.page.events.title'); ?></th>
                <th class="col-md-3"><?php echo session::getInstance()->getLabel('lang.text.page.events.date'); ?></th>
                <th class="col-md-3"><?php echo session::getInstance()->getLabel('lang.text.page.events.detail'); ?></th>
                <th class="col-md-3"></th>
                
            </tr>
        </thead>
    
        <tbody>
        </tbody>

    </table>
    
    <div class="modal fade" id="modal_event" tabindex="-1" role="dialog" aria-labelledby="eventsLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                    <h4 class="modal-title" id="EventTitle"></h4>
                </div>
                <div class="modal-body">
                    <div class="hidden">
                        <input type="text" id="eventId">
                        <input type="text" id="typeModal">
                    </div>
                    <form id="event-modal-form">

                        <div class="form-group">
                            <label for="event_type" class="control-label"><?php echo session::getInstance()->getLabel('lang.text.page.events.modal.type'); ?></label>
                            <select id="event_type" name="event_type" class="form-control">
    					        <option value="PELLET"><?php echo session::getInstance()->getLabel('lang.text.page.events.modal.pellets'); ?></option>
    			                <option value="ASHES"><?php echo session::getInstance()->getLabel('lang.text.page.events.modal.ashes'); ?></option>
                                <option value="MAINT"><?php echo session::getInstance()->getLabel('lang.text.page.events.modal.maintenance'); ?></option>
                                <option value="SWEEP"><?php echo session::getInstance()->getLabel('lang.text.page.events.modal.chimney_sweeping'); ?></option>
                                <option value="BAG"><?php echo session::getInstance()->getLabel('lang.text.page.events.modal.bag'); ?></option>
    					    </select>

                            <label for="event_date" class="control-label"><?php echo session::getInstance()->getLabel('lang.text.page.events.modal.date'); ?></label>
                            <input type="text" class="form-control datepicker" name="event_date" id="event_date" placeholder="ex : 01/09/2014" value="<?php echo date('d/m/Y'); ?>">

                            <div id="form-event-quantity">
                              <label for="quantity" class="control-label"><?php echo session::getInstance()->getLabel('lang.text.page.events.modal.quantity'); ?></label>
                              <input type="text" class="form-control" name="quantity" id="quantity" placeholder="ex : 3000">
                            </div>
                            
                             <div id="form-event-remaining">
                              <label for="quantity" class="control-label"><?php echo session::getInstance()->getLabel('lang.text.page.events.modal.remaining'); ?></label>
                              <input type="text" class="form-control" name="remaining" id="remaining" placeholder="ex : 200">
                            </div>
                            
                            <div id="form-event-price">
                              <label for="price" class="control-label"><?php echo session::getInstance()->getLabel('lang.text.page.events.modal.price'); ?></label>
                              <input type="text" class="form-control" name="price" id="price" placeholder="ex : 2000">
                           </div>
                            
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
    
    
    <div class="modal fade" id="confirm-delete" tabindex="-1" role="dialog" aria-labelledby="deleteEvent" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span>
                    </button>
                    <h4 class="modal-title" id="deleteTitre"></h4>
                </div>
                <div class="hidden">
                    <input type="text" id="eventId">
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
	<script src="_langs/<?php echo session::getInstance()->getLang(); ?>.datepicker.js"></script>
	<script src="js/adminEvents.js"></script>
    </body>
</html>
