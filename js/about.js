/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/
$(document).ready(function() {
    
    function checkUpdate() {
        $.getJSON("ajax.php?type=admin&action=checkUpdate" , function(json) {
            $("#inwork-checkupdate").hide();
            
            if (json.newVersion) {
                $.each(json.list, function(key, val) {
                    //console.log(val);
                    $('#informations').append(
                        '<div class="panel panel-default"> \
    				        <div class="panel-heading">'+val.version+'</div> \
    				        <div class="panel-body"> \
    				            '+val.changelog+' \
    				        </div> \
    				    </div>'
                        );
                    $("#bt_update").show();
                });
                
            }else{
                $('#informations').append(json.information);
            }
        });
    }
    
    $("#bt_update").click(function(){
        //console.log('ici');
        $('#informations').html("");
        $("#inwork-makeupdate").show();
        
        $.getJSON("ajax.php?type=admin&action=makeUpdate" , function(json) {
            $("#inwork-makeupdate").hide();
            
            if (json.install) {
                $.growlValidate("Mise à jour réalisée avec succès !");
                
            }else{
                $('#informations').append(json.information);
                $.growlErreur("Echec de la mise à jour.");
            }
            checkUpdate();
        });
    });
    
    checkUpdate();
    
});