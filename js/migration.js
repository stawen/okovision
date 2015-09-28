/*****************************************************
 * Projet : Okovision - Supervision chaudiere OeKofen
 * Auteur : Stawen Dronek
 * Utilisation commerciale interdite sans mon accord
 ******************************************************/
/* global lang */
$(document).ready(function() {
   
   function listDate(){
       $.api('GET', 'admin.getDateForMigrate').done(function(json) {
            //console.log(json);
           	$.each(json, function(key, val) {
    					$('#listeDateMigrate > tbody:last').append('<tr class="day"> \
    					                                       <td>' + val.jour + '</td>\
    					                                       <td> </td> \
    					                                   </tr>');
    					
    				});
    	    $("#inwork-getDate").hide();			
       });
   }
   
   listDate();
   
   $("#bt_migrate").click(function() {
        $("#inwork-makemigration").show();
        $("#bt_migrate").hide();
        
		migrate();
    	
   });
   
   
   function migrate(){
       
        var row = $('.day').first()
        //console.log(row);
        var jour = row.find("td:nth-child(1)").text()
        //console.log(file);
        
        if (jour !== '' ){
        
            setTimeout(function(){
                $.api('GET', 'admin.migrateDataForDate',{jour: jour}, false).done(function() {});
                row.remove(); 
                migrate();
            },500);
            
        }else{
            $("#inwork-makemigration").hide();
            $("#bt_migrate").show();
            //$('#listeDateMigrate > tbody').html('');
            //listDate();
            $.growlValidate('Migration terminée');
        }
       
       
   }
    
});    