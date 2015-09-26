/*****************************************************
 * Projet : Okovision - Supervision chaudiere OeKofen
 * Auteur : Stawen Dronek
 * Utilisation commerciale interdite sans mon accord
 ******************************************************/
/* global lang */
$(document).ready(function() {
   
   function listFile(){
       $.api('GET', 'admin.getFileFromTmp').done(function(json) {
           //console.log(json);
           	$.each(json, function(key, val) {
    					$('#listeFichierImport > tbody:last').append('<tr class="fichier"> \
    					                                       <td>' + val + '</td>\
    					                                       <td> </td> \
    					                                   </tr>');
    					
    				});
       });
   }
   
   listFile();
   
   $("#bt_import").click(function() {
        $("#inwork-makeupdate").show();
        $("#bt_import").hide();
        
        var file = [];
		$('.fichier').each(function() {
			file.push($(this));
		});
        
 
        setTimeout(function(){
            $.each(file, function(key, f) {
                //console.log(f.find("td:nth-child(1)").text());
                setTimeout(function(){
              		$.api('GET', 'admin.importFileFromTmp',{file: $(this).find("td:nth-child(1)").text()}, false).done(function() {
              		});
              		console.log(f);
                    f.remove();  
                },1000);
            			    
        	});
        
		
    		//$("#listeFichierImport> tbody").html("");
    		//listFile();
            $("#inwork-makeupdate").hide();
            $("#bt_import").show();
            $.growlValidate(lang.valid.csvImport)
        },500);
   });
   
    
});    