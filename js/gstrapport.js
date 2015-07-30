$(document).ready(function() {

    function initModalAddGraphe() {
        $('#modal_graphique').on('show.bs.modal', function() {
            $(this).find('#name').val("");
            $(this).find('#typeModal').val("add");
            $(this).find('#graphiqueTitre').html("Création d'un nouveau graphique");

            $.getJSON("ajax.php?type=graphique&action=getLastGraphePosition", function(json) {

                    var newPosition = (json.data.lastPosition === null) ? 1 : parseInt(json.data.lastPosition) + 1;
                    $('#modal_graphique').find('#position').val(newPosition);

                })
                .error(function() {
                    $.growlErreur("Impossible de récupérer la derniere position");
                });

        });
    }

    function initModalUpdateGraphe(row) {
        $('#modal_graphique').on('show.bs.modal', function() {

            var name = row.find("td:nth-child(2)").text();
            $(this).find('#refName').val(name);
            $(this).find('#name').val(name);
            $(this).find('#typeModal').val("edit");
            $(this).find('#GraphiqueTitre').html("Modification de " + name);
        });
    }

    function initModalDeleteGraphe(row) {
        var name = row.find("td:nth-child(2)").text();

        $('#confirm-delete').on('show.bs.modal', function() {
            $(this).find('.modal-title').html("Confirmez-vous la suppresion de " + name + "?");
            $(this).find('#deleteid').val(name);
            $(this).find('#typeModal').val('Grph');
        });
    }

    function initModalAddAsso() {
        $('#modal_asso').on('show.bs.modal', function() {

            $(this).find('#typeModal').val("add");
            $(this).find('#actionTitre').html("Ajout d'un equipement dans un graphe");

            $.getJSON("ajax.php?type=graphique&action=getGraphe", function(json) {

                    $('#select_graphe').find('option').remove();

                    $.each(json, function(key, val) {
                        //console.log(val);
                        $('#select_graphe').append('<option value="' + val.id + '">' + val.name + '</option>');

                    });
                    $('#select_graphe option[value=' + $('#select_graphique').val() + ']').attr("selected", "selected");
                })
                .error(function() {
                    $.growlErreur("Impossible de récupérer la liste des graphes");
                });
            /*
			$.getJSON("ajax.php?action=conf&data=getEqtEtat", function(json) {

                    $('#select_eqt').find('option').remove();
					
					$.each(json, function(key, val) {
					    //console.log(val);
						$('#select_eqt').append('<option value="' + val.id + '">' + val.group_addr +' - ' + val.name + '</option>');
					});
		    })
			.error(function() {
				$.growlErreur("Impossible de récupérer la liste des Equipements d'etats");
			});*/


        });
    }

    function initModalUpdateAsso(row) {
        $('#modal_asso').on('show.bs.modal', function() {

            $(this).find('#typeModal').val("edit");
            $(this).find('#actionTitre').html("Modification de l'association");

            $.getJSON("ajax.php?type=graphique&data=getGraphe", function(json) {

                    $('#select_graphe').find('option').remove();

                    $.each(json, function(key, val) {
                        //console.log(val);
                        $('#select_graphe').append('<option value="' + val.id + '">' + val.name + '</option>');

                    });
                    $('#select_graphe option[value=' + $('#select_graphique').val() + ']').attr("selected", "selected");
                })
                .error(function() {
                    $.growlErreur("Impossible de récupérer la liste des graphiques");
                });
            /*
			$.getJSON("ajax.php?action=conf&data=getEqtEtat", function(json) {

                    $('#select_eqt').find('option').remove();
					
					$.each(json, function(key, val) {
					    if(val.group_addr ==  row.find("td:nth-child(2)").text()){
					        $('#select_eqt').append('<option value="' + val.id + '" selected=selected>' + val.group_addr +' - ' + val.name + '</option>');
					    }else{
						    $('#select_eqt').append('<option value="' + val.id + '">' + val.group_addr +' - ' + val.name + '</option>');
					    }
					});
					
		    })
		    .done(function (){
						$('#select_eqt').attr('disabled', 'disabled');
			})
			.error(function() {
				$.growlErreur("Impossible de récupérer la liste des equipements d'etat");
			});*/

        });
    }

    function initModalDeleteAsso(row) {
        var name = $('#select_graphique option:selected').text() + " - " + row.find("td:nth-child(3)").text();

        $('#confirm-delete').on('show.bs.modal', function() {
            $(this).find('.modal-title').html("Confirmez-vous la suppresion de " + name + "?");
            $(this).find('#deleteid').val(row.find("td:nth-child(2)").text());
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
        $.getJSON("ajax.php?type=graphique&action=grapheNameExist&name=" + $('#modal_graphique').find('#name').val(), function(json) {
            //console.log(json);
            if (!json.exist) {
                //so le groupe n'existe pas, on enregistre
                $.ajax({
                    url: 'ajax.php?type=graphique&action=addGraphe',
                    type: 'POST',
                    data: $.param(tab),
                    async: false,
                    success: function(a) {

                        $('#modal_graphique').modal('hide');
                        if (a.response) {
                            $.growlValidate("Enregistrement OK");
                            setTimeout(refreshTableGraphe(), 1000);
                        }
                        else {
                            $.growlErreur("Probleme lors de l'enregistrement du graphe");
                        }

                    }
                });


            }
            else {
                $.growlWarning("Attention, le graphe existe déjà");
            }
        });
    }

    function updateGraphe() {
        var tab = {
            refName: $('#modal_graphique').find('#refName').val(),
            name: $('#modal_graphique').find('#name').val()
        };
        //test si le groupe adrress n'est pas déja utilisé
        $.getJSON("ajax.php?action=conf&data=testGrapheExist&name=" + tab.name, function(json) {
            //console.log(json);
            if (json.exist === 0) {
                //so le groupe n'existe pas, on enregistre
                $.ajax({
                    url: 'ajax.php?type=graphique&action=updateGraphe',
                    type: 'POST',
                    data: $.param(tab),
                    async: false,
                    success: function(a) {

                        $('#modal_graphique').modal('hide');
                        if (a.response === true) {
                            $.growlValidate("Modification réussi de " + tab.name);
                            setTimeout(refreshTableGraphe(), 1000);
                        }
                        else {
                            $.growlErreur("Probleme lors de l'enregistrement du graphe");
                        }

                    }
                });


            }
            else {
                $.growlWarning("Attention, le graphe existe déjà");
            }
        });
    }

    function deleteGraphe() {
        var tab = {
            name: $('#confirm-delete').find('#deleteid').val()
        };
        $.ajax({
            url: 'ajax.php?type=graphique&action=deleteGraphe',
            type: 'POST',
            data: $.param(tab),
            async: false,
            success: function(a) {

                $('#confirm-delete').modal('hide');
                if (a.response === true) {
                    $.growlValidate("Suppression réussi de " + tab.name);
                    setTimeout(refreshTableGraphe(), 1000);
                }
                else {
                    $.growlErreur("Problême lors de la suppresion du graphe " + tab.name);
                }

            }
        });
    }

    function addAsso() {
        var tab = {
            id_graphe: $('#modal_asso').find('#select_graphe').val(),
            id_eqt: $('#modal_asso').find('#select_eqt').val(),
            position: 1
        };
        //console.log(tab.position);
        //test si le groupe adrress n'est pas déja utilisé
        $.getJSON("ajax.php?type=graphique&action=testAssoGrapheExist&graphe=" + $('#modal_asso').find('#select_graphe').val() + "&eqt=" + $('#modal_asso').find('#select_eqt').val(), function(json) {
            //console.log(json);
            if (json.exist === 0) {
                //so l'asso n'existe pas, on enregistre
                $.ajax({
                    url: 'ajax.php?type=graphique&action=addGrapheAsso',
                    type: 'POST',
                    data: $.param(tab),
                    async: false,
                    success: function(a) {

                        $('#modal_asso').modal('hide');
                        if (a.response === true) {
                            $.growlValidate("Enregistrement OK");
                            setTimeout(refreshTableAsso(), 1000);
                        }
                        else {
                            $.growlErreur("Probleme lors de l'enregistrement de l'association");
                        }

                    }
                });


            }
            else {
                $.growlWarning("Attention, le couple Graphique + Capteur existe déjà");
            }
        });
    }

    function updateAsso() {
        var tab = {
            id_graphe: $('#modal_asso').find('#select_graphe').val(),
            id_eqt: $('#modal_asso').find('#select_eqt').val(),
            position: 1
        };
        //test si le groupe adrress n'est pas déja utilisé
        $.getJSON("ajax.php?type=graphique&action=testAssoGrapheExist&graphe=" + tab.id_graphe + "&eqt=" + tab.id_eqt, function(json) {
            //console.log(json);
            if (json.exist === 0) {
                //so l'asso n'existe pas, on enregistre
                $.ajax({
                    url: 'ajax.php?type=graphique&action=updateGrapheAsso',
                    type: 'POST',
                    data: $.param(tab),
                    async: false,
                    success: function(a) {

                        $('#modal_asso').modal('hide');
                        if (a.response === true) {
                            $.growlValidate("Modification réussi");
                            setTimeout(refreshTableAsso(), 1000);
                        }
                        else {
                            $.growlErreur("Probleme lors de la mise à jour de l'association");
                        }

                    }
                });


            }
            else {
                $.growlWarning("Attention, le couple Graphique + Capteur existe déjà");
            }
        });
    }

    function deleteAssoGraphe() {
        var tab = {
            eqt: $('#confirm-delete').find('#deleteid').val(),
            id_graphe: $('#select_graphique').val()
        };
        $.ajax({
            url: 'ajax.php?type=graphique&action=deleteAssoGraphe',
            type: 'POST',
            data: $.param(tab),
            async: false,
            success: function(a) {

                $('#confirm-delete').modal('hide');
                if (a.response === true) {
                    $.growlValidate("Suppression réussi");
                    setTimeout(refreshTableAsso(), 1000);
                }
                else {
                    $.growlErreur("Problême lors de la suppresion de l'association");
                }

            }
        });
    }

    function refreshTableGraphe() {
        $("#listeGraphique> tbody").html("");
        $('#select_graphique').find('option').remove();
        // $('#select_groupe').find('option').remove();

        $.getJSON("ajax.php?type=graphique&action=getGraphe", function(json) {

                $.each(json.data, function(key, val) {
                    console.log(val);
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


                });
                refreshTableAsso();
            })
            .error(function() {
                $.growlErreur("Impossible de charger la liste des graphiques !!");
            });
    }

    function refreshTableAsso() {
        $("#listeAsso > tbody").html("");

        $.getJSON("ajax.php?type=graphique&action=getGrapheAsso&graphe=" + $('#select_graphique').val(), function(json) {

                $.each(json, function(key, val) {
                    //console.log(val.group_addr);
                    $('#listeAsso > tbody:last').append('<tr>  <td> \
    																	<button type="button" class="btn btn-default btn-sm"> \
    																		<span class="glyphicon glyphicon-chevron-up upGrp" aria-hidden="true"></span> \
    																	</button> \
                                                                        <button type="button" class="btn btn-default btn-sm"> \
                                                                        	<span class="glyphicon glyphicon-chevron-down downGrp" aria-hidden="true"></span> \
                                                                        </button> \
                                                                    </td> \
                	                                                <td>' + val.group_addr + '</td>  \
                	                                                <td>' + val.name + '</td>  \
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
                $.growlErreur("Impossible de charger la liste des associations !!");
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
            //console.log($("#modal_action").find('#typeModal').val());
            if ($("#modal_graphique").find('#typeModal').val() == "add") {
                addGraphe();
            }
            if ($("#modal_graphique").find('#typeModal').val() == "edit") {
                //console.log('update');
                updateGraphe();
            }
        }

        if ($(this).is("#addAsso")) {
            //console.log($("#modal_action").find('#typeModal').val());
            if ($("#modal_asso").find('#typeModal').val() == "add") {
                addAsso();
            }
            if ($("#modal_asso").find('#typeModal').val() == "edit") {
                //console.log('update');
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
            console.log($('#confirm-delete').find('#typeModal').val());
            if ($('#confirm-delete').find('#typeModal').val() == 'Grph') {
                deleteGraphe();
            }
            if ($('#confirm-delete').find('#typeModal').val() == 'Asso') {
                deleteAssoGraphe();
            }

        }
        /*
		if($(this).children().is('.upGrp')){
		    row = $(this).parents("tr:first");
	    	row.insertBefore(row.prev());
	    }
	    if($(this).children().is('.downGrp')){
	        row = $(this).parents("tr:first");
	    	row.insertAfter(row.next());
	    }*/








    });

    refreshTableGraphe();

    $('#select_graphique').change(function() {
        refreshTableAsso();
    });


});