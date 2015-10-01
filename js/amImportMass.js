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
        
		importFile();
    	
   });
   
   
   function importFile(){
       
        var row = $('.fichier').first()
        //console.log(row);
        var file = row.find("td:nth-child(1)").text()
        //console.log(file);
        
        if (file !== '' ){
        
            setTimeout(function(){
                $.api('GET', 'admin.importFileFromTmp',{file: file}, false).done(function() {});
                row.remove(); 
                importFile();
            },500);
            
        }else{
            $("#inwork-makeupdate").hide();
            $("#bt_import").show();
            $('#listeFichierImport > tbody').html('');
            listFile();
            $.growlValidate(lang.valid.csvImport)
        }
       
       
   }
    
});    