$(document).ready(function() {
    
    function getFileFromChaudiere(){
         $.getJSON("ajax.php?type=admin&action=getFileFromChaudiere" , function(json) {
			
				if (json.response === true) {
				    //console.log(json);
					//$.growlValidate("Communication établie");
					//$('#url_csv').append('<a target="_blank" href="http://'+ ip +'/logfiles/pelletronic/"> Visualiser les fichiers sur la chaudiere </a>');
					$("#listeFichierFromChaudiere> tbody").html("");
					
					$.each(json.listefiles, function(key, val) {
					    //console.log(val.file);
					    //$('#select_graphe').append('<option value="' + val.id + '">' + val.name + '</option>');
					   $('#listeFichierFromChaudiere > tbody:last').append('<tr> \
					                                                            <td> <a target="_blank" href="' + val.url + '">'+val.file+'</a></td>\
					                                                            <td>  <button type="button" class="btn btn-primary" ><span class="glyphicon glyphicon-cloud-download" aria-hidden="true"></span></button></td> \
					                                                       </tr>');
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
    })
    
    getFileFromChaudiere();
    
    
    
    $("body").on("click", ".btn", function() {
        //console.log($(this));
       // var icon = $(this).find('span');
        $(this).find('span').switchClass('glyphicon-cloud-download','glyphicon-refresh glyphicon-spin' ,0);
        //console.log($(this).closest("tr").find("td:nth-child(1)").children('a').attr('href'));
        
        var tab = {
					url : $(this).closest("tr").find("td:nth-child(1)").children('a').attr('href')
				};
				
		$.ajax({
			url: 'ajax.php?type=admin&action=importFileFromChaudiere',
			type: 'POST',
			data: $.param(tab),
			async: true,
		    success: function(a) {
			    console.log("success :"+a);
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
    
});