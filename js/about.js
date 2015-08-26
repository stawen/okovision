/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/
$(document).ready(function() {

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
    
    $("#bt_update").click(function(){
        
    });
    
    
});