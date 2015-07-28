/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/
$(document).ready(function() {
    
    /*
    * Espace Information general
    */
    
    $("#oko_typeconnect").change(function(){
	    
	    if ($(this).val() == 1 ){
	        $("#form-ip").show();
	    }else{
	        $("#form-ip").hide();
	    }
	});
    
    $('#test_oko_ip').click(function(){
        
        
        if(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test($('#oko_ip').val())){
            
            var ip = $('#oko_ip').val();
            
            $.getJSON("ajax.php?type=admin&action=testIp&ip=" + ip , function(json) {
			
				if (json.response === true) {
				    $('#url_csv').html("");
					$.growlValidate("Communication établie");
					$('#url_csv').append('<a target="_blank" href="' + json.url +'"> Visualiser les fichiers sur la chaudiere </a>');
				} else {
					$.growlWarning("L'adresse Ip ne repond pas");
				}
			})
			.error(function() { 
				$.growlErreur('Error  - Probleme de communication !');
			});	
            
            
        }else{
            $.growlErreur('Adresse Ip Invalide !');
        }
    });
    
    $('#bt_save_infoge').click(function(){
        
        var tab = {
					oko_ip : $('#oko_ip').val(),
					param_tcref : $('#param_tcref').val(),
					param_poids_pellet : $('#param_poids_pellet').val(),
					surface_maison : $('#surface_maison').val(),
					oko_typeconnect : $('#oko_typeconnect').val(),
					send_to_web: 0
				};
				
				$.ajax({
					url: 'ajax.php?type=admin&action=saveInfoGe',
					type: 'POST',
					data: $.param(tab),
					async: false,
					success: function(a) {
					    console.log(a);
					    if (a.response === true) {
        				    $.growlValidate("Configuration sauvegardée");
        				} else {
        					$.growlWarning("Configuration non sauvegardée");
        				}
					},
                    error: function () {
                        $.growlErreur('Error  - Probleme lors de la sauvegarde !');
                      }
				});
        
    });
    
    /*
    * Espace Matrice CSV
    */
    
    $('#fileupload').fileupload({
    	
    	url: 'ajax.php?type=admin&action=uploadCsv',
        dataType: 'json',
        autoUpload: true,
        acceptFileTypes: /(\.|\/)(csv)$/i,
        maxFileSize: 3000000,
        formData: {actionFile: 'matrice'},
        start: function (e) {
    		//console.log('Uploads started');
		},
        done: function (e, data) {
        	//console.log("e:"+e);
        	//console.log("data:"+ data);
        	setTimeout(function() {
        		$("#selectFile").hide();
           		makeMatrice();
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
    
    function makeMatrice(){
    	
    	$.getJSON("ajax.php?type=admin&action=getHeaderFromOkoCsv" , function(json) {
			
				if (json.response === true) {
				    $("#headerCsv > tbody").html("");
					
					$.each(json.data, function(key, val) {
					    //console.log(val);
					    //$('#select_graphe').append('<option value="' + val.id + '">' + val.name + '</option>');
					   $('#headerCsv > tbody:last').append('<tr> \
					                                        	<td>'+ val.original_name +'</td>\
					                                        	<td>'+ val.name +'</td>\
					                                        	<td>'+ ((val.type!="")?'<span class="glyphicon glyphicon-lock" aria-hidden="true"></span>':'') +'</td>\
					                                        </tr>');
					});
				
					
					$("#concordance").show();
					
				} else {
					$.growlWarning("Le fichier CSV de reference n'est pas trouvé.");
				}
			})
			.error(function() { 
				$.growlErreur('Error  - Probleme de communication !');
			});	
    	
    }
    

	
	
	//console.log("matriceComplet::"+$.matriceComplet());
	
	
	
	
	
	/*
    * Espace saison
    */

	function refreshSaison(){
		$.getJSON("ajax.php?type=admin&action=getSaisons" , function(json) {
			
				if (json.response === true) {
				    $("#saisons > tbody").html("");
					
					$.each(json.data, function(key, val) {
					    //console.log(val);
					    //$('#select_graphe').append('<option value="' + val.id + '">' + val.name + '</option>');
					   $('#saisons > tbody:last').append('<tr id='+ val.id +'> \
					   											<td>'+ val.saison +'</td>\
					                                        	<td>'+ val.date_debut +'</td>\
					                                        	<td>'+ val.date_fin +'</td>\
					                                        	<td> \
					                                        		<button type="button" class="btn btn-default btn-sm" data-toggle="modal" data-target="#modal_saison"> \
                                                                    	<span class="glyphicon glyphicon-edit" aria-hidden="true"></span> \
                                                                    </button> \
                                                                    <button type="button" class="btn btn-default btn-sm" data-toggle="modal" data-target="#confirm-delete"> \
                                                                    	<span class="glyphicon glyphicon-trash" aria-hidden="true"></span> \
                                                                    </button> \
					                                        	</td>\
					                                        </tr>');
					});
				
					
				} else {
					$.growlWarning("Probleme lors de la recuperation des saisons");
				}
			})
			.error(function() { 
				$.growlErreur('Error  - Probleme de communication !');
			});	
	}
	
	function initModalAddSaison(){
		$('#modal_saison').on('show.bs.modal', function() {

			$(this).find('#typeModal').val("add");
			$(this).find('.modal-title').html("Ajout d'une saison ");
			$(this).find('#startDateSaison').val("");
		});
	}
	
	function addSaison(){
		var tab = {
			startDate : $.datepicker.formatDate('yy-mm-dd',$.datepicker.parseDate('dd/mm/yy', $('#modal_saison').find('#startDateSaison').val() ) ), //;
			};
		//console.log(tab.position);
		//test si la saison existe deja n'est pas déja utilisé
		$.getJSON("ajax.php?type=admin&action=existSaison&date=" + tab.startDate, function(json) {
			//console.log(json);
			if (!json.response) {
				//saison n'existe pas, on enregistre
				$.ajax({
					url: 'ajax.php?type=admin&action=setSaison',
					type: 'POST',
					data: $.param(tab),
					async: false,
					success: function(a) {

						$('#modal_saison').modal('hide');
						if (a.response === true) {
							$.growlValidate("Enregistrement OK");
							setTimeout(refreshSaison(),1000);
						} else {
							$.growlErreur("Probleme lors de l'enregistrement de la saison");
						}

					}
				});


			} else {
				$.growlWarning("Attention, cette saison existe déjà !");
			}
		});
	}
	
	function deleteSaison(){
		
		var tab = {
			idSaison: $('#confirm-delete').find('#saisonId').val()
		};
		$.ajax({
			url: 'ajax.php?type=admin&action=deleteSaison',
			type: 'POST',
			data: $.param(tab),
			async: false,
			success: function(a) {

				$('#confirm-delete').modal('hide');
				if (a.response) {
					$.growlValidate("Suppression réussie");
					setTimeout(refreshSaison(), 1000);
				} else {
					$.growlErreur("Probleme lors de la suppresion de la saison");
				}

			}
		});
		
		
	}
	
	function initModalEditSaison(row){
		var startDate 	= row.find("td:nth-child(2)").text();
		var saison 		= row.find("td:nth-child(1)").text();
		
		$('#modal_saison').on('show.bs.modal', function() {
			
			$(this).find('#typeModal').val("edit");
			$(this).find('#startDateSaison').val(startDate);
			$(this).find('.modal-title').html("Modification saison : "+saison);
		});
		//$.datepicker.formatDate('yy-mm-dd',$.datepicker.parseDate('dd/mm/yy', $( "#date_encours" ).val()));
		
	}
	
	function confirmDeleteSaison(row){
		var saison 	= row.find("td:nth-child(1)").text();
		var id		= row.attr("id");
		
		$('#confirm-delete').on('show.bs.modal', function() {
			$(this).find('.modal-title').html("Confirmez-vous la suppression de la saison : "+saison);
			$(this).find('#saisonId').val(id);
		});
		
	}
	
	
	
	//obligé d'utiliser "on()" car les boutons sont ajoutés apres le chargement de la page
	$("body").on("click", ".btn", function() {

		if ($(this).children().is(".glyphicon-edit")) {
			initModalEditSaison($(this).closest("tr"));
			
		}
		if ($(this).children().is(".glyphicon-trash")) {
			confirmDeleteSaison($(this).closest("tr"))
		}
		if ($(this).children().is(".glyphicon-plus")) {
			initModalAddSaison();
		}
		
		if ($(this).is("#confirm")) {
		    //console.log($("#modal_action").find('#typeModal').val());
			if( $("#modal_saison").find('#typeModal').val() == "add"){
			    addSaison();
			}
			if( $("#modal_saison").find('#typeModal').val() == "edit"){
			    //console.log('update');
			    //updateSaison();
			}
		}
		if ($(this).is('#deleteConfirm') ) {
		        deleteSaison();
		}
		
	});
	
	
	
	if ($.matriceComplet()){
		makeMatrice();
		refreshSaison();
	}else{
		$("#selectFile").show();
		$("#concordance").hide();
	}
	
    
});