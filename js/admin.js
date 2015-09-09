/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/
/* global lang */

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
        
        
        //if(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test($('#oko_ip').val())){
            
            var ip = $('#oko_ip').val();
            
            //$.getJSON("ajax.php?type=admin&action=testIp&ip=" + ip , function(json) {
			$.api('GET','admin.testIp',{ip: ip} ).done(function(json){ 
				
				if (json.response) {
				    $('#url_csv').html("");
					$.growlValidate(lang.valid.communication);
					$('#url_csv').append('<a target="_blank" href="' + json.url +'">'+ lang.text.seeFileOnboiler +'</a>');
				} else {
					$.growlWarning(lang.error.ipNotPing);
				}
			});	
            
        /*    
        }else{
            $.growlErreur('Adresse Ip Invalide !');
        }
        */
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
				/*
				$.ajax({
					url: 'ajax.php?type=admin&action=saveInfoGe',
					type: 'POST',
					data: $.param(tab),
					async: false,
					success: function(a) {
						*/
		$.api('POST','admin.saveInfoGe',tab, false ).done(function(json){ 		
		    //console.log(a);
		    if (json.response) {
			    $.growlValidate(lang.valid.configSave);
			} else {
				$.growlWarning(lang.error.configNotSave);
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
    	
    	//$.getJSON("ajax.php?type=admin&action=getHeaderFromOkoCsv" , function(json) {
		$.api('GET','admin.getHeaderFromOkoCsv').done(function(json){ 
			
			if (json.response) {
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
				$.growlWarning(lang.error.csvNotFound);
			}
		});	
    	
    }
    


	/*
    * Espace saison
    */

	function refreshSaison(){
		//$.getJSON("ajax.php?type=admin&action=getSaisons" , function(json) {
		$.api('GET','admin.getSaisons').done(function(json){
			
			
			if (json.response) {
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
				$.growlWarning(lang.error.getSeasons);
			}
		});	
	}
	
	function initModalAddSaison(){
		$('#modal_saison').on('show.bs.modal', function() {

			$(this).find('#typeModal').val("add");
			$(this).find('.modal-title').html(lang.text.addSeason);
			$(this).find('#startDateSaison').val("");
		});
	}
	
	function addSaison(){
		
		if($.validateDate($('#modal_saison').find('#startDateSaison').val())){
			try{
				var date = $.datepicker.parseDate('dd/mm/yy', $('#modal_saison').find('#startDateSaison').val() );
			}catch(error){
        		$.growlWarning(lang.error.date);
        		return;
			}
			
			var tab = {
				startDate : $.datepicker.formatDate('yy-mm-dd', date ) //;
				};
			//console.log(tab.position);
			//test si la saison existe deja n'est pas déja utilisé
			//$.getJSON("ajax.php?type=admin&action=existSaison&date=" + tab.startDate, function(json) {
			$.api('GET','admin.existSaison',{date: tab.startDate}).done(function(json){
				
				//console.log(json);
				if (!json.response) {
					//saison n'existe pas, on enregistre
					/*
					$.ajax({
						url: 'ajax.php?type=admin&action=setSaison',
						type: 'POST',
						data: $.param(tab),
						async: false,
						success: function(a) {
							*/
					$.api('POST','admin.setSaison',tab, false).done(function(json){
						
						$('#modal_saison').modal('hide');
						if (json.response) {
							$.growlValidate(lang.valid.save);
							setTimeout(refreshSaison(),1000);
						} else {
							$.growlErreur(lang.error.saveSeason);
						}
					});
	
	
				} else {
					$.growlWarning(lang.error.seasonAlreadyExist);
				}
			});
		}else{
			$.growlWarning(lang.error.date);
		}
		
	}
	
	function updateSaison(){
		if($.validateDate($('#modal_saison').find('#startDateSaison').val())){
			try{
				var date = $.datepicker.parseDate('dd/mm/yy', $('#modal_saison').find('#startDateSaison').val() );
			}catch(error){
        		//alert(error);
        		$.growlWarning(lang.error.date);
        		return;
			}	
			var tab = {
				startDate 	: $.datepicker.formatDate('yy-mm-dd', date ),
				idSaison	: $('#modal_saison').find('#saisonId').val()
				};
			//test si la saison existe deja n'est pas déja utilisé
			//$.getJSON("ajax.php?type=admin&action=existSaison&date=" + tab.startDate, function(json) {
			$.api('GET','admin.existSaison',{date: tab.startDate}).done(function(json){
				
				//console.log(json);
				if (!json.response) {
					//saison n'existe pas, on enregistre
					/*
					$.ajax({
						url: 'ajax.php?type=admin&action=updateSaison',
						type: 'POST',
						data: $.param(tab),
						async: false,
						success: function(a) {
							*/
					$.api('POST','admin.updateSaison',tab, false).done(function(json){
						
						$('#modal_saison').modal('hide');
						
						if (json.response) {
							$.growlValidate(lang.valid.update);
							setTimeout(refreshSaison(),1000);
						} else {
							$.growlErreur(lang.error.update);
						}
	
						
					});
	
	
				} else {
					$.growlWarning(lang.error.seasonAlreadyExist);
				}
			});
		}else{
			$.growlWarning(lang.error.date);
		}	
	}
	
	function deleteSaison(){
		
		var tab = {
			idSaison: $('#confirm-delete').find('#saisonId').val()
		};
		/*
		$.ajax({
			url: 'ajax.php?type=admin&action=deleteSaison',
			type: 'POST',
			data: $.param(tab),
			async: false,
			success: function(a) {
		*/
		$.api('POST','admin.deleteSaison',tab, false).done(function(json){
				
			$('#confirm-delete').modal('hide');
			if (json.response) {
				$.growlValidate(lang.valid.delete);
				setTimeout(refreshSaison(), 1000);
			} else {
				$.growlErreur(lang.error.deleteSeason);
			}
		});
	}
	
	function initModalEditSaison(row){
		var startDate 	= row.find("td:nth-child(2)").text();
		var saison 		= row.find("td:nth-child(1)").text();
		var id			= row.attr("id");
		
		$('#modal_saison').on('show.bs.modal', function() {
			
			$(this).find('#typeModal').val("edit");
			$(this).find('#startDateSaison').val(startDate);
			$(this).find('.modal-title').html(lang.text.updateSeason +" : "+saison);
			$(this).find('#saisonId').val(id);
		});
		//$.datepicker.formatDate('yy-mm-dd',$.datepicker.parseDate('dd/mm/yy', $( "#date_encours" ).val()));
		
	}
	
	function confirmDeleteSaison(row){
		var saison 	= row.find("td:nth-child(1)").text();
		var id		= row.attr("id");
		
		$('#confirm-delete').on('show.bs.modal', function() {
			$(this).find('.modal-title').html(lang.text.deleteSeason+" : "+saison);
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
			    updateSaison();
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