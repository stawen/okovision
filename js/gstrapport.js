/*****************************************************
* Projet : Okovision - Supervision chaudiere OeKofen
* Auteur : Stawen Dronek
* Utilisation commerciale interdite sans mon accord
******************************************************/
/* global lang */
$(document).ready(function() {

    function initModalAddGraphe() {
        $('#modal_graphique').on('show.bs.modal', function() {
            $(this).find('#name').val("");
            $(this).find('#typeModal').val("add");
            $(this).find('#graphiqueTitre').html(lang.text.addGraphe);

            //$.getJSON("ajax.php?type=graphique&action=getLastGraphePosition", function(json) {
            $.api('GET','graphique.getLastGraphePosition').done(function(json){

                    var newPosition = (json.data.lastPosition === null) ? 1 : parseInt(json.data.lastPosition) + 1;
                    $('#modal_graphique').find('#position').val(newPosition);

                }).error(function() {
                    $.growlErreur(lang.error.position);
                });

        });
    }

    function initModalUpdateGraphe(row) {
        $('#modal_graphique').on('show.bs.modal', function() {

            var name = row.find("td:nth-child(2)").text();
            $(this).find('#name').val(name);
            $(this).find('#typeModal').val("edit");
            $(this).find('#grapheId').val(row.attr("id"));
            $(this).find('#graphiqueTitre').html(lang.text.updateGraphe + " " + name);
        });
    }

    function initModalDeleteGraphe(row) {
        $('#confirm-delete').on('show.bs.modal', function() {
            $(this).find('.modal-title').html(lang.text.deleteGraphe + " " + row.find("td:nth-child(2)").text() + "?");
            $(this).find('#deleteid').val(row.attr("id"));
            $(this).find('#typeModal').val('Grph');
        });
    }

    function initModalAddAsso() {
        $('#modal_asso').on('show.bs.modal', function() {

            $(this).find('#typeModal').val("add");
            $('#select_graphe option[value=' + $('#select_graphique').val() + ']').attr("selected", "selected");
            $('#select_capteur').prop("disabled", false);
            
        });
    }

    function initModalUpdateAsso(row) {
        $('#modal_asso').on('show.bs.modal', function() {

            $(this).find('#typeModal').val("edit");
            $(this).find('#assoTitre').html(lang.text.updateAsso);
            $('#select_graphe option[value=' + $('#select_graphique').val() + ']').attr("selected", "selected");
            $('#select_capteur option[value=' + row.attr("id") + ']').attr("selected", "selected");
            
            $('#select_capteur').attr('disabled', 'disabled');
            $('#coeff').val(row.find("td:nth-child(3)").text());

        });
    }

    function initModalDeleteAsso(row) {
        var name = $('#select_graphique option:selected').text() + " - " + row.find("td:nth-child(2)").text();

        $('#confirm-delete').on('show.bs.modal', function() {
            $(this).find('.modal-title').html(lang.text.deleteAsso + " " + name + "?");
            $(this).find('#deleteid').val(row.attr("id")); //id du capteur
            $(this).find('#typeModal').val('Asso');
        });
    }

    function addGraphe() {
        var tab = {
            name: $('#modal_graphique').find('#name').val(),
            position: $('#modal_graphique').find('#position').val()
        };
        //console.log(tab.position);
        //test si le groupe adrress n'est pas déja utilisé
        //$.getJSON("ajax.php?type=graphique&action=grapheNameExist&name=" + tab.name, function(json) {
        $.api('GET','graphique.grapheNameExist', {name: tab.name}).done(function(json){    
            
            //console.log(json);
            if (!json.exist) {
                //so le groupe n'existe pas, on enregistre
                /*
                $.ajax({
                    url: 'ajax.php?type=graphique&action=addGraphe',
                    type: 'POST',
                    data: $.param(tab),
                    async: true,
                    success: function(a) {
                        */
                $.api('POST','graphique.addGraphe', tab).done(function(json){          
                        //console.log(a);
                    $('#modal_graphique').modal('hide');
                    if (json.response) {
                        $.growlValidate(lang.valid.save);
                        setTimeout(refreshTableGraphe(), 1000);
                    }else {
                        $.growlErreur(lang.error.save);
                    }
                });

            }else {
                $.growlWarning(lang.error.grapehAlreadyExist);
            }
        });
    }

    function updateGraphe() {
        var tab = {
            id  :   $('#modal_graphique').find('#grapheId').val(),
            name:   $('#modal_graphique').find('#name').val()
        };
        //test si le groupe adrress n'est pas déja utilisé
        //$.getJSON("ajax.php?type=graphique&action=grapheNameExist&name=" + tab.name, function(json) {
            //console.log(json);
            //if (!json.exist) {
                //so le groupe n'existe pas, on enregistre
                /*
                $.ajax({
                    url: 'ajax.php?type=graphique&action=updateGraphe',
                    type: 'POST',
                    data: $.param(tab),
                    async: true,
                    success: function(a) {
                        */
                $.api('POST','graphique.updateGraphe', tab).done(function(json){   
                    
                    $('#modal_graphique').modal('hide');
                    if (json.response) {
                        $.growlValidate(lang.valid.update);
                        setTimeout(refreshTableGraphe(), 1000);
                    }
                    else {
                        $.growlErreur(lang.error.save);
                    }
                });


           // }
          //  else {
           //     $.growlWarning("Attention, le graphe existe déjà");
           // }
        //});
    }

    function deleteGraphe() {
        var tab = {
            id: $('#confirm-delete').find('#deleteid').val()
        };
        /*
        $.ajax({
            url: 'ajax.php?type=graphique&action=deleteGraphe',
            type: 'POST',
            data: $.param(tab),
            async: true,
            success: function(a) {
            */
        $.api('POST','graphique.deleteGraphe', tab).done(function(json){ 
            
            $('#confirm-delete').modal('hide');
            if (json.response === true) {
                $.growlValidate(lang.valid.delete);
                setTimeout(refreshTableGraphe(), 1000);
            }else {
                $.growlErreur(lang.error.deleteGraphe + " " + tab.name);
            }
        });
    }

    function addAsso() {
        var tab = {
            id_graphe: $('#modal_asso').find('#select_graphe').val(),
            id_capteur: $('#modal_asso').find('#select_capteur').val(),
            position : 1,
            coeff   : $('#modal_asso').find('#coeff').val()
            
        };
        //console.log(tab.position);
        //test si le groupe adrress n'est pas déja utilisé
        //$.getJSON("ajax.php?type=graphique&action=grapheAssoCapteurExist&graphe=" + tab.id_graphe + "&capteur=" + tab.id_capteur, function(json) {
        $.api('GET','graphique.grapheAssoCapteurExist', {graphe: tab.id_graphe, capteur: tab.id_capteur}).done(function(json){     
            //console.log(json);
            if (!json.exist) {
                //so l'asso n'existe pas, on enregistre
                /*
                $.ajax({
                    url: 'ajax.php?type=graphique&action=addGrapheAsso',
                    type: 'POST',
                    data: $.param(tab),
                    async: true,
                    success: function(a) {
                        */
                $.api('POST','graphique.addGrapheAsso',tab).done(function(json){  
                    
                    $('#modal_asso').modal('hide');
                    if (json.response) {
                        $.growlValidate(lang.valid.save);
                        setTimeout(refreshTableAsso(), 1000);
                    }else {
                        $.growlErreur(lang.error.save);
                    }
                });
            
                
            }else {
                $.growlWarning(lang.error.assoAlreadyExist);
            }
        });
    }

    function updateAsso() {
        var tab = {
            id_graphe: $('#modal_asso').find('#select_graphe').val(),
            id_capteur: $('#modal_asso').find('#select_capteur').val(),
            coeff   : $('#modal_asso').find('#coeff').val()
        };
        if(! $.isNumeric(tab.coeff)){
            $.growlErreur(lang.error.coeffMustBeNumber);
            return;
        }
        /*
        $.ajax({
            url: 'ajax.php?type=graphique&action=updateGrapheAsso',
            type: 'POST',
            data: $.param(tab),
            async: true,
            success: function(a) {
                */
        $.api('POST','graphique.updateGrapheAsso',tab).done(function(json){ 
            
            $('#modal_asso').modal('hide');
            if (json.response) {
                $.growlValidate(lang.valid.update);
                setTimeout(refreshTableAsso(), 1000);
            }
            else {
                $.growlErreur(lang.error.update);
            }
    
        });
    }

    function deleteAssoGraphe() {
        var tab = {
            id_capteur: $('#confirm-delete').find('#deleteid').val(),
            id_graphe: $('#select_graphique').val()
        };
        /*
        $.ajax({
            url: 'ajax.php?type=graphique&action=deleteAssoGraphe',
            type: 'POST',
            data: $.param(tab),
            async: true,
            success: function(a) {
                */
        $.api('POST','graphique.deleteAssoGraphe',tab).done(function(json){ 
            
            $('#confirm-delete').modal('hide');
            if (json.response) {
                $.growlValidate(lang.valid.delete);
                setTimeout(refreshTableAsso(), 1000);
            }else{
                $.growlErreur(lang.error.deleteAsso);
            }

        });
    }

    function refreshTableGraphe() {
        $("#listeGraphique> tbody").html("");
        //liste deroulante dans la page
        $('#select_graphique').find('option').remove();
        //listen deroulante fenetre modal add /edit
        $('#select_graphe').find('option').remove();

        //$.getJSON("ajax.php?type=graphique&action=getGraphe", function(json) {
        $.api('GET','graphique.getGraphe').done(function(json){ 
            
                $.each(json.data, function(key, val) {
                    //console.log(val);
                    $('#listeGraphique > tbody:last').append('<tr id="' + val.id + '">  <td> \
    																	<button type="button" class="btn btn-default btn-sm"> \
    																		<span class="glyphicon glyphicon-chevron-up upGrp" aria-hidden="true"></span> \
    																	</button> \
                                                                        <button type="button" class="btn btn-default btn-sm"> \
                                                                        	<span class="glyphicon glyphicon-chevron-down downGrp" aria-hidden="true"></span> \
                                                                        </button> \
                                                                    </td> \
                	                                                <td>' + val.name + '</td>  \
                	                                                <td>       \
                	                                                    <button type="button" class="btn btn-default btn-sm" data-toggle="modal" data-target="#modal_graphique"> \
                                                                            <span class="glyphicon glyphicon-edit" aria-hidden="true"></span> \
                                                                        </button> \
                                                                        <button type="button" class="btn btn-default btn-sm" data-toggle="modal" data-target="#confirm-delete"> \
                                                                            <span class="glyphicon glyphicon-trash" aria-hidden="true"></span> \
                                                                        </button> \
                                                                    </td></tr>');
                    //on rempli les listes box pour le tableau d'asso
                    $('#select_graphique').append('<option value="' + val.id + '">' + val.name + '</option>');
                    $('#select_graphe').append('<option value="' + val.id + '">' + val.name + '</option>');

                });
                refreshTableAsso();
        })
        .error(function() {
            $.growlErreur(lang.error.getGraphe);
        });
    }

    function refreshTableAsso() {
        $("#listeAsso > tbody").html("");

        //$.getJSON("ajax.php?type=graphique&action=getGrapheAsso&graphe=" + $('#select_graphique').val(), function(json) {
        $.api('GET','graphique.getGrapheAsso', {graphe: $('#select_graphique').val()}).done(function(json){ 
            
                $.each(json.data, function(key, val) {
                    //console.log(val.group_addr);
                    $('#listeAsso > tbody:last').append('<tr id="'+ val.id +'">  <td> \
    																	<button type="button" class="btn btn-default btn-sm"> \
    																		<span class="glyphicon glyphicon-chevron-up upGrp" aria-hidden="true"></span> \
    																	</button> \
                                                                        <button type="button" class="btn btn-default btn-sm"> \
                                                                        	<span class="glyphicon glyphicon-chevron-down downGrp" aria-hidden="true"></span> \
                                                                        </button> \
                                                                    </td> \
                	                                                <td>' + val.name + '</td>  \
                	                                                <td>' + val.coeff + '</td>  \
                	                                                <td>       \
                	                                                    <button type="button" class="btn btn-default btn-sm" data-toggle="modal" data-target="#modal_asso"> \
                                                                            <span class="glyphicon glyphicon-edit" aria-hidden="true"></span> \
                                                                        </button> \
                                                                        <button type="button" class="btn btn-default btn-sm" data-toggle="modal" data-target="#confirm-delete"> \
                                                                            <span class="glyphicon glyphicon-trash" aria-hidden="true"></span> \
                                                                        </button> \
                                                                    </td></tr>');

                });
        })
        .error(function() {
            $.growlErreur(lang.error.getAsso);
        });
    }


    /************************************************
     * ************ Evenements **********************
     * *********************************************/
    //obligé d'utiliser "on()" car les boutons sont ajoutés apres le chargement de la page
    $("body").on("click", ".btn", function() {

        if ($(this).is("#openModalAddGraphique")) {
            initModalAddGraphe();
        }
        if ($(this).is("#openModalAsso")) {
            initModalAddAsso();
        }

        if ($(this).is("#addGraphique")) {
           if ($("#modal_graphique").find('#typeModal').val() == "add") {
                addGraphe();
            }
            if ($("#modal_graphique").find('#typeModal').val() == "edit") {
                updateGraphe();
            }
        }

        if ($(this).is("#addAsso")) {
            if ($("#modal_asso").find('#typeModal').val() == "add") {
                addAsso();
            }
            if ($("#modal_asso").find('#typeModal').val() == "edit") {
               updateAsso();
            }
        }

        if ($(this).children().is(".glyphicon-edit") && $(this).closest('table').is("#listeGraphique")) { //;
            //console.log('edit');
            initModalUpdateGraphe($(this).closest("tr"));
        }
        if ($(this).children().is(".glyphicon-trash") && $(this).closest('table').is("#listeGraphique")) {
            //console.log('delete');
            initModalDeleteGraphe($(this).closest("tr"));
        }
        if ($(this).children().is(".glyphicon-edit") && $(this).closest('table').is("#listeAsso")) { //;
            //console.log('edit');
            initModalUpdateAsso($(this).closest("tr"));
        }
        if ($(this).children().is(".glyphicon-trash") && $(this).closest('table').is("#listeAsso")) {
            //console.log('delete');
            initModalDeleteAsso($(this).closest("tr"));
        }
        if ($(this).is('#deleteConfirm')) {
            //console.log($('#confirm-delete').find('#typeModal').val());
            if ($('#confirm-delete').find('#typeModal').val() == 'Grph') {
                deleteGraphe();
            }
            if ($('#confirm-delete').find('#typeModal').val() == 'Asso') {
                deleteAssoGraphe();
            }

        }
        
		if($(this).children().is('.upGrp')){
		    var row = $(this).parents("tr:first");
	    	row.insertBefore(row.prev());
	    }
	    if($(this).children().is('.downGrp')){
	        var row = $(this).parents("tr:first");
	    	row.insertAfter(row.next());
	    }








    });

    refreshTableGraphe();
    //refreshTableAsso();

    $('#select_graphique').change(function() {
        refreshTableAsso();
    });
    
    //$.getJSON("ajax.php?type=graphique&action=getCapteurs", function(json) {
    $.api('GET','graphique.getCapteurs').done(function(json){
        
        if (json.response){
            $('#select_capteur').find('option').remove();
			
			$.each(json.data, function(key, val) {
			    //console.log(val);
				$('#select_capteur').append('<option value="' + val.id + '">' + val.name + '</option>');
				$('#select_graphe').attr('disabled', 'disabled');
			});
         }else{
             $.growlErreur(lang.error.getSensor); 
         }
    });


});