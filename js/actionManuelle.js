/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/
$(document).ready(function() {
    
    /*
    * Gestion import par http
    */ 
    function getFileFromChaudiere(){
         $.getJSON("ajax.php?type=admin&action=getFileFromChaudiere" , function(json) {
			
				if (json.response === true) {
				    //console.log(json);
					//$.growlValidate("Communication établie");
					//$('#url_csv').append('<a target="_blank" href="http://'+ ip +'/logfiles/pelletronic/"> Visualiser les fichiers sur la chaudiere </a>');
					$("#listeFichierFromChaudiere> tbody").html("");
					var i =0;
					$.each(json.listefiles, function(key, val) {
					    //console.log(val.file);
					    //$('#select_graphe').append('<option value="' + val.id + '">' + val.name + '</option>');
					   $('#listeFichierFromChaudiere > tbody:last').append('<tr> \
					                                                            <td> <a target="_blank" href="' + val.url + '">'+val.file+'</a></td>\
					                                                            <td>  <button type="button" id="fichiercsv_"'+i+' class="btn btn-primary" ><span class="glyphicon glyphicon-cloud-download" aria-hidden="true"></span></button></td> \
					                                                       </tr>');
					    i++;                                               
					});
					
					
				} else {
					$.growlWarning("Impossible de recuperer les fichiers présents sur la chaudiere");
				}
			})
			.error(function() { 
				$.growlErreur('Error  - Probleme de communication !');
			});	
    }
    
    $('a[aria-controls="majip"]').on('shown.bs.tab', function (e) {
        getFileFromChaudiere();
    });
    
   
    
    
    
    $("body").on("click", "[id^='fichiercsv']:button", function() {
        
        $(this).find('span').switchClass('glyphicon-cloud-download','glyphicon-refresh glyphicon-spin' ,0);
        
        var tab = {
					url : $(this).closest("tr").find("td:nth-child(1)").children('a').attr('href')
				};
				
		$.ajax({
			url: 'ajax.php?type=admin&action=importFileFromChaudiere',
			type: 'POST',
			data: $.param(tab),
			async: true,
		    success: function(a) {
			    //console.log("success :"+a);
			    if (a.response === true) {
				    $.growlValidate("Importation réussi de " + $(this).closest("tr").find("td:nth-child(1)").text() );
				   
				} else {
					$.growlWarning("Echec de l'importation");
				}
		    },
            error: function () {
                $.growlErreur('Error  - Probleme de communication !');
            },
            always: function(){
                $(this).find('span').switchClass('glyphicon-refresh glyphicon-spin', 'glyphicon-cloud-download',0);
            }
            
        });
        
		
    });
    
    /*
    * Gestion import via USB
    */ 
    
    
    $('a[aria-controls="majusb"]').on('shown.bs.tab', function (e) {
       //console.log($.matriceComplet());
       	$('#bar').css('width','0%');
       
       	$('#selectFile').show();
       	$('#inwork').hide();
		$('#complete').hide();
    });
    //getFileFromChaudiere();
    
    $('#fileupload').fileupload({
    	
    	url: 'ajax.php?type=admin&action=uploadCsv',
        dataType: 'json',
        autoUpload: true,
        acceptFileTypes: /(\.|\/)(csv)$/i,
        maxFileSize: 3000000,
        formData: {actionFile: 'majusb'},
        start: function (e) {
    		//console.log('Uploads started');
		},
        done: function (e, data) {
        	//console.log("e:"+e);
        	//console.log("data:"+ data);
        
        	setTimeout(function() {
        		importcsv();
           	
        	}, 1000);
        	
        	
           	
        },
        progress: function (e, data) {
        	var progress = parseInt(data.loaded / data.total * 100, 10);
        	//console.log('ici::'+ progress);
        	$('#bar').css(
	            'width',
            	progress + '%'
        	);
    	}
    });
    
    
    function importcsv(){
        $('#selectFile').hide();
        $('#inwork').show();
        
        $.getJSON("ajax.php?type=admin&action=importcsv" , function(json) {
			
				if (json.response === true) {
				    $('#inwork').hide();
				    $('#complete').show();
				}else {
					$.growlWarning("Echec de l'importation");
				}
        })
        .error(function() { 
				$.growlErreur('Error  - Probleme de communication !');
		});
    }
    
});